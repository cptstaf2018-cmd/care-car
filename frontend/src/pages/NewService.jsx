import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BatteryCharging, Car, CircleDot, Droplets, Fan, Gauge, GaugeCircle, Package, Printer, PlusCircle, ShowerHead, Sparkles, SprayCan, Trash2, Wrench, Camera, CameraOff, CheckCircle2, Keyboard, ScanLine, Search, Smartphone, Zap } from 'lucide-react'
import Layout from '../components/Layout'
import { getCars, createCar } from '../api/cars'
import { createService } from '../api/services'
import { getInventory } from '../api/inventory'
import { analyzeCar, readPlate } from '../api/vision'

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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const arrivalPlate = searchParams.get('plate') || ''
  const arrivalCarType = searchParams.get('car_type') || ''
  const arrivalCarColor = searchParams.get('car_color') || ''
  const [search, setSearch] = useState('')
  const [selectedCar, setSelectedCar] = useState(null)
  const [newCarForm, setNewCarForm] = useState(null) // { plate_number, car_type, car_color }
  const [serviceType, setServiceType] = useState('تبديل زيت')
  const [oilGrade, setOilGrade] = useState('15W40')
  const [form, setForm] = useState({ amount: '', discount: '0', mileage: '', notes: '' })
  const [lineInventoryId, setLineInventoryId] = useState('')
  const [lineInventoryQty, setLineInventoryQty] = useState('1')
  const [invoiceLines, setInvoiceLines] = useState([])
  const [result, setResult] = useState(null)

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data),
    enabled: !!selectedCar,
  })

  // Auto-match inventory item when service type or oil grade changes
  useEffect(() => {
    if (!selectedCar || inventoryItems.length === 0) return
    const kwMap = {
      'تبديل زيت': [oilGrade, oilGrade.replace('W', 'W-'), 'زيت محرك', 'زيت'],
      'فلتر زيت': ['فلتر زيت'],
      'فلتر هواء': ['فلتر هواء'],
      'فلتر مكيف': ['فلتر مكيف'],
      'تبديل ماء رديتر': ['ماء رديتر', 'رديتر'],
      'تبديل بواجي': ['شمعات', 'بواجي'],
      'ترصيص': ['أوزان', 'ترصيص'],
    }
    const kws = kwMap[serviceType]
    let found = null
    if (kws) {
      for (const kw of kws) {
        found = inventoryItems.find(item => item.oil_type?.includes(kw))
        if (found) break
      }
    }
    if (found) {
      setLineInventoryId(String(found.id))
    } else {
      setLineInventoryId('')
      setForm(prev => ({ ...prev, amount: '' }))
    }
  }, [serviceType, oilGrade, inventoryItems, selectedCar])

  // Auto-fill price from selected inventory item
  useEffect(() => {
    if (!lineInventoryId) return
    const item = inventoryItems.find(i => i.id === Number(lineInventoryId))
    if (item?.unit_cost) {
      const qty = parseFloat(lineInventoryQty) || 1
      setForm(prev => ({ ...prev, amount: String(Math.round(item.unit_cost * qty)) }))
    }
  }, [lineInventoryId, lineInventoryQty, inventoryItems])

  const videoRef = useRef(null)
  const fileInputRef = useRef(null)
  const carAnalyzeInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [scanError, setScanError] = useState('')
  const [analyzingCar, setAnalyzingCar] = useState(false)
  const [carAnalysis, setCarAnalysis] = useState(null)
  const [carAnalysisError, setCarAnalysisError] = useState('')

  const { data: cars = [] } = useQuery({
    queryKey: ['cars', search],
    queryFn: () => getCars(search).then(r => r.data),
    enabled: search.length > 1,
  })

  useEffect(() => {
    if (!arrivalPlate) return
    setSearch(arrivalPlate)
    setNewCarForm(current => current || {
      plate_number: arrivalPlate,
      car_type: arrivalCarType,
      car_color: arrivalCarColor,
      owner_name: '',
      phone: '',
    })
  }, [arrivalPlate, arrivalCarType, arrivalCarColor])

  useEffect(() => {
    if (!arrivalPlate || selectedCar || !cars.length) return
    const exact = cars.find(car => car.plate_number?.toLowerCase() === arrivalPlate.toLowerCase())
    if (exact) {
      setSelectedCar(exact)
      setNewCarForm(null)
    }
  }, [arrivalPlate, cars, selectedCar])

  const mutation = useMutation({
    mutationFn: createService,
    onSuccess: (res) => setResult(res.data),
  })

  const createCarMutation = useMutation({
    mutationFn: createCar,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['cars'] })
      setSelectedCar(res.data)
      setNewCarForm(null)
    },
  })

  const invoiceTotal = invoiceLines.reduce((sum, line) => sum + Number(line.amount || 0), 0)
  const netAmount = invoiceTotal - (parseFloat(form.discount) || 0)
  const canSubmit = selectedCar && invoiceLines.length > 0 && !mutation.isPending
  const serviceName = serviceType === 'تبديل زيت' ? `${serviceType} ${oilGrade}` : serviceType
  const addLineToInvoice = () => {
    if (!form.amount) return
    const invItem = lineInventoryId ? inventoryItems.find(i => i.id === Number(lineInventoryId)) : null
    setInvoiceLines(prev => [...prev, {
      id: Date.now() + Math.random().toString(36).slice(2),
      name: serviceName,
      amount: parseFloat(form.amount) || 0,
      notes: form.notes,
      inventoryItemId: invItem ? invItem.id : null,
      inventoryItemName: invItem ? invItem.oil_type : null,
      inventoryQty: invItem ? parseFloat(lineInventoryQty) || 1 : null,
    }])
    setForm(prev => ({ ...prev, amount: '', notes: '' }))
    setLineInventoryId('')
    setLineInventoryQty('1')
  }
  const submitService = () => {
    const deductions = invoiceLines
      .filter(l => l.inventoryItemId)
      .map(l => ({ item_id: l.inventoryItemId, quantity: l.inventoryQty }))
    mutation.mutate({
      car_id: selectedCar.id,
      oil_type: invoiceLines.map(line => line.name).join(' + '),
      amount: invoiceTotal,
      discount: parseFloat(form.discount) || 0,
      mileage: form.mileage ? parseFloat(form.mileage) : null,
      notes: invoiceLines.map(line => line.notes ? `${line.name}: ${line.notes}` : line.name).join(' | '),
      inventory_deductions: deductions,
    })
  }

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
    setScanError('')
    try {
      const res = await readPlate(file)
      const { plate_number: plate, car_type, car_color, confidence, candidates = [], message } = res.data
      if (plate) {
        setScanResult({ plate, car_type, car_color, confidence, candidates })
        setSearch(plate)
        setNewCarForm({ plate_number: plate, car_type: car_type || '', car_color: car_color || '', owner_name: '', phone: '' })
        stopCamera()
      } else {
        setScanResult(null)
        setScanError(message || 'لم نتمكن من قراءة رقم اللوحة من الصورة. أعد التصوير بإضاءة أوضح، أو أدخل رقم اللوحة يدوياً للمتابعة.')
      }
    } catch (err) {
      setScanError(err.response?.data?.detail || 'تعذرت القراءة الآن. أدخل رقم اللوحة يدوياً للمتابعة، ثم حاول استخدام الكاميرا لاحقاً.')
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
      setScanError('')
      try {
        const file = new File([blob], 'plate.jpg', { type: 'image/jpeg' })
        const res = await readPlate(file)
        const { plate_number: plate, car_type, car_color, confidence, candidates = [], message } = res.data
        if (plate) {
          setScanResult({ plate, car_type, car_color, confidence, candidates })
          setSearch(plate)
          setNewCarForm({ plate_number: plate, car_type: car_type || '', car_color: car_color || '', owner_name: '', phone: '' })
          stopCamera()
        } else {
          setScanResult(null)
          setScanError(message || 'لم نتمكن من قراءة رقم اللوحة من الصورة. أعد التصوير بإضاءة أوضح، أو أدخل رقم اللوحة يدوياً للمتابعة.')
        }
      } catch (err) {
        setScanError(err.response?.data?.detail || 'تعذرت القراءة الآن. أدخل رقم اللوحة يدوياً للمتابعة، ثم حاول استخدام الكاميرا لاحقاً.')
      } finally {
        setScanning(false)
      }
    }, 'image/jpeg', 0.9)
  }

  const analyzeCarPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setAnalyzingCar(true)
    setCarAnalysisError('')
    try {
      const res = await analyzeCar(file)
      const { car_type, car_color, brand, message } = res.data
      if (car_type || car_color || brand) {
        setCarAnalysis({ car_type, car_color, brand })
        setNewCarForm(prev => ({
          ...(prev || { plate_number: search || '', owner_name: '', phone: '' }),
          car_type: car_type || prev?.car_type || '',
          car_color: car_color || prev?.car_color || '',
        }))
      } else {
        setCarAnalysis(null)
        setCarAnalysisError(message || 'لم نتمكن من تحليل السيارة من الصورة.')
      }
    } catch (err) {
      setCarAnalysisError(err.response?.data?.detail || 'تعذر تحليل السيارة الآن.')
    } finally {
      setAnalyzingCar(false)
    }
  }

  if (result) return (
    <Layout>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="surface mx-auto max-w-lg rounded-2xl p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={32} /></div>
        <h2 className="text-2xl font-black text-slate-950 mb-1">تم تسجيل الخدمة</h2>
        <p className="text-slate-500 text-sm mb-5">الفاتورة جاهزة — يمكنك طباعتها أو تعديلها أو حذفها</p>
        <div className="mb-6 space-y-2 rounded-xl bg-slate-50 p-4 text-right border border-slate-200">
          <div className="flex justify-between"><span className="text-slate-500">رقم الفاتورة</span><span className="font-black text-slate-950">#{result.invoice_id}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">المبلغ</span><span className="font-black text-emerald-700">{result.amount?.toLocaleString()} IQD</span></div>
          <div className="flex justify-between"><span className="text-slate-500">الحالة</span><span className={`font-black ${result.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>{result.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة'}</span></div>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate(`/center/invoices/${result.invoice_id}/print`)}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-8 py-3 font-black text-white hover:bg-slate-800">
            <Printer size={18} /> طباعة الفاتورة وإرسالها
          </button>
          <button onClick={() => navigate('/center/invoices')}
            className="flex items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-8 py-3 text-sm font-black text-cyan-700 hover:bg-cyan-100">
            تعديل أو حذف الفاتورة
          </button>
          <button onClick={() => { setResult(null); setSelectedCar(null); setSearch(''); setServiceType('تبديل زيت'); setOilGrade('15W40'); setInvoiceLines([]); setForm({ amount: '', discount: '0', mileage: '', notes: '' }) }}
            className="rounded-xl border border-slate-200 px-8 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            خدمة جديدة
          </button>
        </div>
      </motion.div>
    </Layout>
  )

  return (
    <Layout>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-cyan-700">استقبال الخدمة</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">خدمة سريعة للسيارة</h2>
          <p className="mt-2 text-sm text-slate-500">
            {arrivalPlate
              ? `تم استقبال السيارة من كاميرا الباب: ${arrivalPlate}. أكمل بياناتها أو اخترها من النتائج ثم أضف الخدمات.`
              : 'ابحث عن السيارة، أضف الخدمات إلى الفاتورة، ثم اعتمد الفاتورة النهائية. Ctrl+Enter للحفظ.'}
          </p>
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
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-1">
              <p className="text-xs font-bold text-emerald-600">✓ تم قراءة اللوحة</p>
              <p className="font-mono text-lg font-black text-emerald-800">{scanResult.plate}</p>
              {scanResult.confidence > 0 && scanResult.confidence < 0.82 && (
                <p className="text-xs font-bold text-amber-700">تأكد من الرقم قبل الحفظ — جودة القراءة متوسطة</p>
              )}
              {scanResult.car_type && (
                <p className="text-xs font-bold text-slate-600">النوع: {scanResult.car_type}</p>
              )}
              {scanResult.car_color && (
                <p className="text-xs font-bold text-slate-600">اللون التقريبي: {scanResult.car_color}</p>
              )}
              {scanResult.candidates?.filter(p => p !== scanResult.plate).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {scanResult.candidates.filter(p => p !== scanResult.plate).map(candidate => (
                    <button
                      key={candidate}
                      onClick={() => {
                        setSearch(candidate)
                        setScanResult(prev => ({ ...prev, plate: candidate }))
                        setNewCarForm(prev => ({ ...prev, plate_number: candidate }))
                      }}
                      className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs font-black text-emerald-700"
                    >
                      {candidate}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {scanError && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
              <p>{scanError}</p>
              <p className="mt-1 text-xs font-semibold text-amber-700">
                نصيحة: اجعل اللوحة في منتصف الصورة، وتجنب الظل أو الانعكاس القوي.
              </p>
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

          <div className="mt-3 border-t border-slate-100 pt-3">
            <input
              ref={carAnalyzeInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={analyzeCarPhoto}
            />
            <button
              onClick={() => carAnalyzeInputRef.current?.click()}
              disabled={analyzingCar}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition">
              <Sparkles size={15} />
              {analyzingCar ? 'جاري تحليل السيارة...' : 'تحليل لون وماركة السيارة'}
            </button>
            {carAnalysis && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-xs font-bold text-slate-700">
                {carAnalysis.car_type && <p>الماركة/النوع: {carAnalysis.car_type}</p>}
                {carAnalysis.car_color && <p>اللون التقريبي: {carAnalysis.car_color}</p>}
              </div>
            )}
            {carAnalysisError && (
              <p className="mt-2 text-xs font-bold text-amber-700">{carAnalysisError}</p>
            )}
          </div>
        </div>

        {/* Service form */}
        <div className="space-y-4">
          {!selectedCar ? (
            <>
              <ServiceTypePicker
                serviceType={serviceType}
                setServiceType={setServiceType}
                oilGrade={oilGrade}
                setOilGrade={setOilGrade}
              />
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث عن السيارة برقم اللوحة..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-4 pl-4 pr-12 text-lg font-bold text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
              </div>
              <div className="space-y-2">
                {cars.map(c => (
                  <div key={c.id} onClick={() => { setSelectedCar(c); setNewCarForm(null) }}
                    className="surface flex cursor-pointer items-center justify-between rounded-lg px-5 py-4 transition hover:border-cyan-300 hover:bg-cyan-50">
                    <span className="font-mono text-xl font-black text-slate-950">{c.plate_number}</span>
                    <span className="text-slate-500 text-sm">{c.owner_name} {c.car_type ? `— ${c.car_type}` : ''} {c.car_color ? `· ${c.car_color}` : ''}</span>
                  </div>
                ))}
                {search.length > 1 && cars.length === 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="mb-3 text-sm font-black text-amber-800">السيارة غير مسجلة — أضفها الآن</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        ['plate_number', 'رقم اللوحة *'],
                        ['car_type', 'نوع السيارة'],
                        ['car_color', 'لون السيارة'],
                        ['owner_name', 'اسم المالك'],
                        ['phone', 'رقم الهاتف / واتساب'],
                      ].map(([k, label]) => (
                        <input key={k} placeholder={label}
                          value={newCarForm?.[k] ?? ''}
                          onChange={e => setNewCarForm(prev => ({ ...prev, [k]: e.target.value }))}
                          className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100" />
                      ))}
                    </div>
                    {createCarMutation.isError && (
                      <p className="mt-2 text-xs font-bold text-rose-600">رقم اللوحة مسجل مسبقاً</p>
                    )}
                    <button
                      onClick={() => createCarMutation.mutate(newCarForm)}
                      disabled={!newCarForm?.plate_number || createCarMutation.isPending}
                      className="mt-3 flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-black text-white hover:bg-amber-700 disabled:opacity-50 transition">
                      <PlusCircle size={15} />
                      {createCarMutation.isPending ? 'جاري الحفظ...' : 'حفظ وتابع الخدمة'}
                    </button>
                  </div>
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
                  <ServiceTypePicker
                    serviceType={serviceType}
                    setServiceType={setServiceType}
                    oilGrade={oilGrade}
                    setOilGrade={setOilGrade}
                  />
                </div>
                {[['amount', 'سعر هذه الخدمة (IQD) *', 'number'], ['notes', 'ملاحظات هذه الخدمة', 'text']].map(([k, p, t]) => (
                  <input key={k} type={t} placeholder={p} value={form[k]}
                    onChange={e => setForm({ ...form, [k]: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
                ))}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-500">
                    <Package size={14} /> خصم من المخزون (اختياري)
                  </div>
                  <div className="grid grid-cols-[1fr_90px] gap-2">
                    <select value={lineInventoryId} onChange={e => setLineInventoryId(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-400">
                      <option value="">— اختر المادة —</option>
                      {inventoryItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.oil_type} ({Number(item.quantity).toLocaleString()} {item.category || 'وحدة'})
                        </option>
                      ))}
                    </select>
                    <input type="number" min="0.1" step="0.1" value={lineInventoryQty}
                      onChange={e => setLineInventoryQty(e.target.value)}
                      placeholder="الكمية"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-400"
                      disabled={!lineInventoryId} />
                  </div>
                </div>
                <button onClick={addLineToInvoice} disabled={!form.amount}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-6 py-4 text-base font-black text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50">
                  <PlusCircle size={18} />
                  إضافة الخدمة إلى الفاتورة
                </button>
              </div>
              <div className="sticky top-24 h-fit rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl">
                <div className="mb-4 flex items-center gap-2 text-cyan-300"><Zap size={18} /><span className="font-black">الفاتورة النهائية</span></div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">السيارة</span><span className="font-mono font-black">{selectedCar.plate_number}</span></div>
                  <div className="rounded-lg border border-white/10 bg-white/5">
                    {invoiceLines.length ? invoiceLines.map(line => (
                      <div key={line.id} className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 last:border-0">
                        <button onClick={() => setInvoiceLines(prev => prev.filter(item => item.id !== line.id))}
                          className="text-rose-300 transition hover:text-rose-200">
                          <Trash2 size={15} />
                        </button>
                        <div className="flex-1 text-right">
                          <p className="font-black text-white">{line.name}</p>
                          {line.notes && <p className="text-xs text-slate-400">{line.notes}</p>}
                          {line.inventoryItemName && (
                            <p className="text-xs text-amber-300">📦 {line.inventoryQty} × {line.inventoryItemName}</p>
                          )}
                        </div>
                        <span className="font-black">{Number(line.amount).toLocaleString()}</span>
                      </div>
                    )) : (
                      <p className="px-3 py-6 text-center text-sm font-bold text-slate-400">أضف خدمة واحدة على الأقل</p>
                    )}
                  </div>
                  <input type="number" placeholder="عداد المسافة (كم)" value={form.mileage}
                    onChange={e => setForm({ ...form, mileage: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-cyan-300" />
                  <input type="number" placeholder="خصم الفاتورة (IQD)" value={form.discount}
                    onChange={e => setForm({ ...form, discount: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-cyan-300" />
                  <div className="flex justify-between"><span className="text-slate-400">الإجمالي</span><span>{invoiceTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">الخصم</span><span>{(Number(form.discount) || 0).toLocaleString()}</span></div>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-xs text-slate-400">الصافي</p>
                    <p className="mt-1 text-3xl font-black">{netAmount.toLocaleString()} IQD</p>
                  </div>
                </div>
                <button onClick={submitService}
                  disabled={!invoiceLines.length || mutation.isPending}
                  className="mt-5 w-full rounded-lg bg-emerald-500 px-6 py-4 text-lg font-black text-white transition hover:bg-emerald-600 disabled:opacity-50">
                  {mutation.isPending ? 'جاري...' : 'اعتماد الفاتورة النهائية'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

function ServiceTypePicker({ serviceType, setServiceType, oilGrade, setOilGrade }) {
  return (
    <div className="surface rounded-lg p-5">
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
      {serviceType === 'تبديل زيت' && (
        <div className="mt-4">
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
    </div>
  )
}
