from app.services.wasnder_service import normalize_whatsapp_recipient


def test_normalize_whatsapp_recipient_accepts_common_local_formats():
    assert normalize_whatsapp_recipient("0780 668 8044") == "+9647806688044"
    assert normalize_whatsapp_recipient("(0780) 668-8044", include_plus=False) == "9647806688044"
    assert normalize_whatsapp_recipient("+964 780 668 8044", include_plus=False) == "9647806688044"
    assert normalize_whatsapp_recipient("00964 780 668 8044") == "+9647806688044"
