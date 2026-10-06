from app.services.vision_service import extract_plate_candidates, normalize_plate_candidate, parse_receipt_text
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


def test_parse_receipt_text_returns_inventory_fields_from_arabic_receipt_lines():
    text = """
    وصل تسليم مواد خدمات سيارة
    فلتر زيت اصلي 4 15.00
    زيت محرك ديزل 5W-30 ٤ 30.00
    المجموع 75.50 KWD
    """

    items = parse_receipt_text(text)

    assert items[0]["oil_type"] == "فلتر زيت اصلي"
    assert items[0]["quantity"] == 4
    assert items[0]["unit_cost"] == 15
    assert items[1]["oil_type"] == "زيت محرك ديزل 5W-30"
    assert items[1]["quantity"] == 4
    assert items[1]["unit_cost"] == 30


def test_parse_receipt_text_ignores_header_contact_and_vehicle_noise():
    text = """
    Tel: 1234567
    www.aighanim.com
    السيارة Toyota Camry 2019
    فلتر زيت اصلي 1 15-00
    زيت محرك تويوتا 5W-30 4 30.00
    فلتر هواء وحدة 1 10.00
    مكيف فلتر مكيف وحدة 1 10.00
    بواجي ليزر وحدة 4 100.00
    RECEIVED
    """

    items = parse_receipt_text(text)
    names = [item["oil_type"] for item in items]

    assert names == [
        "فلتر زيت اصلي",
        "زيت محرك تويوتا 5W-30",
        "فلتر هواء",
        "مكيف فلتر مكيف",
        "بواجي ليزر",
    ]
    assert all("Toyota" not in name and "www" not in name and "Tel" not in name for name in names)
    assert items[0]["quantity"] == 1
    assert items[0]["unit_cost"] == 15
    assert items[-1]["quantity"] == 4
    assert items[-1]["unit_cost"] == 100


def test_parse_receipt_text_accepts_unknown_table_items_with_unit_words():
    text = """
    Tel: 1234567
    السيارة Toyota Camry 2019
    طرمبة بنزين وحدة 1 35.00
    منظف بخاخ عدد 2 5.00
    مركز الخليج للخدمات
    """

    items = parse_receipt_text(text)
    names = [item["oil_type"] for item in items]

    assert names == ["طرمبة بنزين", "منظف بخاخ"]
    assert items[0]["quantity"] == 1
    assert items[0]["unit_cost"] == 35
    assert items[1]["quantity"] == 2
    assert items[1]["unit_cost"] == 5


def test_parse_receipt_text_deduplicates_repeated_ocr_passes():
    text = """
    زيت محرك 15W40 4 65.00 260.00
    فلتر زيت 2 25.00 50.00
    فلترهواء 1 35.00 35.00
    فلترمكيف 1 40.00 40.00
    شمعات 4 12.00 48.00
    سائل تبريد 1 20.00 20.00
    زيت محرك 15W40 4 65.00 260.00
    فلتر زيت 2 25.00 50.00
    فلترهواء 1 35.00 35.00
    فلتر مكيف 1 40.00 40.00
    سائل تبريد 1 20.00 20.00
    """

    items = parse_receipt_text(text)
    names = [item["oil_type"] for item in items]

    assert names == [
        "زيت محرك 15W40",
        "فلتر زيت",
        "فلترهواء",
        "فلتر مكيف",
        "شمعات",
        "سائل تبريد",
    ]
    assert len(items) == 6


def test_parse_receipt_text_deduplicates_common_ocr_name_variants():
    text = """
    زيت محرك 15WA0 1 600
    أ فلتر زيت 2 50
    فلتر هواء 1 5
    JB فلترمكيف 4 40
    و شمعات 5 48
    a سائل تبريد 6 20
    زيت محرك 15W40 4 260
    فلتر مكيف 3 40
    فلتر زيت 2 50
    فلترهواء 5 35
    سائل تبريد 1 20
    """

    items = parse_receipt_text(text)
    names = [item["oil_type"] for item in items]

    assert len(items) == 6
    assert names == [
        "زيت محرك 15W40",
        "فلتر زيت",
        "فلترهواء",
        "فلتر مكيف",
        "شمعات",
        "سائل تبريد",
    ]
    assert items[0]["unit_cost"] == 260
