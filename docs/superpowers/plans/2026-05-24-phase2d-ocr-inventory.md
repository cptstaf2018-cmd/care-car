# Phase 2D: OCR Inventory Scanner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the user uploads a receipt image in Inventory → "إضافة وصل بصورة" mode, a "تحليل بالذكاء الاصطناعي" button sends the image to Google Vision (text extraction) then Claude Haiku (structured parsing), and the result auto-fills the line-items table for user review before saving.

**Architecture:** Extends the existing `/vision` backend module with a new `POST /vision/parse-receipt` endpoint. The endpoint chains Vision TEXT_DETECTION → Claude Haiku parsing → returns `[{oil_type, quantity, unit_cost}]`. Frontend adds a scan button in the existing receipt tab and fills the `lines` state on success.

**Tech Stack:** FastAPI, Google Vision REST API, Anthropic Python SDK (claude-haiku-4-5), React 18, Tailwind CSS v3

**Prerequisites:**
- `GOOGLE_VISION_API_KEY` env var (see Plan 2C)
- `ANTHROPIC_API_KEY` env var with access to claude-haiku-4-5-20251001

---

## File Map

### Backend
```
backend/app/services/vision_service.py   — add parse_receipt_text function
backend/app/api/vision.py                — add POST /vision/parse-receipt
```

### Frontend
```
frontend/src/api/vision.js               — add parseReceipt(file) function
frontend/src/pages/Inventory.jsx         — add OCR button in receipt mode
```

---

## Task 1: Backend — parse_receipt_text Service Function

**Files:**
- Modify: `backend/app/services/vision_service.py`

- [ ] **Add `parse_receipt_text` at the bottom of `backend/app/services/vision_service.py`**

```python
# append to backend/app/services/vision_service.py
import json

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")


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
[{{"oil_type": "15W40", "quantity": 20, "unit_cost": 15000}}, {{"oil_type": "5W30", "quantity": 10, "unit_cost": 18000}}]

If no items found, return [].

Receipt text:
{full_text}"""

    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = msg.content[0].text.strip()

    # Extract JSON array from response (in case model wraps it)
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
```

Also add `import json` at the top of `vision_service.py` if not already present (it imports `os`, `re`, `requests`, `base64` — add `json`).

---

## Task 2: Backend — parse-receipt Endpoint

**Files:**
- Modify: `backend/app/api/vision.py`

- [ ] **Add the new endpoint to `backend/app/api/vision.py`**

Full file after adding:

```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.deps import get_current_user
from app.models.user import User, Role
from app.services.vision_service import read_plate_from_image, parse_receipt_text, read_text_from_image

router = APIRouter(prefix="/vision", tags=["vision"])


@router.post("/read-plate")
async def read_plate(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    if user.role == Role.superadmin:
        raise HTTPException(403, detail="Superadmin cannot use vision endpoint")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(400, detail="Image too large (max 5 MB)")

    plate = read_plate_from_image(contents)
    return {"plate_number": plate or ""}


@router.post("/parse-receipt")
async def parse_receipt(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    if user.role == Role.superadmin:
        raise HTTPException(403, detail="Superadmin cannot use vision endpoint")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, detail="Image too large (max 10 MB)")

    full_text = read_text_from_image(contents)
    if not full_text:
        return {"items": [], "raw_text": ""}

    items = parse_receipt_text(full_text)
    return {"items": items, "raw_text": full_text}
```

- [ ] **Add `read_text_from_image` helper to `backend/app/services/vision_service.py`**

This is a simple extraction of the full text detection result (reused by both read_plate and parse_receipt):

```python
def read_text_from_image(image_bytes: bytes) -> str:
    """Return full text extracted from image via Vision API. Returns '' if no key or no text."""
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
```

Also refactor `read_plate_from_image` to use `read_text_from_image`:

```python
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
```

- [ ] **Install anthropic SDK in backend**

```bash
cd C:\Users\saad\Desktop\cear-car\backend
pip install anthropic
```

If `requirements.txt` exists, add:
```
anthropic>=0.25.0
```

- [ ] **Test the endpoint**

```powershell
$env:DATABASE_URL="postgresql://oiluser:oilpass@localhost:5432/oildb"
$env:GOOGLE_VISION_API_KEY="AIza..."
$env:ANTHROPIC_API_KEY="sk-ant-..."
python -m uvicorn app.main:app --reload
```

Test:
```bash
curl -X POST http://localhost:8000/vision/parse-receipt \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/receipt.jpg"
```

Expected:
```json
{
  "items": [
    {"oil_type": "15W40", "quantity": 20.0, "unit_cost": 15000.0},
    {"oil_type": "5W30", "quantity": 10.0, "unit_cost": null}
  ],
  "raw_text": "..."
}
```

If either API key is missing, returns `{"items": [], "raw_text": ""}`.

- [ ] **Commit**

```bash
git add backend/app/services/vision_service.py backend/app/api/vision.py
git commit -m "feat: add parse-receipt endpoint with Vision + Claude parsing"
```

---

## Task 3: Frontend — parseReceipt API Client

**Files:**
- Modify: `frontend/src/api/vision.js`

- [ ] **Add `parseReceipt` to `frontend/src/api/vision.js`**

```js
import client from './client'

export const readPlate = (file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/vision/read-plate', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const parseReceipt = (file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/vision/parse-receipt', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
```

---

## Task 4: Frontend — Inventory.jsx OCR Integration

**Files:**
- Modify: `frontend/src/pages/Inventory.jsx`

The receipt tab already has a file upload input and a lines table. We add:
1. An "تحليل بالذكاء الاصطناعي" button that appears after an image is selected
2. On click: calls `parseReceipt`, fills the `lines` state with returned items
3. User can edit the pre-filled lines before clicking "اعتماد الوصل"

- [ ] **Replace `frontend/src/pages/Inventory.jsx` with this full file**

```jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import Layout from '../components/Layout'
import { getInventory, createInventoryItem, updateInventoryItem, addInventoryReceipt } from '../api/inventory'
import { parseReceipt } from '../api/vision'

const emptyLine = { oil_type: '', quantity: '', unit_cost: '', min_threshold: '10' }

export default function Inventory() {
  const qc = useQueryClient()
  const { data: items = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data),
  })
  const [mode, setMode] = useState('manual')
  const [qtyInputs, setQtyInputs] = useState({})
  const [manual, setManual] = useState({ oil_type: '', quantity: '', min_threshold: '10', unit_cost: '' })
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [supplierName, setSupplierName] = useState('')
  const [lines, setLines] = useState([{ ...emptyLine }])
  const [scanning, setScanning] = useState(false)

  const create = useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      setManual({ oil_type: '', quantity: '', min_threshold: '10', unit_cost: '' })
    },
  })
  const update = useMutation({
    mutationFn: ({ id, data }) => updateInventoryItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
  const receipt = useMutation({
    mutationFn: addInventoryReceipt,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      setLines([{ ...emptyLine }])
      setSupplierName('')
      setReceiptFile(null)
      setReceiptPreview(null)
    },
  })

  const setLine = (index, key, value) => {
    setLines(prev => prev.map((line, i) => i === index ? { ...line, [key]: value } : line))
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
  }

  const handleOcrScan = async () => {
    if (!receiptFile) return
    setScanning(true)
    try {
      const res = await parseReceipt(receiptFile)
      const items = res.data.items || []
      if (items.length === 0) {
        alert('لم يتم التعرف على بنود في الصورة. تحقق من جودة الصورة أو أدخل البنود يدوياً.')
        return
      }
      setLines(items.map(item => ({
        oil_type: item.oil_type,
        quantity: String(item.quantity),
        unit_cost: item.unit_cost != null ? String(item.unit_cost) : '',
        min_threshold: '10',
      })))
    } catch {
      alert('حدث خطأ أثناء تحليل الصورة. تأكد من إعداد مفاتيح Google Vision وAnthropic في البيئة.')
    } finally {
      setScanning(false)
    }
  }

  const approveReceipt = () => {
    const cleanLines = lines
      .filter(line => line.oil_type && line.quantity)
      .map(line => ({
        oil_type: line.oil_type,
        quantity: Number(line.quantity),
        unit_cost: line.unit_cost ? Number(line.unit_cost) : null,
        min_threshold: Number(line.min_threshold) || 10,
      }))
    receipt.mutate({ supplier_name: supplierName || null, receipt_photo_url: null, lines: cleanLines })
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-700">مخزون المركز</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">إضافة يدوي أو من صورة وصل</h2>
          <p className="mt-2 text-sm text-slate-500">صوّر وصل الاستلام وسيتم استخراج البنود تلقائياً بالذكاء الاصطناعي.</p>
        </div>
      </div>

      <section className="surface mb-6 rounded-lg p-5">
        <div className="mb-5 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button onClick={() => setMode('manual')}
            className={`rounded-md px-5 py-2 text-sm font-bold ${mode === 'manual' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>
            إضافة يدوي
          </button>
          <button onClick={() => setMode('receipt')}
            className={`rounded-md px-5 py-2 text-sm font-bold ${mode === 'receipt' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>
            إضافة وصل بصورة
          </button>
        </div>

        {mode === 'manual' ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ['oil_type', 'اسم المادة *', 'text'],
              ['quantity', 'الكمية *', 'number'],
              ['min_threshold', 'الحد الأدنى', 'number'],
              ['unit_cost', 'سعر الوحدة', 'number'],
            ].map(([k, p, type]) => (
              <input key={k} placeholder={p} value={manual[k]} type={type}
                onChange={e => setManual({ ...manual, [k]: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            ))}
            <button onClick={() => create.mutate({
              ...manual,
              quantity: Number(manual.quantity),
              min_threshold: Number(manual.min_threshold) || 10,
              unit_cost: manual.unit_cost ? Number(manual.unit_cost) : null,
            })}
              disabled={!manual.oil_type || !manual.quantity}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-50 md:col-span-4">
              حفظ المادة
            </button>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="font-bold text-slate-950">صورة الوصل</p>
              <input type="file" accept="image/*" capture="environment"
                onChange={handleImageSelect}
                className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm" />
              <div className="mt-4 aspect-[4/3] overflow-hidden rounded-lg bg-white">
                {receiptPreview ? (
                  <img src={receiptPreview} alt="وصل المواد" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">التقط أو ارفع صورة الوصل</div>
                )}
              </div>
              {receiptFile && (
                <button onClick={handleOcrScan} disabled={scanning}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60 hover:bg-cyan-700">
                  <Sparkles size={16} />
                  {scanning ? 'جاري التحليل بالذكاء الاصطناعي...' : 'تحليل بالذكاء الاصطناعي'}
                </button>
              )}
              {!receiptFile && (
                <p className="mt-3 text-xs leading-6 text-slate-500">
                  بعد رفع الصورة، اضغط "تحليل" ليتم ملء الجدول تلقائياً من الوصل.
                </p>
              )}
            </div>

            <div>
              <input value={supplierName} onChange={e => setSupplierName(e.target.value)}
                placeholder="اسم المورد"
                className="mb-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>{['المادة', 'الكمية', 'سعر الوحدة', 'الحد الأدنى', ''].map(h => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={index} className="border-t border-slate-100">
                        {[
                          ['oil_type', 'text'],
                          ['quantity', 'number'],
                          ['unit_cost', 'number'],
                          ['min_threshold', 'number'],
                        ].map(([key, type]) => (
                          <td key={key} className="px-2 py-2">
                            <input type={type} value={line[key]} onChange={e => setLine(index, key, e.target.value)}
                              className="w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-cyan-400" />
                          </td>
                        ))}
                        <td className="px-2 py-2">
                          <button onClick={() => setLines(prev => prev.filter((_, i) => i !== index))}
                            className="rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">حذف</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setLines(prev => [...prev, { ...emptyLine }])}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700">
                  إضافة سطر
                </button>
                <button onClick={approveReceipt}
                  disabled={!lines.some(line => line.oil_type && line.quantity) || receipt.isPending}
                  className="rounded-lg bg-slate-950 px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
                  {receipt.isPending ? 'جاري الاعتماد...' : 'اعتماد الوصل وإضافة للمخزون'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map(item => (
          <div key={item.id} className={`surface rounded-lg p-5 ${item.low_stock ? 'border-rose-300' : ''}`}>
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-950">{item.oil_type}</h3>
              {item.low_stock && <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700">قليل</span>}
            </div>
            <p className="mb-1 text-2xl font-bold text-slate-950">{Number(item.quantity).toLocaleString()} <span className="text-sm text-slate-400">وحدة/لتر</span></p>
            <p className="text-sm text-slate-500">الحد الأدنى: {Number(item.min_threshold)}</p>
            {item.unit_cost && <p className="text-sm text-slate-500">السعر: {Number(item.unit_cost).toLocaleString()} IQD</p>}
            <input type="number" placeholder="تحديث الكمية..."
              value={qtyInputs[item.id] ?? ''}
              onChange={e => setQtyInputs({ ...qtyInputs, [item.id]: e.target.value })}
              onBlur={() => {
                const val = qtyInputs[item.id]
                if (val) update.mutate({ id: item.id, data: { quantity: Number(val) } }, {
                  onSuccess: () => setQtyInputs(prev => { const next = { ...prev }; delete next[item.id]; return next }),
                })
              }}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400" />
          </div>
        ))}
        {items.length === 0 && <p className="surface col-span-full rounded-lg py-8 text-center text-sm text-slate-500">لا يوجد مخزون</p>}
      </div>
    </Layout>
  )
}
```

- [ ] **Commit**

```bash
git add frontend/src/api/vision.js frontend/src/pages/Inventory.jsx
git commit -m "feat: add AI receipt OCR scan to inventory form"
```

---

## Notes on Graceful Degradation

- If `GOOGLE_VISION_API_KEY` is missing: `read_text_from_image` returns `""` → `parse_receipt_text` returns `[]` → frontend shows "لم يتم التعرف على بنود".
- If `ANTHROPIC_API_KEY` is missing: `parse_receipt_text` returns `[]` immediately → same behavior.
- The manual entry table remains fully functional regardless of API key availability.
- The "تحليل" button only appears after the user selects an image, so there's no confusion about availability.
