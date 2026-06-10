import asyncio
import base64
from collections import defaultdict, deque
import ipaddress
import logging
import time
from urllib.parse import urlparse
import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.tenant import Tenant
from app.models.car import Car
from app.models.user import Role
from app.services.vision_service import _cv2_to_bytes, read_plate_reads, detect_plate_bbox
from app.api.mobile_camera import get_latest_mobile_frame

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_ROLES = {Role.manager.value, Role.employee.value}
PLATE_COOLDOWN = 10.0  # seconds before same plate triggers again
VOTE_WINDOW_SECONDS = 4.5
MIN_PLATE_VOTES = 2
MIN_AVG_CONFIDENCE = 0.35
HIGH_CONFIDENCE_SINGLE_READ = 0.68
MAX_CAMERA_SESSION_SECONDS = 120

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


def _bytes_to_frame(image_bytes: bytes):
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def _is_private_camera_url(cam_url: str) -> bool:
    try:
        host = urlparse(cam_url).hostname or ""
    except Exception:
        return False
    normalized_host = host.strip().lower()
    if normalized_host in {"localhost", "127.0.0.1", "::1"}:
        return True
    try:
        ip = ipaddress.ip_address(normalized_host)
        return ip.is_private or ip.is_loopback or ip.is_link_local
    except ValueError:
        pass
    return (
        normalized_host.startswith("192.168.")
        or normalized_host.startswith("10.")
        or any(normalized_host.startswith(f"172.{i}.") for i in range(16, 32))
        or normalized_host.endswith(".local")
    )


async def _detect_bbox_async(frame_bytes: bytes) -> list | None:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, detect_plate_bbox, frame_bytes)


def _crop_for_ocr(frame, bbox: list | None):
    """Crop the frame to the detected plate region with padding so OCR
    reads only the plate (not unrelated text elsewhere in the scene)."""
    if not bbox or len(bbox) != 4:
        return frame
    h, w = frame.shape[:2]
    x1, y1, x2, y2 = [int(value) for value in bbox]
    box_w, box_h = max(x2 - x1, 1), max(y2 - y1, 1)
    pad_x, pad_y = int(box_w * 0.3), int(box_h * 0.6)
    cx1, cy1 = max(0, x1 - pad_x), max(0, y1 - pad_y)
    cx2, cy2 = min(w, x2 + pad_x), min(h, y2 + pad_y)
    if cx2 <= cx1 or cy2 <= cy1:
        return frame
    crop = frame[cy1:cy2, cx1:cx2]
    return crop if crop.size else frame


async def _read_plate_async(frame_bytes: bytes) -> dict:
    loop = asyncio.get_event_loop()
    reads = await loop.run_in_executor(None, read_plate_reads, frame_bytes)
    best = reads[0] if reads else {}
    return {
        "plate": best.get("plate", ""),
        "confidence": float(best.get("confidence", 0) or 0),
        "bbox": best.get("bbox"),
        "candidates": [read.get("plate", "") for read in reads if read.get("plate")],
        "car_type": "",
        "car_color": "",
    }


def _draw_plate_overlay(frame, plate_result: dict):
    bbox = plate_result.get("bbox")
    plate = plate_result.get("plate", "")
    if not bbox or len(bbox) != 4:
        return frame
    h, w = frame.shape[:2]
    x1, y1, x2, y2 = [int(value) for value in bbox]
    x1, x2 = max(0, min(x1, w - 1)), max(0, min(x2, w - 1))
    y1, y2 = max(0, min(y1, h - 1)), max(0, min(y2, h - 1))
    if x2 <= x1 or y2 <= y1:
        return frame
    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 220, 120), 3)
    if plate:
        label_y = max(28, y1 - 8)
        cv2.rectangle(frame, (x1, label_y - 24), (min(w - 1, x1 + 190), label_y + 4), (0, 220, 120), -1)
        cv2.putText(frame, plate, (x1 + 6, label_y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (5, 20, 25), 2, cv2.LINE_AA)
    return frame


def _draw_box_label(frame, x1: int, y1: int, x2: int, y2: int, label: str, color: tuple[int, int, int]):
    h, w = frame.shape[:2]
    x1, x2 = max(0, min(x1, w - 1)), max(0, min(x2, w - 1))
    y1, y2 = max(0, min(y1, h - 1)), max(0, min(y2, h - 1))
    if x2 <= x1 or y2 <= y1:
        return
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
    (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.65, 2)
    label_y = max(text_h + 10, y1)
    cv2.rectangle(frame, (x1, label_y - text_h - 10), (min(w - 1, x1 + text_w + 14), label_y + 4), color, -1)
    cv2.putText(frame, label, (x1 + 7, label_y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (5, 20, 25), 2, cv2.LINE_AA)


def _draw_vehicle_overlays(frame):
    if _car_detector is None:
        return frame
    try:
        try:
            results = _car_detector(frame, classes=[2, 5, 7], verbose=False, conf=0.25)
        except Exception:
            results = _car_detector(frame, verbose=False, conf=0.25)
        idx = 0
        for result in results or []:
            boxes = getattr(result, "boxes", None)
            if not boxes:
                continue
            for box in boxes:
                idx += 1
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cls_id = int(box.cls[0]) if getattr(box, "cls", None) is not None else None
                label = "truck" if cls_id in (5, 7) else "car"
                _draw_box_label(frame, x1, y1, x2, y2, f"{label} #{idx}", (120, 235, 40) if label == "truck" else (255, 150, 160))
    except Exception:
        logger.exception("vehicle overlay failed")
    return frame


def _draw_plate_detector_overlays(frame, plate_text: str = ""):
    if _plate_detector is None:
        return frame
    try:
        results = _plate_detector(frame, verbose=False, conf=0.25)
        for result in results or []:
            boxes = getattr(result, "boxes", None)
            if not boxes:
                continue
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                _draw_box_label(frame, x1, y1, x2, y2, plate_text or "plate", (0, 180, 255))
    except Exception:
        logger.exception("plate overlay failed")
    return frame


def _annotate_frame(frame, plate_result: dict | None = None):
    annotated = frame.copy()
    _draw_vehicle_overlays(annotated)
    _draw_plate_detector_overlays(annotated, (plate_result or {}).get("plate", ""))
    if plate_result:
        _draw_plate_overlay(annotated, plate_result)
    return annotated


def _vote_plate(plate_votes, plate_result: dict, now: float) -> dict | None:
    plate = plate_result.get("plate", "")
    if not plate or len(plate) < 4:
        return None

    confidence = float(plate_result.get("confidence", 0) or 0)
    votes = plate_votes.setdefault(plate, deque())
    votes.append((now, confidence))

    cutoff = now - VOTE_WINDOW_SECONDS
    for key in list(plate_votes.keys()):
        while plate_votes[key] and plate_votes[key][0][0] < cutoff:
            plate_votes[key].popleft()
        if not plate_votes[key]:
            del plate_votes[key]

    best_plate = ""
    best_votes = 0
    best_avg = 0.0
    for key, items in plate_votes.items():
        vote_count = len(items)
        avg_confidence = sum(item[1] for item in items) / vote_count
        if (vote_count, avg_confidence) > (best_votes, best_avg):
            best_plate = key
            best_votes = vote_count
            best_avg = avg_confidence

    if (
        best_plate == plate
        and (
            (best_votes >= MIN_PLATE_VOTES and best_avg >= MIN_AVG_CONFIDENCE)
            or confidence >= HIGH_CONFIDENCE_SINGLE_READ
        )
    ):
        return {**plate_result, "plate": best_plate, "confidence": round(best_avg, 3), "votes": best_votes}
    return None


async def _send_plate_event(websocket: WebSocket, db: Session, tenant_id: int, frame, plate_result: dict, event_type: str):
    plate = plate_result.get("plate", "")
    if not plate:
        return
    car = db.query(Car).filter(Car.tenant_id == tenant_id, Car.plate_number == plate).first()
    car_info = {"id": car.id, "plate_number": car.plate_number, "owner_name": car.owner_name, "car_type": car.car_type, "phone": car.phone} if car else None
    marked_frame = _annotate_frame(frame, plate_result)
    await websocket.send_json({
        "type": event_type,
        "plate": plate,
        "confidence": plate_result.get("confidence", 0),
        "votes": plate_result.get("votes", 1),
        "car_type": plate_result.get("car_type", ""),
        "car_color": plate_result.get("car_color", ""),
        "car": car_info,
        "frame": _frame_to_b64(marked_frame),
    })


async def _finish_camera_session(websocket: WebSocket, reason: str, message: str):
    try:
        await websocket.send_json({"type": "completed", "reason": reason, "message": message})
    finally:
        await websocket.close()


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
    if not tenant:
        await websocket.send_json({"type": "error", "message": "المركز غير موجود"})
        await websocket.close()
        return

    cam_url = tenant.ip_camera_url
    prefer_mobile = not cam_url or _is_private_camera_url(cam_url)

    if prefer_mobile:
        await websocket.send_json({"type": "connected", "message": "✓ بانتظار كاميرا الموبايل"})
        started_at = time.time()
        seen_plates: dict[str, float] = {}
        seen_candidates: dict[str, float] = {}
        plate_votes = defaultdict(deque)
        last_frame_time = 0.0
        last_ocr_time = 0.0
        try:
            while True:
                if time.time() - started_at >= MAX_CAMERA_SESSION_SECONDS:
                    await _finish_camera_session(websocket, "timeout", "انتهت مهلة قراءة اللوحة")
                    return
                latest = get_latest_mobile_frame(tenant_id)
                if latest and latest.received_at != last_frame_time:
                    last_frame_time = latest.received_at
                    frame = _bytes_to_frame(latest.data)
                    if frame is not None:
                        now = time.time()
                        display_frame = frame
                        live_bbox = await _detect_bbox_async(_cv2_to_bytes(frame))
                        if live_bbox:
                            display_frame = _draw_plate_overlay(frame.copy(), {"bbox": live_bbox, "plate": ""})
                        ocr_interval = 1.0 if live_bbox else 2.0
                        if now - last_ocr_time >= ocr_interval:
                            last_ocr_time = now
                            ocr_crop = _crop_for_ocr(frame, live_bbox)
                            plate_result = await _read_plate_async(_cv2_to_bytes(ocr_crop))
                            if live_bbox and not plate_result.get("bbox"):
                                plate_result["bbox"] = live_bbox
                            if plate_result.get("plate"):
                                display_frame = _annotate_frame(frame, plate_result)
                            candidate_plate = plate_result.get("plate", "")
                            if candidate_plate and now - seen_candidates.get(candidate_plate, 0) >= 2.0:
                                seen_candidates[candidate_plate] = now
                                await _send_plate_event(websocket, db, tenant_id, frame, {**plate_result, "votes": len(plate_votes.get(candidate_plate, [])) or 1}, "plate_candidate")
                            confirmed = _vote_plate(plate_votes, plate_result, now)
                            if confirmed:
                                plate = confirmed["plate"]
                                last_time = seen_plates.get(plate, 0)
                                if now - last_time >= PLATE_COOLDOWN:
                                    seen_plates[plate] = now
                                    await _send_plate_event(websocket, db, tenant_id, frame, confirmed, "plate_detected")
                                    await _finish_camera_session(websocket, "plate_detected", "تمت قراءة اللوحة وإيقاف الكاميرا")
                                    return
                        await websocket.send_json({"type": "frame", "data": _frame_to_b64(display_frame)})
                await asyncio.sleep(0.2)
        except WebSocketDisconnect:
            pass
        except Exception:
            logger.exception("mobile camera stream error tenant=%s", tenant_id)
            try:
                await websocket.send_json({"type": "error", "message": "حدث خطأ داخلي"})
            except Exception:
                pass
        return

    if not cam_url:
        await websocket.send_json({"type": "error", "message": "لا توجد كاميرا مربوطة في الإعدادات"})
        await websocket.close()
        return

    if tenant.ip_camera_username and tenant.ip_camera_password:
        if cam_url.startswith("rtsp://") and "@" not in cam_url:
            cam_url = cam_url.replace("rtsp://", f"rtsp://{tenant.ip_camera_username}:{tenant.ip_camera_password}@")

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
    seen_candidates: dict[str, float] = {}
    plate_votes = defaultdict(deque)
    frame_count = 0
    started_at = time.time()

    try:
        while True:
            if time.time() - started_at >= MAX_CAMERA_SESSION_SECONDS:
                await _finish_camera_session(websocket, "timeout", "انتهت مهلة قراءة اللوحة")
                return
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
                processed_frame = None

                # YOLO detection + Supervision tracking
                if YOLO_CAM_AVAILABLE and SUPERVISION_AVAILABLE and tracker:
                    try:
                        processed_frame = _annotate_frame(frame)
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
                                plate_result = await _read_plate_async(_cv2_to_bytes(crop))
                                candidate_plate = plate_result.get("plate", "")
                                if candidate_plate and now - seen_candidates.get(candidate_plate, 0) >= 2.0:
                                    seen_candidates[candidate_plate] = now
                                    await _send_plate_event(websocket, db, tenant_id, frame, {**plate_result, "votes": len(plate_votes.get(candidate_plate, [])) or 1}, "plate_candidate")
                                confirmed = _vote_plate(plate_votes, plate_result, now)
                                if confirmed:
                                    plate = confirmed["plate"]
                                    last_time = seen_plates.get(plate, 0)
                                    if now - last_time >= PLATE_COOLDOWN:
                                        seen_plates[plate] = now
                                        marked_frame = _annotate_frame(frame, confirmed)
                                        processed_frame = marked_frame
                                        await _send_plate_event(websocket, db, tenant_id, frame, confirmed, "plate_detected")
                                        if processed_frame is not None:
                                            await websocket.send_json({"type": "frame", "data": _frame_to_b64(processed_frame)})
                                        await _finish_camera_session(websocket, "plate_detected", "تمت قراءة اللوحة وإيقاف الكاميرا")
                                        return
                    except Exception:
                        pass
                else:
                    # Simple fallback without tracking
                    plate_result = await _read_plate_async(frame_bytes)
                    processed_frame = _annotate_frame(frame, plate_result if plate_result.get("plate") else None)
                    candidate_plate = plate_result.get("plate", "")
                    if candidate_plate and now - seen_candidates.get(candidate_plate, 0) >= 2.0:
                        seen_candidates[candidate_plate] = now
                        await _send_plate_event(websocket, db, tenant_id, frame, {**plate_result, "votes": len(plate_votes.get(candidate_plate, [])) or 1}, "plate_candidate")
                    confirmed = _vote_plate(plate_votes, plate_result, now)
                    if confirmed:
                        plate = confirmed["plate"]
                        last_time = seen_plates.get(plate, 0)
                        if now - last_time >= PLATE_COOLDOWN:
                            seen_plates[plate] = now
                            marked_frame = _annotate_frame(frame, confirmed)
                            processed_frame = marked_frame
                            await _send_plate_event(websocket, db, tenant_id, frame, confirmed, "plate_detected")
                            await websocket.send_json({"type": "frame", "data": _frame_to_b64(processed_frame)})
                            await _finish_camera_session(websocket, "plate_detected", "تمت قراءة اللوحة وإيقاف الكاميرا")
                            return
                if processed_frame is not None:
                    await websocket.send_json({"type": "frame", "data": _frame_to_b64(processed_frame)})

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
