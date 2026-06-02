from app.services.vision_service import extract_plate_candidates, normalize_plate_candidate
from app.api.camera_ws import _vote_plate


def test_normalize_plate_candidate_handles_arabic_digits_and_ocr_confusions():
    assert normalize_plate_candidate("ب ١٢٣٤") == "ب 1234"
    assert normalize_plate_candidate("B O12S") == "B 0125"
    assert normalize_plate_candidate("۱۲۳۴ بغداد") == "1234 بغداد"


def test_extract_plate_candidates_returns_review_options():
    candidates = extract_plate_candidates("لوحة السيارة: بغداد ١٢٣٤ وربما B O12S")
    assert "بغداد 1234" in candidates
    assert "B 0125" in candidates


def test_plate_vote_requires_repeated_confident_reads():
    votes = {}
    read = {"plate": "050959", "confidence": 0.8}

    assert _vote_plate(votes, read, 1.0) is None
    assert _vote_plate(votes, read, 1.6) is None

    confirmed = _vote_plate(votes, read, 2.1)
    assert confirmed["plate"] == "050959"
    assert confirmed["votes"] == 3
    assert confirmed["confidence"] == 0.8


def test_plate_vote_rejects_low_confidence_reads():
    votes = {}
    read = {"plate": "050959", "confidence": 0.4}

    assert _vote_plate(votes, read, 1.0) is None
    assert _vote_plate(votes, read, 1.6) is None
    assert _vote_plate(votes, read, 2.1) is None
