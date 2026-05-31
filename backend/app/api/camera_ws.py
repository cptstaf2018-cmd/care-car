import asyncio
import base64
import json
import logging
import time
import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.tenant import Tenant
from app.models.car import Car
from app.models.user import Role
from app.services.vision_service import detect_plate_crop, _enhance_plate, _paddle_read_bytes, _extract_plate, _bytes_to_cv2, _cv2_to_bytes, estimate_vehicle_color

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_ROLES = {Role.manager.value, Role.employee.value}
PLATE_COOLDOWN = 10.0  # seconds before same plate triggers again

try:
    import supervision as sv
    SUPERVISION_AVAILABLE = True
except Exception:
    SUPERVISION_AVAILABLE = False

try:
    from app.services.vision_service import _plate_detector, _car_detector
    from ultralytics import YOLO
    YOLO_CAM_AVAILABLE = _plate_detector is not None or _car_detector is not None
except Exception:
    YOLO_CAM_AVAILABLE = False
    _plate_detector = None
    _car_detector = None


def _frame_to_b64(frame) -> str:
    _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 65])
    return base64.b64encode(buf.tobytes()).decode()


COLOR_AR = {
    "black": "أسود",
    "blue": "أزرق",
    "brown": "بني",
    "green": "أخضر",
    "red": "أحمر",
    "silver": "فضي",
    "white": "أبيض",
    "yellow": "أصفر",
    "unknown": "",
}

TYPE_AR = {
    "Big Truck": "شاحنة",
    "Bus": "باص",
    "Motorcycle": "دراجة",
    "Pickup Truck": "بيك أب",
    "Sedan": "سيدان",
    "SUV": "SUV",
    "Van": "فان",
    "Unknown": "",
}


def _plate_recognizer_sync(image_bytes: bytes, token: str) -> dict:
    """Call Plate Recognizer API synchronously."""
    try:
        import requests
        resp = requests.post(
            'https://api.platerecognizer.com/v1/plate-reader/',
            data={
                'mmc': 'true',
                'config': json.dumps({'threshold_d': 0.15, 'threshold_o': 0.35}),
            },
            files={'upload': ('plate.jpg', image_bytes, 'image/jpeg')},
            headers={'Authorization': f'Token {token}'},
            timeout=10,
        )
        if resp.ok:
            results = resp.json().get('results', [])
            if results:
                r = results[0]
                make_model = (r.get('model_make') or [{}])[0]
                make = make_model.get('make', '')
                model = make_model.get('model', '')
                vehicle_type = (r.get('vehicle') or {}).get('type', '')
                color_raw = ((r.get('color') or [{}])[0].get('color') or '').lower()
                car_type = f"{make} {model}".strip()
                if not car_type and vehicle_type and vehicle_type.lower() != 'unknown':
                    car_type = TYPE_AR.get(vehicle_type, vehicle_type)
                return {
                    "plate": r.get('plate', '').upper(),
                    "car_type": car_type,
                    "car_color": COLOR_AR.get(color_raw, color_raw) or estimate_vehicle_color(
                        image_bytes,
                        (r.get('vehicle') or {}).get('box'),
                    ),
                }
    except Exception:
        pass
    return {"plate": "", "car_type": "", "car_color": ""}


async def _read_plate_async(frame_bytes: bytes, pr_token: str = None) -> dict:
    loop = asyncio.get_event_loop()
    if pr_token:
        result = await loop.run_in_executor(None, _plate_recognizer_sync, frame_bytes, pr_token)
        if result.get("plate"):
            return result
    # Local fallback
    crop = detect_plate_crop(frame_bytes)
    if crop:
        crop = _enhance_plate(crop)
        text = await loop.run_in_executor(None, _paddle_read_bytes, crop)
        plate = _extract_plate(text)
        if plate:
            return {"plate": plate, "car_type": "", "car_color": ""}
    text = await loop.run_in_executor(None, _paddle_read_bytes, frame_bytes)
    return {"plate": _extract_plate(text), "car_type": "", "car_color": ""}


@router.websocket("/ws/camera/{tenant_id}")
async def camera_stream(websocket: WebSocket, tenant_id: int, db: Session = Depends(get_db)):
    # Auth check
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401)
        return
    try:
        payload = decode_token(token)
        if payload.get("tenant_id") != tenant_id or payload.get("role") not in ALLOWED_ROLES:
            await websocket.close(code=4403)
            return
    except Exception:
        await websocket.close(code=4401)
        return

    await websocket.accept()

    tenant = db.get(Tenant, tenant_id)
    if not tenant or not tenant.ip_camera_url:
        await websocket.send_json({"type": "error", "message": "لا توجد كاميرا مربوطة في الإعدادات"})
        await websocket.close()
        return

    cam_url = tenant.ip_camera_url
    if tenant.ip_camera_username and tenant.ip_camera_password:
        if cam_url.startswith("rtsp://") and "@" not in cam_url:
            cam_url = cam_url.replace("rtsp://", f"rtsp://{tenant.ip_camera_username}:{tenant.ip_camera_password}@")

    pr_token = getattr(tenant, 'plate_recognizer_token', None)

    cap = cv2.VideoCapture(cam_url)
    if not cap.isOpened():
        await websocket.send_json({"type": "error", "message": "تعذر الاتصال بالكاميرا"})
        await websocket.close()
        return

    await websocket.send_json({"type": "connected", "message": "✓ الكاميرا متصلة"})

    # Supervision tracker
    tracker = sv.ByteTrack() if SUPERVISION_AVAILABLE else None
    smoother = sv.DetectionsSmoother() if SUPERVISION_AVAILABLE else None

    seen_plates: dict[str, float] = {}  # plate → last_sent_time
    frame_count = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                await websocket.send_json({"type": "error", "message": "انقطع بث الكاميرا"})
                break

            frame_count += 1
            now = time.time()

            # Send frame every 2 frames (reduce bandwidth)
            if frame_count % 2 == 0:
                await websocket.send_json({"type": "frame", "data": _frame_to_b64(frame)})

            # Process every 15 frames (~2-3 times/sec at 30fps)
            if frame_count % 15 == 0:
                frame_bytes = _cv2_to_bytes(frame)

                # YOLO detection + Supervision tracking
                if YOLO_CAM_AVAILABLE and SUPERVISION_AVAILABLE and tracker:
                    try:
                        model = _plate_detector or _car_detector
                        results = model(frame, verbose=False, conf=0.3)
                        detections = sv.Detections.from_ultralytics(results[0])
                        if len(detections) > 0:
                            detections = tracker.update_with_detections(detections)
                            if smoother:
                                detections = smoother.update_with_detections(detections)

                            for i in range(len(detections)):
                                x1, y1, x2, y2 = map(int, detections.xyxy[i])
                                pad = 10
                                crop = frame[max(0, y1-pad):y2+pad, max(0, x1-pad):x2+pad]
                                if crop.size < 100:
                                    continue
                                crop_bytes = _cv2_to_bytes(crop)
                                crop_bytes = _enhance_plate(crop_bytes)

                                plate_result = await _read_plate_async(crop_bytes, pr_token)
                                plate = plate_result.get("plate", "")
                                if plate and len(plate) >= 4:
                                    last_time = seen_plates.get(plate, 0)
                                    if now - last_time >= PLATE_COOLDOWN:
                                        seen_plates[plate] = now
                                        car = db.query(Car).filter(Car.tenant_id == tenant_id, Car.plate_number == plate).first()
                                        car_info = {"id": car.id, "plate_number": car.plate_number, "owner_name": car.owner_name, "car_type": car.car_type, "phone": car.phone} if car else None
                                        await websocket.send_json({"type": "plate_detected", "plate": plate, "car_type": plate_result.get("car_type", ""), "car_color": plate_result.get("car_color", ""), "car": car_info, "frame": _frame_to_b64(frame)})
                    except Exception:
                        pass
                else:
                    # Simple fallback without tracking
                    plate_result = await _read_plate_async(frame_bytes, pr_token)
                    plate = plate_result.get("plate", "")
                    if plate and len(plate) >= 4:
                        last_time = seen_plates.get(plate, 0)
                        if now - last_time >= PLATE_COOLDOWN:
                            seen_plates[plate] = now
                            car = db.query(Car).filter(Car.tenant_id == tenant_id, Car.plate_number == plate).first()
                            car_info = {"id": car.id, "plate_number": car.plate_number, "owner_name": car.owner_name, "car_type": car.car_type, "phone": car.phone} if car else None
                            await websocket.send_json({"type": "plate_detected", "plate": plate, "car_type": plate_result.get("car_type", ""), "car_color": plate_result.get("car_color", ""), "car": car_info, "frame": _frame_to_b64(frame)})

            await asyncio.sleep(0.033)  # ~30fps max

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("camera_stream error tenant=%s", tenant_id)
        try:
            await websocket.send_json({"type": "error", "message": "حدث خطأ داخلي"})
        except Exception:
            pass
    finally:
        cap.release()
