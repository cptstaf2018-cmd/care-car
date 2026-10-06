import io, os, re, base64, requests
from statistics import mean

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

# ── FastALPR optional plate engine ────────────────────────────────────────────
try:
    from fast_alpr import ALPR
    FAST_ALPR_AVAILABLE = True
    _fast_alpr = None
except Exception:
    FAST_ALPR_AVAILABLE = False
    _fast_alpr = None

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


def _get_fast_alpr():
    global _fast_alpr
    if _fast_alpr is None and FAST_ALPR_AVAILABLE:
        try:
            _fast_alpr = ALPR(
                detector_model='yolo-v9-t-640-license-plate-end2end',
                detector_conf_thresh=0.2,
                ocr_model='cct-s-v1-global-model',
                ocr_device='cpu',
            )
        except Exception:
            return None
    return _fast_alpr

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

ARABIC_DIGITS = str.maketrans('٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789')
OCR_DIGIT_FIXES = str.maketrans({
    'O': '0',
    'o': '0',
    'Q': '0',
    'I': '1',
    'l': '1',
    'L': '1',
    '|': '1',
    'Z': '2',
    'z': '2',
    'S': '5',
    's': '5',
    'B': '8',
})
IRAQ_PLATE_WORDS = {
    'بغداد', 'البصرة', 'بصرة', 'نينوى', 'الموصل', 'موصل', 'اربيل', 'أربيل', 'دهوك',
    'السليمانية', 'سليمانية', 'كركوك', 'ديالى', 'الانبار', 'الأنبار', 'بابل',
    'كربلاء', 'النجف', 'نجف', 'واسط', 'ذيقار', 'ذي قار', 'ميسان', 'المثنى',
    'الديوانية', 'ديوانية', 'صلاحالدين', 'صلاح الدين',
}


def extract_car_brand(text: str) -> str:
    if not text:
        return ''
    lower = text.lower()
    for brand in CAR_BRANDS:
        if brand.lower() in lower:
            idx = lower.find(brand.lower())
            return text[idx:idx+len(brand)].strip()
    return ''


def normalize_plate_text(text: str) -> str:
    if not text:
        return ''
    text = text.translate(ARABIC_DIGITS)
    text = text.replace('ـ', '').replace('-', ' ').replace('_', ' ')
    text = re.sub(r'[^\w؀-ۿ]+', ' ', text, flags=re.UNICODE)
    return re.sub(r'\s+', ' ', text).strip().upper()


def normalize_plate_candidate(text: str) -> str:
    text = normalize_plate_text(text)
    if not text:
        return ''
    parts = []
    for part in text.split():
        has_digit = any(ch.isdigit() for ch in part)
        if has_digit:
            part = part.translate(OCR_DIGIT_FIXES)
        parts.append(part)
    text = ' '.join(parts)
    text = re.sub(r'\s+', ' ', text).strip()
    digits = re.sub(r'\D', '', text)
    arabic_words = re.findall(r'[؀-ۿ]+', text)
    for word in arabic_words:
        if len(word) > 1 and word not in IRAQ_PLATE_WORDS:
            return ''
    if text.isdigit() and not (3 <= len(text) <= 8):
        return ''
    if digits and not (3 <= len(digits) <= 8):
        return ''
    return text


def extract_plate_candidates(text: str) -> list[str]:
    text = normalize_plate_text(text)
    if not text:
        return []

    candidates = []
    patterns = [
        r'[؀-ۿ]{1,8}\s*[0-9OQILl|ZSBo]{3,8}',
        r'[0-9OQILl|ZSBo]{3,8}\s*[؀-ۿ]{1,8}',
        r'[A-Z]{1,4}\s*[0-9OQILl|ZSBo]{3,8}',
        r'[0-9OQILl|ZSBo]{3,8}\s*[A-Z]{1,4}',
        r'[0-9OQILl|ZSBo]{4,8}',
    ]
    for pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            candidate = normalize_plate_candidate(match.group(0))
            if candidate and candidate not in candidates:
                candidates.append(candidate)
    return candidates[:6]


def _bytes_to_cv2(image_bytes: bytes):
    if not NUMPY_AVAILABLE or not CV2_AVAILABLE:
        return None
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def fast_alpr_plate_candidates(image_bytes: bytes) -> list[str]:
    """Read Latin plate candidates with FastALPR when available."""
    return [read["plate"] for read in fast_alpr_plate_reads(image_bytes)]


def _ocr_confidence(ocr) -> float:
    for attr in ("confidence", "conf", "score", "probability"):
        value = getattr(ocr, attr, None)
        if value is not None:
            try:
                if isinstance(value, list):
                    value = mean([float(item) for item in value]) if value else 0
                value = float(value)
                return value / 100 if value > 1 else value
            except (TypeError, ValueError):
                pass
    return 0.75


def _alpr_image_candidates(img) -> list:
    candidates = [img]
    height, width = img.shape[:2]
    lower_half = img[int(height * 0.45):, :]
    if lower_half.size:
        candidates.append(lower_half)

    for crop in list(candidates):
        try:
            lab = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB)
            l_channel, a_channel, b_channel = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
            l_channel = clahe.apply(l_channel)
            enhanced = cv2.merge((l_channel, a_channel, b_channel))
            enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
            blur = cv2.GaussianBlur(enhanced, (0, 0), 1.0)
            candidates.append(cv2.addWeighted(enhanced, 1.4, blur, -0.4, 0))
        except Exception:
            pass
        if crop.shape[1] < 900:
            scale = min(4.0, 900 / max(crop.shape[1], 1))
            candidates.append(cv2.resize(
                crop,
                (int(crop.shape[1] * scale), int(crop.shape[0] * scale)),
                interpolation=cv2.INTER_CUBIC,
            ))
    return candidates


def fast_alpr_plate_reads(image_bytes: bytes) -> list[dict]:
    """Read Latin plate candidates with normalized confidence metadata."""
    if not NUMPY_AVAILABLE or not CV2_AVAILABLE or not FAST_ALPR_AVAILABLE:
        return []
    alpr = _get_fast_alpr()
    if not alpr:
        return []
    img = _bytes_to_cv2(image_bytes)
    if img is None:
        return []
    reads = []
    seen = set()
    for candidate_img in _alpr_image_candidates(img):
        try:
            results = alpr.predict(candidate_img)
        except Exception:
            continue
        for result in results or []:
            ocr = getattr(result, 'ocr', None)
            text = getattr(ocr, 'text', '') if ocr else ''
            candidate = normalize_plate_candidate(text)
            if candidate and candidate not in seen:
                seen.add(candidate)
                detection = getattr(result, 'detection', None)
                box = getattr(detection, 'bounding_box', None)
                bbox = None
                if box is not None:
                    bbox = [
                        int(getattr(box, 'x1', 0)),
                        int(getattr(box, 'y1', 0)),
                        int(getattr(box, 'x2', 0)),
                        int(getattr(box, 'y2', 0)),
                    ]
                reads.append({"plate": candidate, "confidence": _ocr_confidence(ocr), "bbox": bbox})
    return sorted(reads, key=lambda item: item.get("confidence", 0), reverse=True)[:4]


def _cv2_to_bytes(img, quality=95) -> bytes:
    if not CV2_AVAILABLE:
        return b""
    _, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return buf.tobytes()


def estimate_vehicle_color(image_bytes: bytes, box: dict | None = None) -> str:
    """Estimate a broad vehicle color from the image when MMC color is not available."""
    img = _bytes_to_cv2(image_bytes)
    if img is None:
        return ''
    try:
        if box:
            h, w = img.shape[:2]
            x1 = max(0, min(w - 1, int(box.get('xmin', 0))))
            y1 = max(0, min(h - 1, int(box.get('ymin', 0))))
            x2 = max(x1 + 1, min(w, int(box.get('xmax', w))))
            y2 = max(y1 + 1, min(h, int(box.get('ymax', h))))
            img = img[y1:y2, x1:x2]

        h, w = img.shape[:2]
        if h < 20 or w < 20:
            return ''
        sample = img[int(h * 0.18):int(h * 0.78), int(w * 0.12):int(w * 0.88)]
        hsv = cv2.cvtColor(sample, cv2.COLOR_BGR2HSV)
        pixels = hsv.reshape(-1, 3)
        pixels = pixels[pixels[:, 2] > 35]
        if len(pixels) < 50:
            return ''

        hue = pixels[:, 0]
        sat = pixels[:, 1]
        val = pixels[:, 2]
        if float(np.mean(val)) > 205 and float(np.mean(sat)) < 45:
            return 'أبيض'
        if float(np.mean(val)) < 70:
            return 'أسود'
        if float(np.mean(sat)) < 45:
            return 'فضي'

        counts = {
            'أحمر': int(np.sum((hue < 10) | (hue > 165))),
            'أصفر': int(np.sum((hue >= 18) & (hue <= 38))),
            'أخضر': int(np.sum((hue >= 39) & (hue <= 85))),
            'أزرق': int(np.sum((hue >= 86) & (hue <= 135))),
            'بني': int(np.sum((hue >= 8) & (hue < 18) & (sat > 70))),
        }
        color, count = max(counts.items(), key=lambda item: item[1])
        return color if count / max(len(pixels), 1) > 0.12 else ''
    except Exception:
        return ''


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

    # Method 3: OpenCV contour fallback for production installs without YOLO.
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.bilateralFilter(gray, 11, 17, 17)
        edged = cv2.Canny(gray, 30, 200)
        contours, _ = cv2.findContours(edged, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        h, w = img.shape[:2]
        candidates = []
        for contour in contours:
            x, y, cw, ch = cv2.boundingRect(contour)
            if cw <= 0 or ch <= 0:
                continue
            area = cw * ch
            ratio = cw / ch
            if area < (w * h * 0.002) or area > (w * h * 0.35):
                continue
            if 1.8 <= ratio <= 7.5:
                y_center = y + ch / 2
                score = area * (1.3 if y_center > h * 0.35 else 1.0)
                candidates.append((score, x, y, cw, ch))
        if candidates:
            _, x, y, cw, ch = max(candidates, key=lambda item: item[0])
            pad_x = max(8, int(cw * 0.08))
            pad_y = max(6, int(ch * 0.20))
            x1 = max(0, x - pad_x)
            y1 = max(0, y - pad_y)
            x2 = min(w, x + cw + pad_x)
            y2 = min(h, y + ch + pad_y)
            crop = img[y1:y2, x1:x2]
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
            return '\n'.join(texts).strip()
    except Exception:
        pass
    return ''


def _tesseract_read_bytes(image_bytes: bytes, lang: str = 'ara+eng') -> str:
    if not TESSERACT_AVAILABLE:
        return ''

    configs = [
        '--psm 6 --oem 1',
        '--psm 11 --oem 1',
        '--psm 4 --oem 1',
    ]
    texts = []
    for mode in ('gray', 'contrast', 'threshold', 'sharp'):
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert('L')
            w, h = pil_img.size
            scale = 3 if max(w, h) < 1600 else 2
            pil_img = pil_img.resize((w * scale, h * scale), Image.LANCZOS)
            pil_img = ImageEnhance.Contrast(pil_img).enhance(2.4)
            if mode == 'threshold':
                pil_img = pil_img.point(lambda p: 255 if p > 165 else 0)
            elif mode == 'sharp':
                pil_img = pil_img.filter(ImageFilter.SHARPEN)
            for config in configs:
                text = pytesseract.image_to_string(pil_img, lang=lang, config=config).strip()
                if text and text not in texts:
                    texts.append(text)
        except Exception:
            pass
    return '\n'.join(texts).strip()


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

    text = _paddle_read_bytes(image_bytes)
    if text:
        return text

    return _tesseract_read_bytes(image_bytes)


def read_receipt_text_from_image(image_bytes: bytes) -> str:
    text = read_text_from_image(image_bytes)
    if text:
        return text

    # Some receipt photos have small table text; crop the center and retry OCR.
    img = _bytes_to_cv2(image_bytes)
    if img is None:
        return ''
    try:
        h, w = img.shape[:2]
        crops = [
            img[int(h * 0.18):int(h * 0.88), int(w * 0.05):int(w * 0.95)],
            img[int(h * 0.28):int(h * 0.78), int(w * 0.10):int(w * 0.90)],
        ]
        texts = []
        for crop in crops:
            crop_bytes = _cv2_to_bytes(crop, quality=98)
            crop_text = _paddle_read_bytes(crop_bytes) or _tesseract_read_bytes(crop_bytes)
            if crop_text:
                texts.append(crop_text)
        return '\n'.join(texts).strip()
    except Exception:
        return ''


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

    targets = []
    if plate_bytes:
        targets.append(plate_bytes)
    targets.append(image_bytes)

    # PaddleOCR on cropped plate
    if PADDLE_AVAILABLE:
        for target in targets:
            text = _paddle_read_bytes(target)
            plate = _extract_plate(text)
            if plate:
                return plate

    # Tesseract fallback
    if TESSERACT_AVAILABLE:
        configs = [
            '--psm 7 --oem 1',
            '--psm 8 --oem 1',
            '--psm 11 --oem 1',
            '--psm 6 --oem 1',
        ]
        for target in targets:
            for mode in ('gray', 'threshold', 'sharp'):
                try:
                    pil_img = Image.open(io.BytesIO(target)).convert('L')
                    w, h = pil_img.size
                    scale = 3 if max(w, h) < 1200 else 2
                    pil_img = pil_img.resize((w * scale, h * scale), Image.LANCZOS)
                    pil_img = ImageEnhance.Contrast(pil_img).enhance(2.8)
                    if mode == 'threshold':
                        pil_img = pil_img.point(lambda p: 255 if p > 145 else 0)
                    elif mode == 'sharp':
                        pil_img = pil_img.filter(ImageFilter.SHARPEN)
                    for config in configs:
                        text = pytesseract.image_to_string(pil_img, lang='ara+eng', config=config)
                        plate = _extract_plate(text)
                        if plate:
                            return plate
                except Exception:
                    pass

    return ''


def _extract_plate(text: str) -> str:
    candidates = extract_plate_candidates(text)
    return candidates[0] if candidates else ''


def _receipt_item_key(name: str) -> str:
    text = (name or '').translate(ARABIC_DIGITS).lower()
    text = re.sub(r'(?<=\d)wa0\b', 'w40', text, flags=re.IGNORECASE)
    text = re.sub(r'(?<=\d)wao\b', 'w40', text, flags=re.IGNORECASE)
    text = re.sub(r'(?<=\d)w4o\b', 'w40', text, flags=re.IGNORECASE)
    replacements = {
        'أ': 'ا',
        'إ': 'ا',
        'آ': 'ا',
        'ة': 'ه',
        'ى': 'ي',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = re.sub(r'[^a-z0-9؀-ۿ]+', ' ', text, flags=re.UNICODE)
    text = re.sub(r'\b(وحده|حبه|عدد|قطعه|لتر|علبه|كرتون|pcs?|unit)\b', ' ', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+', ' ', text).strip()
    tokens = [token for token in text.split() if len(token) > 1]
    text = ' '.join(tokens)
    compact = text.replace(' ', '')

    viscosity = re.search(r'\d{1,2}w\d{2}', compact, flags=re.IGNORECASE)
    if 'زيت' in compact and 'محرك' in compact:
        return f"زيتمحرك{viscosity.group(0).lower() if viscosity else ''}"
    if 'فلتر' in compact and 'زيت' in compact:
        return 'فلترزيت'
    if 'فلتر' in compact and 'هواء' in compact:
        return 'فلترهواء'
    if 'فلتر' in compact and 'مكيف' in compact:
        return 'فلترمكيف'
    if 'سائل' in compact and 'تبريد' in compact:
        return 'سائلتبريد'
    if 'شمع' in compact or 'بواجي' in compact:
        return 'شمعات'
    return compact


def _receipt_item_score(item: dict) -> tuple:
    name = item.get('oil_type') or item.get('name') or ''
    quantity = float(item.get('quantity') or 0)
    unit_cost = float(item.get('unit_cost') or item.get('price') or 0)
    plausible_cost = 0 < unit_cost <= 500
    plausible_quantity = 0 < quantity <= 20
    return (1 if plausible_cost else 0, 1 if plausible_quantity else 0, unit_cost if plausible_cost else 0, len(name))


def parse_receipt_text(text: str) -> list:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    items = []
    noise_words = (
        'date', 'customer', 'total', 'subtotal', 'kwd', 'iqd', 'receipt', 'received',
        'tel', 'www', 'http', 'city', 'car:', 'plate', 'authentic', 'detailed', 'photo',
        'التاريخ', 'المجموع', 'الاجمالي', 'الإجمالي', 'الزبون', 'العميل', 'المورد',
        'وصل', 'فاتورة', 'شركة', 'خدمات', 'السيارات', 'سيارة', 'توقيع', 'تفويض',
    )
    product_words = (
        'زيت', 'فلتر', 'مكيف', 'هواء', 'بواجي', 'بطارية', 'إطار', 'اطار', 'تاير',
        'سفايف', 'بريك', 'رديتر', 'ماء', 'سائل', 'كلينر', 'بخاخ', 'لمبة', 'حساس',
        'كفر', 'كفرات', 'جلنط', 'قشاط', 'سير', 'بستم', 'هوب', 'دهن', 'شحم',
        'فحمات', 'قماشات', 'دسكات', 'دينمو', 'سلف', 'كويل', 'كمبرسر', 'ثلاجة',
        'ليزر', 'افلتر', 'فلانت', 'تيوتا', 'تويوتا', 'شمعات', 'شمعة', 'شمعه',
        'oil', 'filter', 'spark', 'plug', 'battery', 'brake', 'coolant', 'tire', 'tyre',
        'wiper', 'bulb', 'sensor', 'compressor',
    )
    unit_words = (
        'وحدة', 'حبة', 'عدد', 'قطعة', 'لتر', 'علبة', 'كرتون', 'pcs', 'pc', 'unit',
    )
    seen_items = {}
    for line in lines:
        normalized = line.translate(ARABIC_DIGITS)
        normalized = re.sub(r'(?<=\d)[\-:](?=\d{2}\b)', '.', normalized)
        lower = normalized.lower()
        if any(word in lower for word in noise_words):
            continue

        number_pattern = r'(?<![\w-])\d[\d,]*(?:\.\d+)?(?![\w-])'
        numbers = re.findall(number_pattern, normalized)
        if not numbers:
            continue

        text_part = re.sub(number_pattern, ' ', normalized)
        text_part = re.sub(r'[^\w؀-ۿ\- ]+', ' ', text_part, flags=re.UNICODE)
        has_unit_word = any(word in lower for word in unit_words)
        name = re.sub(r'\b(وحدة|حبة|عدد|قطعة|لتر|علبة|كرتون|pcs?|unit)\b', ' ', text_part, flags=re.IGNORECASE)
        name = re.sub(r'\s+', ' ', name).strip(' -')
        name = re.sub(r'^(?:[A-Za-z]{1,2}|[اأإآو])\s+', '', name).strip()
        if len(name) < 2:
            continue
        has_product_word = any(word in name.lower() for word in product_words)
        if not has_product_word and not has_unit_word:
            continue
        if not re.search(r'[؀-ۿA-Za-z]{3,}', name):
            continue

        try:
            parsed_numbers = [float(value.replace(',', '')) for value in numbers]
        except ValueError:
            continue

        quantity = 1.0
        unit_cost = None
        if len(parsed_numbers) >= 2:
            price_candidates = [value for value in parsed_numbers if value > 1]
            unit_cost = max(price_candidates or parsed_numbers)
            quantity_candidates = [
                value for value in parsed_numbers
                if value != unit_cost and float(value).is_integer() and 0 < value <= 100
            ]
            quantity = quantity_candidates[0] if quantity_candidates else 1.0
        else:
            unit_cost = parsed_numbers[0]

        item = {
            "oil_type": name,
            "name": name,
            "quantity": quantity,
            "unit_cost": unit_cost,
            "price": unit_cost,
        }
        key = _receipt_item_key(name)
        if key in seen_items:
            current = seen_items[key]
            if _receipt_item_score(item) > _receipt_item_score(current):
                seen_items[key] = item
            continue
        seen_items[key] = item
        items.append(item)

    return list(seen_items.values())
