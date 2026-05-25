import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BatteryCharging, Car, CircleDot, Droplets, Fan, Gauge, GaugeCircle, GaugeIcon, ShowerHead, Sparkles, SprayCan, Wrench, Camera, CameraOff, CheckCircle2, Keyboard, ScanLine, Search, Smartphone, Zap } from 'lucide-react'
import Layout from '../components/Layout'
import { getCars } from '../api/cars'
import { createService } from '../api/services'
import { readPlate } from '../api/vision'

const OIL_GRADES = ['15W40', '10W30', '5W30', '5W20', '0W20']
const SERVICE_TYPES = [
  { label: 'تبديل زيت', icon: Droplets },
  { label: 'فلتر زيت', icon: CircleDot },
  { label: 'فلتر هواء', icon: Fan },
  { label: 'فلتر مكيف', icon: SprayCan },
  { label: 'تبديل ماء رديتر', icon: Droplets },
  { label: 'فحص بطارية', icon: BatteryCharging },
  { label: 'تبديل بواجي', icon: Sparkles },
  { label: 'تعبئة نيتروجين', icon: GaugeCircle },
  { label: 'غسيل', icon: ShowerHead },
  { label: 'ميزان', icon: Gauge },
  { label: 'ترصيص', icon: Wrench },
]

export default function NewService() {
  const [search, setSearch] = useState('')
  const [selectedCar, setSelectedCar] = useState(null)
  const [serviceType, setServiceType] = useState('تبديل زيت')
  const [oilGrade, setOilGrade] = useState('15W40')
  const [form, setForm] = useState({ amount: '', discount: '0', mileage: '', notes: '' })
  const [result, setResult] = useState(null)

  const videoRef = useRef(null)
  const fileInputRef = useRef(null)
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
  const serviceName = serviceType === 'تبديل زيت' ? `${serviceType} ${oilGrade}` : serviceType
  const submitService = () => mutation.mutate({
    car_id: selectedCar.id,
    ...form,
    oil_type: serviceName,
    amount: parseFloat(form.amount),
    discount: parseFloat(form.discount) || 0,
    mileage: form.mileage ? parseFloat(form.mileage) : null,
  })

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSubmit) {
        submitService()
      }
      if (e.key === 'Escape') setSelectedCar(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canSubmit, selectedCar, form, mutation, serviceName])

  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()) }
  }, [stream])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setStream(s)
      setCameraActive(true)
      setScanResult(null)
      // wait for videoRef to be attached then assign
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = s
      }, 50)
    } catch {
      alert('تعذر فتح الكاميرا. تأكد من منح الإذن في المتصفح.')
    }
  }

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop())
    setStream(null)
    setCameraActive(false)
  }

  const scanFromFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setScanning(true)
    try {
      const res = await readPlate(file)
      const plate = res.data.plate_number
      setScanResult(plate || null)
      if (plate) {
        setSearch(plate)
        stopCamera()
      } else {
        alert('لم يتم التعرف على رقم اللوحة. حاول مجدداً.')
      }
    } catch {
      alert('حدث خطأ أثناء القراءة.')
    } finally {
      setScanning(false)
    }
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
        } else {
          alert('لم يتم التعرف على رقم اللوحة. حاول مجدداً أو ابحث يدوياً.')
        }
      } catch {
        alert('حدث خطأ أثناء القراءة. تأكد من إعداد GOOGLE_VISION_API_KEY في البيئة.')
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
        <button onClick={() => { setResult(null); setSelectedCar(null); setSearch(''); setServiceType('تبديل زيت'); setOilGrade('15W40'); setForm({ amount: '', discount: '0', mileage: '', notes: '' }) }}
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
          <h2 className="mt-1 text-2xl font-black text-slate-950">خدمة سريعة للسيارة</h2>
          <p className="mt-2 text-sm text-slate-500">ابحث، اختر السيارة، احفظ الفاتورة. اختصار الحفظ: Ctrl + Enter.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">
          <Keyboard size={17} /> Ctrl + Enter للحفظ · Esc للتغيير
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        {/* Camera panel */}
        <div className="surface rounded-lg p-5">
          <div className="mb-3 flex items-center justify-between">
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

          {scanResult && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-600">تم قراءة اللوحة</p>
              <p className="font-mono text-lg font-black text-emerald-800">{scanResult}</p>
            </div>
          )}

          <div className="mt-3 border-t border-slate-100 pt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={scanFromFile}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 disabled:opacity-50 transition">
              <Smartphone size={15} />
              {scanning ? 'جاري القراءة...' : 'صوّر اللوحة من الهاتف أو الجهاز'}
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">يفتح الكاميرا مباشرة على الهاتف</p>
          </div>
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
                  <p className="text-center py-4 text-slate-500">لا توجد نتائج</p>
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
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Car size={18} className="text-cyan-700" />
                    <h3 className="font-black text-slate-950">نوع الخدمة</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
                    {SERVICE_TYPES.map(({ label, icon: Icon }) => (
                      <button key={label} onClick={() => setServiceType(label)}
                        className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-black transition ${serviceType === label ? 'border-cyan-400 bg-cyan-50 text-cyan-800 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50/50'}`}>
                        <Icon size={18} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {serviceType === 'تبديل زيت' && (
                  <div>
                    <p className="mb-2 text-sm font-black text-slate-700">نوع الزيت</p>
                    <div className="grid grid-cols-5 gap-2">
                      {OIL_GRADES.map(t => (
                        <button key={t} onClick={() => setOilGrade(t)}
                          className={`rounded-lg border px-3 py-4 text-sm font-black ${oilGrade === t ? 'border-cyan-400 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                  <div className="flex justify-between"><span className="text-slate-400">الخدمة</span><span className="font-black">{serviceName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">المبلغ</span><span>{(Number(form.amount) || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">الخصم</span><span>{(Number(form.discount) || 0).toLocaleString()}</span></div>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-xs text-slate-400">الصافي</p>
                    <p className="mt-1 text-3xl font-black">{netAmount.toLocaleString()} IQD</p>
                  </div>
                </div>
                <button onClick={submitService}
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
