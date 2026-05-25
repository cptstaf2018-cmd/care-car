# Phase 2C: Browser Camera + Plate OCR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake "IP camera preview" placeholder in NewService.jsx with a real browser webcam that captures a frame, sends it to Google Vision API, extracts a plate-number candidate, and auto-fills the search field.

**Architecture:** Backend adds `POST /vision/read-plate` which accepts a Base64 image, calls Google Vision TEXT_DETECTION, and returns the best plate candidate. Frontend opens the webcam using `navigator.mediaDevices.getUserMedia`, captures a frame to a canvas, sends base64 to the backend, and fills the car search input.

**Tech Stack:** FastAPI, Google Vision REST API (via `requests`), React 18, WebRTC `getUserMedia`, Tailwind CSS v3, Lucide React

**Prerequisites:** `GOOGLE_VISION_API_KEY` env var must be set in the backend environment (Google Vision API enabled in project saadn8n-477509).

---

## File Map

### Backend
```
backend/app/services/vision_service.py   — Google Vision API client
backend/app/api/vision.py                — POST /vision/read-plate
backend/app/main.py                      — include vision router
```

### Frontend
```
frontend/src/api/vision.js               — readPlate(imageBase64) API call
frontend/src/pages/NewService.jsx        — replace fake camera section with WebRTC camera
```

---

## Task 1: Backend — Vision Service + Endpoint

**Files:**
- Create: `backend/app/services/vision_service.py`
- Create: `backend/app/api/vision.py`
- Modify: `backend/app/main.py`

- [ ] **Create `backend/app/services/vision_service.py`**

```python
import os
import re
import requests
import base64

VISION_API_KEY = os.getenv("GOOGLE_VISION_API_KEY", "")
VISION_URL = "https://vision.googleapis.com/v1/images:annotate"


def read_plate_from_image(image_bytes: bytes) -> str | None:
    """Call Google Vision TEXT_DETECTION and return best plate candidate."""
    if not VISION_API_KEY:
        return None

    payload = {
        "requests": [{
            "image": {"content": base64.b64encode(image_bytes).decode()},
            "features": [{"type": "TEXT_DETECTION", "maxResults": 20}],
        }]
    }
    resp = requests.post(VISION_URL, params={"key": VISION_API_KEY}, json=payload, timeout=10)
    resp.raise_for_status()

    annotations = resp.json().get("responses", [{}])[0].get("textAnnotations", [])
    if not annotations:
        return None

    # Full text block is first annotation; use it for pattern matching
    full_text = annotations[0].get("description", "").replace("\n", " ").strip()

    # Look for Iraqi plate-like patterns: 4-8 alphanumeric chars (Latin or Arabic digits)
    # Arabic digits: ٠١٢٣٤٥٦٧٨٩ (U+0660-U+0669)
    # Try Latin alphanumeric first (most common in database)
    latin_candidates = re.findall(r'\b[A-Z0-9]{3,8}\b', full_text.upper())
    if latin_candidates:
        # Prefer tokens that look plate-like: mix of letters + numbers, or pure numbers
        for c in latin_candidates:
            if re.search(r'[A-Z]', c) and re.search(r'[0-9]', c):
                return c
        return latin_candidates[0]

    # Fallback: return first 8 chars of full text if no pattern found
    clean = re.sub(r'[^\w؀-ۿ]', '', full_text)
    return clean[:10] if clean else None
```

- [ ] **Create `backend/app/api/vision.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.deps import get_current_user
from app.models.user import User, Role
from app.services.vision_service import read_plate_from_image

router = APIRouter(prefix="/vision", tags=["vision"])


@router.post("/read-plate")
async def read_plate(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    if user.role == Role.superadmin:
        raise HTTPException(403, detail="Superadmin cannot use vision endpoint")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5 MB limit
        raise HTTPException(400, detail="Image too large (max 5 MB)")

    plate = read_plate_from_image(contents)
    return {"plate_number": plate or ""}
```

- [ ] **Add vision router to `backend/app/main.py`**

Change this line:
```python
from app.api import auth, tenants, cars, services, invoices, inventory, debts, reports, settings
```
To:
```python
from app.api import auth, tenants, cars, services, invoices, inventory, debts, reports, settings, vision
```

And add `vision.router` to the router list:
```python
for router in [auth.router, tenants.router, cars.router, services.router,
               invoices.router, inventory.router, debts.router, reports.router,
               settings.router, vision.router]:
    app.include_router(router)
```

- [ ] **Add `requests` to backend dependencies**

```bash
cd C:\Users\saad\Desktop\cear-car\backend
pip install requests
```

Check `requirements.txt` — if it exists, add `requests` to it:
```
requests>=2.31.0
```

- [ ] **Test the endpoint**

Start backend with GOOGLE_VISION_API_KEY set:
```powershell
$env:DATABASE_URL="postgresql://oiluser:oilpass@localhost:5432/oildb"
$env:GOOGLE_VISION_API_KEY="YOUR_API_KEY_HERE"
python -m uvicorn app.main:app --reload
```

Test with curl (replace TOKEN):
```bash
curl -X POST http://localhost:8000/vision/read-plate \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/plate.jpg"
```

Expected: `{"plate_number": "ABC1234"}` or `{"plate_number": ""}` if no match.

If GOOGLE_VISION_API_KEY is not set, `read_plate_from_image` returns None → response is `{"plate_number": ""}` (no 500 error).

- [ ] **Commit**

```bash
git add backend/app/services/vision_service.py backend/app/api/vision.py backend/app/main.py
git commit -m "feat: add Google Vision read-plate endpoint"
```

---

## Task 2: Frontend — Vision API Client

**Files:**
- Create: `frontend/src/api/vision.js`

- [ ] **Create `frontend/src/api/vision.js`**

```js
import client from './client'

export const readPlate = (file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/vision/read-plate', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
```

---

## Task 3: Frontend — NewService.jsx Camera Section

**Files:**
- Modify: `frontend/src/pages/NewService.jsx`

The current file has a fake IP camera section (left column, 0.75fr). We replace it with a live WebRTC webcam that captures a frame and calls the plate-read API.

- [ ] **Replace `frontend/src/pages/NewService.jsx` with this full file**

```jsx
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Camera, CameraOff, CheckCircle2, Keyboard, Search, ScanLine, Zap } from 'lucide-react'
import Layout from '../components/Layout'
import { getCars } from '../api/cars'
import { createService } from '../api/services'
import { readPlate } from '../api/vision'

const OIL_TYPES = ['15W40', '10W30', '5W30', '5W20', '0W20']

export default function NewService() {
  const [search, setSearch] = useState('')
  const [selectedCar, setSelectedCar] = useState(null)
  const [form, setForm] = useState({ oil_type: '15W40', amount: '', discount: '0', mileage: '', notes: '' })
  const [result, setResult] = useState(null)

  // Camera state
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)

  const { data: cars = [] } = useQuery({
    queryKey: ['cars', search],
    queryFn: () => getCars(search).then(r => r.data),
    enabled: search.length > 1,
  })

  const mutation = useMutation({
    mutationFn: createService,
    onSuccess: (res) => setResult(res.data),
  })

  const netAmount = (parseFloat(form.amount) || 0) - (parseFloat(form.discount) || 0)
  const canSubmit = selectedCar && form.amount && !mutation.isPending

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && canSubmit) {
        mutation.mutate({ car_id: selectedCar.id, ...form, amount: parseFloat(form.amount), discount: parseFloat(form.discount) || 0, mileage: form.mileage ? parseFloat(form.mileage) : null })
      }
      if (event.key === 'Escape') setSelectedCar(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canSubmit, selectedCar, form, mutation])

  // Stop camera on unmount
  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()) }
  }, [stream])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setStream(s)
      setCameraActive(true)
      setScanResult(null)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch {
      alert('تعذر فتح الكاميرا. تأكد من منح الإذن في المتصفح.')
    }
  }

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop())
    setStream(null)
    setCameraActive(false)
  }

  const captureAndScan = async () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      setScanning(true)
      try {
        const file = new File([blob], 'plate.jpg', { type: 'image/jpeg' })
        const res = await readPlate(file)
        const plate = res.data.plate_number
        setScanResult(plate || null)
        if (plate) {
          setSearch(plate)
          stopCamera()
        }
      } catch {
        setScanResult(null)
        alert('تعذرت قراءة اللوحة. حاول مجدداً أو ابحث يدوياً.')
      } finally {
        setScanning(false)
      }
    }, 'image/jpeg', 0.9)
  }

  if (result) return (
    <Layout>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="surface mx-auto max-w-md rounded-lg p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700"><CheckCircle2 /></div>
        <h2 className="text-2xl font-bold text-slate-950 mb-4">تم تسجيل الخدمة</h2>
        <div className="mb-6 space-y-2 rounded-lg bg-slate-50 p-4 text-right">
          <p className="text-slate-600">رقم الفاتورة: <span className="text-slate-950 font-bold">#{result.invoice_id}</span></p>
          <p className="text-slate-600">المبلغ: <span className="text-emerald-700 font-bold">{result.amount?.toLocaleString()} IQD</span></p>
          <p className="text-slate-600">الحالة: <span className={result.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}>{result.status === 'paid' ? 'مدفوع' : 'غير مدفوع'}</span></p>
        </div>
        <button onClick={() => { setResult(null); setSelectedCar(null); setSearch(''); setForm({ oil_type: '15W40', amount: '', discount: '0', mileage: '', notes: '' }) }}
          className="rounded-lg bg-slate-950 px-8 py-3 font-bold text-white hover:bg-slate-800">
          خدمة جديدة
        </button>
      </motion.div>
    </Layout>
  )

  return (
    <Layout>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-cyan-700">Service Desk</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">كاشير سريع لخدمة جديدة</h2>
          <p className="mt-2 text-sm text-slate-500">ابحث، اختر السيارة، احفظ الفاتورة. اختصار الحفظ: Ctrl + Enter.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">
          <Keyboard size={17} /> Ctrl + Enter للحفظ · Esc للتغيير
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        {/* Camera panel */}
        <div className="surface rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-950">قراءة اللوحة بالكاميرا</h3>
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${cameraActive ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'}`}>
              {cameraActive ? <><CameraOff size={14} /> إيقاف</> : <><Camera size={14} /> تفعيل الكاميرا</>}
            </button>
          </div>

          <div className="aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {cameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Camera size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-400">اضغط "تفعيل الكاميرا"</p>
                  <p className="text-xs text-slate-400">لقراءة رقم اللوحة تلقائياً</p>
                </div>
              </div>
            )}
          </div>

          {cameraActive && (
            <button onClick={captureAndScan} disabled={scanning}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 hover:bg-slate-800">
              <ScanLine size={16} />
              {scanning ? 'جاري القراءة...' : 'التقاط وقراءة اللوحة'}
            </button>
          )}

          {scanResult !== null && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-600">تم قراءة اللوحة</p>
              <p className="font-mono text-lg font-black text-emerald-800">{scanResult}</p>
            </div>
          )}

          {!cameraActive && (
            <p className="mt-3 text-xs leading-6 text-slate-400">
              بعد التفعيل، وجّه الكاميرا نحو اللوحة واضغط "التقاط". سيتم البحث تلقائياً.
            </p>
          )}
        </div>

        {/* Service form */}
        <div className="space-y-4">
          {!selectedCar ? (
            <>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث عن السيارة برقم اللوحة..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-4 pl-4 pr-12 text-lg font-bold text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
              </div>
              <div className="space-y-2">
                {cars.map(c => (
                  <div key={c.id} onClick={() => setSelectedCar(c)}
                    className="surface flex cursor-pointer items-center justify-between rounded-lg px-5 py-4 transition hover:border-cyan-300 hover:bg-cyan-50">
                    <span className="font-mono text-xl font-black text-slate-950">{c.plate_number}</span>
                    <span className="text-slate-500 text-sm">{c.owner_name} {c.car_type ? `— ${c.car_type}` : ''}</span>
                  </div>
                ))}
                {search.length > 1 && cars.length === 0 && (
                  <p className="text-slate-500 text-center py-4">لا توجد نتائج</p>
                )}
              </div>
            </>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
              <div className="surface rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <div>
                    <span className="font-mono font-black text-slate-950 text-lg">{selectedCar.plate_number}</span>
                    <span className="text-slate-500 text-sm mr-2">{selectedCar.owner_name}</span>
                  </div>
                  <button onClick={() => setSelectedCar(null)} className="text-slate-500 hover:text-rose-600 text-sm">تغيير</button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {OIL_TYPES.map(t => (
                    <button key={t} onClick={() => setForm({ ...form, oil_type: t })}
                      className={`rounded-lg border px-3 py-4 text-sm font-black ${form.oil_type === t ? 'border-cyan-400 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {[['amount', 'المبلغ (IQD) *', 'number'], ['discount', 'الخصم (IQD)', 'number'], ['mileage', 'عداد المسافة (كم)', 'number'], ['notes', 'ملاحظات', 'text']].map(([k, p, t]) => (
                  <input key={k} type={t} placeholder={p} value={form[k]}
                    onChange={e => setForm({ ...form, [k]: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
                ))}
              </div>
              <div className="sticky top-24 h-fit rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl">
                <div className="mb-4 flex items-center gap-2 text-cyan-300"><Zap size={18} /><span className="font-black">ملخص الفاتورة</span></div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">السيارة</span><span className="font-mono font-black">{selectedCar.plate_number}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">نوع الزيت</span><span className="font-black">{form.oil_type}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">المبلغ</span><span>{(Number(form.amount) || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">الخصم</span><span>{(Number(form.discount) || 0).toLocaleString()}</span></div>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-xs text-slate-400">الصافي</p>
                    <p className="mt-1 text-3xl font-black">{netAmount.toLocaleString()} IQD</p>
                  </div>
                </div>
                <button onClick={() => mutation.mutate({ car_id: selectedCar.id, ...form, amount: parseFloat(form.amount), discount: parseFloat(form.discount) || 0, mileage: form.mileage ? parseFloat(form.mileage) : null })}
                  disabled={!form.amount || mutation.isPending}
                  className="mt-5 w-full rounded-lg bg-emerald-500 px-6 py-4 text-lg font-black text-white transition hover:bg-emerald-600 disabled:opacity-50">
                  {mutation.isPending ? 'جاري...' : 'حفظ وطباعة'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
```

- [ ] **Commit**

```bash
git add frontend/src/api/vision.js frontend/src/pages/NewService.jsx
git commit -m "feat: add browser camera with plate OCR to new service form"
```

---

## Notes on GOOGLE_VISION_API_KEY

The key is a Google Cloud API key restricted to the Vision API. To create one:
1. Go to https://console.cloud.google.com/apis/credentials (project saadn8n-477509)
2. Create credentials → API key
3. Restrict to Cloud Vision API
4. Set in backend: `$env:GOOGLE_VISION_API_KEY="AIza..."`

If the key is missing, `read_plate_from_image` returns `None` and the endpoint returns `{"plate_number": ""}` — no crash.
