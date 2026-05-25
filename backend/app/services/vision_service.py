import json
import os
import re
import base64
import requests

VISION_API_KEY = os.getenv("GOOGLE_VISION_API_KEY", "")
VISION_URL = "https://vision.googleapis.com/v1/images:annotate"
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")


def read_text_from_image(image_bytes: bytes) -> str:
    """Return full text extracted from image via Vision API."""
    if not VISION_API_KEY:
        return ""

    payload = {
        "requests": [{
            "image": {"content": base64.b64encode(image_bytes).decode()},
            "features": [{"type": "TEXT_DETECTION", "maxResults": 1}],
        }]
    }
    resp = requests.post(VISION_URL, params={"key": VISION_API_KEY}, json=payload, timeout=10)
    resp.raise_for_status()

    annotations = resp.json().get("responses", [{}])[0].get("textAnnotations", [])
    if not annotations:
        return ""
    return annotations[0].get("description", "").strip()


def read_plate_from_image(image_bytes: bytes) -> str | None:
    """Call Google Vision TEXT_DETECTION and return best plate candidate."""
    full_text = read_text_from_image(image_bytes)
    if not full_text:
        return None

    clean = full_text.replace("\n", " ").strip()

    latin_candidates = re.findall(r'\b[A-Z0-9]{3,8}\b', clean.upper())
    if latin_candidates:
        for c in latin_candidates:
            if re.search(r'[A-Z]', c) and re.search(r'[0-9]', c):
                return c
        return latin_candidates[0]

    result = re.sub(r'[^\w؀-ۿ]', '', clean)
    return result[:10] if result else None


def parse_receipt_text(full_text: str) -> list[dict]:
    """Send extracted receipt text to Claude Haiku and get structured line items."""
    if not ANTHROPIC_API_KEY:
        return []

    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    prompt = f"""You are parsing an oil/lubricant receipt from an Iraqi auto service center.
Extract all oil product line items from the text below.

For each item, extract:
- oil_type: the product name or oil grade (e.g., "15W40", "5W30", "زيت محرك", etc.)
- quantity: numeric quantity (liters or units)
- unit_cost: price per unit in IQD if present, otherwise null

Return ONLY a JSON array. No explanation. Example:
[{{"oil_type": "15W40", "quantity": 20, "unit_cost": 15000}}]

If no items found, return [].

Receipt text:
{full_text}"""

    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = msg.content[0].text.strip()

    match = re.search(r'\[.*\]', raw, re.DOTALL)
    if not match:
        return []

    items = json.loads(match.group())
    result = []
    for item in items:
        oil_type = str(item.get("oil_type", "")).strip()
        quantity = item.get("quantity")
        unit_cost = item.get("unit_cost")
        if oil_type and quantity is not None:
            result.append({
                "oil_type": oil_type,
                "quantity": float(quantity),
                "unit_cost": float(unit_cost) if unit_cost is not None else None,
            })
    return result
