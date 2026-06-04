from app.services.vision_service import extract_plate_candidates, normalize_plate_candidate


def test_normalize_plate_candidate_handles_arabic_digits_and_ocr_confusions():
    assert normalize_plate_candidate("ب ١٢٣٤") == "ب 1234"
    assert normalize_plate_candidate("B O12S") == "B 0125"
    assert normalize_plate_candidate("۱۲۳۴ بغداد") == "1234 بغداد"


def test_extract_plate_candidates_returns_review_options():
    candidates = extract_plate_candidates("لوحة السيارة: بغداد ١٢٣٤ وربما B O12S")
    assert "بغداد 1234" in candidates
    assert "B 0125" in candidates
