import io, os, re, base64, requests

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

try:
    import cv2
    CV2_AVAILABLE = True
except Exception:
    CV2_AVAILABLE = False

# ── Specialized License Plate Detection Model ─────────────────────────────────
try:
    from ultralytics import YOLO
    # Try specialized plate model first
    _plate_detector = None
    _car_detector = None
    for model_name in ['license_plate_detector.pt', '/app/license_plate_detector.pt']:
        try:
            _plate_detector = YOLO(model_name)
            break
        except Exception:
            pass
    # Car detector fallback
    try:
        _car_detector = YOLO('yolov8n.pt')
    except Exception:
        pass
    YOLO_AVAILABLE = _plate_detector is not None or _car_detector is not None
except Exception:
    YOLO_AVAILABLE = False
    _plate_detector = None
    _car_detector = None

# ── PaddleOCR (local fallback) ────────────────────────────────────────────────
try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
    _paddle = None
except Exception:
    PADDLE_AVAILABLE = False
    _paddle = None

def _get_paddle():
    global _paddle
    if _paddle is None and PADDLE_AVAILABLE:
        try:
            _paddle = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False, show_log=False)
        except Exception:
            pass
    return _paddle

# ── Tesseract fallback ────────────────────────────────────────────────────────
try:
    import pytesseract
    from PIL import Image, ImageFilter, ImageEnhance
    TESSERACT_AVAILABLE = True
except Exception:
    TESSERACT_AVAILABLE = False

VISION_API_KEY = os.getenv("GOOGLE_VISION_API_KEY", "")
VISION_URL = "https://vision.googleapis.com/v1/images:annotate"

CAR_BRANDS = [
    'toyota','kia','hyundai','nissan','honda','mazda','bmw','mercedes','chevrolet',
    'ford','mitsubishi','isuzu','suzuki','daewoo','gmc','jeep','lexus','infiniti',
    'land rover','range rover','volkswagen','audi','volvo','peugeot','renault',
    'fiat','dodge','cadillac',
    'تويوتا','كيا','هيونداي','نيسان','هوندا','مازدا','مرسيدس','شيفروليه',
    'فورد','ميتسوبيشي','سوزوكي','جي ام سي','جيب','لكزس','لاند روفر',
    'فولكسواغن','اودي','بيجو','رينو','فيات','دودج',
]


def extract_car_brand(text: str) -> str:
    if not text:
        return ''
    lower = text.lower()
    for brand in CAR_BRANDS:
        if brand.lower() in lower:
            idx = lower.find(brand.lower())
            return text[idx:idx+len(brand)].strip()
    return ''


def _bytes_to_cv2(image_bytes: bytes):
    if not NUMPY_AVAILABLE or not CV2_AVAILABLE:
        return None
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def _cv2_to_bytes(img, quality=95) -> bytes:
    if not CV2_AVAILABLE:
        return b""
    _, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return buf.tobytes()


def detect_plate_crop(image_bytes: bytes):
    """Detect and crop plate region. Returns bytes or None."""
    img = _bytes_to_cv2(image_bytes)
    if img is None:
        return None

    # Method 1: Specialized plate detector (most accurate)
    if _plate_detector is not None:
        try:
            results = _plate_detector(img, verbose=False, conf=0.35)
            best = None
            best_conf = 0
            for r in results:
                for box in r.boxes:
                    conf = float(box.conf[0])
                    if conf > best_conf:
                        best_conf = conf
                        best = box
            if best is not None:
                x1, y1, x2, y2 = map(int, best.xyxy[0])
                pad = 8
                x1, y1 = max(0, x1-pad), max(0, y1-pad)
                x2, y2 = min(img.shape[1], x2+pad), min(img.shape[0], y2+pad)
                crop = img[y1:y2, x1:x2]
                if crop.size > 100:
                    return _cv2_to_bytes(crop)
        except Exception:
            pass

    # Method 2: Car detector → bottom 30% crop
    if _car_detector is not None:
        try:
            results = _car_detector(img, classes=[2, 5, 7], verbose=False, conf=0.25)
            best_box = None
            best_area = 0
            for r in results:
                for box in r.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    area = (x2-x1) * (y2-y1)
                    if area > best_area:
                        best_area = area
                        best_box = (x1, y1, x2, y2)
            if best_box:
                x1, y1, x2, y2 = best_box
                h = y2 - y1
                py1 = max(0, y2 - int(h * 0.30))
                crop = img[py1:y2, x1:x2]
                if crop.size > 100:
                    return _cv2_to_bytes(crop)
        except Exception:
            pass

    return None


def _enhance_plate(crop_bytes: bytes) -> bytes:
    """Enhance plate image for better OCR."""
    if not NUMPY_AVAILABLE or not CV2_AVAILABLE:
        return crop_bytes
    try:
        arr = np.frombuffer(crop_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        h, w = img.shape[:2]
        # Scale up to at least 200px height
        scale = max(1, 200 // max(h, 1))
        if scale > 1:
            img = cv2.resize(img, (w*scale, h*scale), interpolation=cv2.INTER_CUBIC)
        # CLAHE contrast
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4, 4))
        l = clahe.apply(l)
        img = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)
        return _cv2_to_bytes(img, quality=98)
    except Exception:
        return crop_bytes


def _paddle_read_bytes(image_bytes: bytes) -> str:
    if not NUMPY_AVAILABLE or not CV2_AVAILABLE:
        return ''
    paddle = _get_paddle()
    if not paddle:
        return ''
    try:
        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        result = paddle.ocr(img, cls=True)
        if result and result[0]:
            texts = [line[1][0] for line in result[0] if line and line[1][1] > 0.3]
            return ' '.join(texts).strip()
    except Exception:
        pass
    return ''


def read_text_from_image(image_bytes: bytes) -> str:
    if VISION_API_KEY:
        try:
            payload = {"requests": [{"image": {"content": base64.b64encode(image_bytes).decode()},
                                     "features": [{"type": "TEXT_DETECTION"}]}]}
            r = requests.post(VISION_URL, params={"key": VISION_API_KEY}, json=payload, timeout=10)
            r.raise_for_status()
            anns = r.json().get("responses", [{}])[0].get("textAnnotations", [])
            if anns:
                return anns[0].get("description", "").strip()
        except Exception:
            pass
    return _paddle_read_bytes(image_bytes)


def read_plate_from_image(image_bytes: bytes) -> str:
    if VISION_API_KEY:
        try:
            payload = {"requests": [{"image": {"content": base64.b64encode(image_bytes).decode()},
                                     "features": [{"type": "TEXT_DETECTION"}]}]}
            r = requests.post(VISION_URL, params={"key": VISION_API_KEY}, json=payload, timeout=10)
            r.raise_for_status()
            anns = r.json().get("responses", [{}])[0].get("textAnnotations", [])
            if anns:
                return _extract_plate(anns[0].get("description", ""))
        except Exception:
            pass

    # Detect & crop plate
    plate_bytes = detect_plate_crop(image_bytes)
    if plate_bytes:
        plate_bytes = _enhance_plate(plate_bytes)

    target = plate_bytes if plate_bytes else image_bytes

    # PaddleOCR on cropped plate
    if PADDLE_AVAILABLE:
        text = _paddle_read_bytes(target)
        plate = _extract_plate(text)
        if plate:
            return plate
        # Try full image if crop gave nothing
        if plate_bytes:
            text2 = _paddle_read_bytes(image_bytes)
            plate2 = _extract_plate(text2)
            if plate2:
                return plate2

    # Tesseract fallback
    if TESSERACT_AVAILABLE:
        try:
            pil_img = Image.open(io.BytesIO(target)).convert('L')
            w, h = pil_img.size
            pil_img = pil_img.resize((w*3, h*3), Image.LANCZOS)
            pil_img = ImageEnhance.Contrast(pil_img).enhance(2.5)
            pil_img = pil_img.filter(ImageFilter.SHARPEN)
            text = pytesseract.image_to_string(pil_img, lang='ara+eng', config='--psm 7 --oem 1')
            return _extract_plate(text)
        except Exception:
            pass

    return ''


def _extract_plate(text: str) -> str:
    if not text:
        return ''
    text = re.sub(r'\s+', ' ', text.strip())
    m = re.search(r'[؀-ۿ]{1,3}\s*\d{3,6}', text)
    if m:
        return m.group(0).strip()
    m = re.search(r'\d{3,6}\s*[؀-ۿ]{1,3}', text)
    if m:
        return m.group(0).strip()
    m = re.search(r'[A-Z]{1,3}\s*\d{3,6}', text, re.IGNORECASE)
    if m:
        return m.group(0).strip()
    m = re.search(r'\d{4,8}', text)
    if m:
        return m.group(0)
    m = re.search(r'[٠-٩]{4,8}', text)
    if m:
        return m.group(0)
    return ''


def parse_receipt_text(text: str) -> list:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    items = []
    for line in lines:
        m = re.search(r'(\d[\d,]*(?:\.\d+)?)', line)
        if m:
            try:
                items.append({"name": line[:m.start()].strip() or line,
                               "price": float(m.group(1).replace(",", ""))})
            except ValueError:
                pass
    return items
