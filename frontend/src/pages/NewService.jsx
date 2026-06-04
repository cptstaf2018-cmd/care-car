import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, BadgeDollarSign, Bandage, Battery, Brush, Car, CarFront, CircleDot,
  CircleGauge, Cog, Cpu, Disc3, Droplets, Eraser, Fan, Gauge, Hammer, Camera, CameraOff,
  Keyboard, Lightbulb, MonitorCog, Package, PaintRoller, Paintbrush,
  PlayCircle, PlugZap, Printer, RotateCw, ScanSearch, Search, ShieldCheck,
  Snowflake, Sparkles, SprayCan, ThermometerSnowflake, Trash2,
  UserPlus, Wallet, Wind, Wrench, Zap, CheckCircle2, PlusCircle,
} from 'lucide-react'
import Layout from '../components/Layout'
import { getCars, createCar } from '../api/cars'
import { createService } from '../api/services'
import { getInventory } from '../api/inventory'
import { getCenterSettings, readLatestMobilePlate } from '../api/settings'
import { DEFAULT_CENTER_SPECIALTY, getSpecialtyLabel } from '../constants/centerSpecialties'
import { hasPlanFeature } from '../constants/plans'
import { useAuthStore } from '../store/auth'

const WS_CAMERA_BASE = window.location.protocol === 'https:'
  ? `wss://${window.location.host}/ws/camera`
  : `ws://${window.location.host}/ws/camera`

const OIL_GRADES = ['15W40', '10W30', '5W30', '5W20', '0W20']
const SERVICE_ICON_MAP = {
  oil: Droplets,
  oilFilter: Package,
  airFilter: Wind,
  acFilter: Snowflake,
  coolant: ThermometerSnowflake,
  battery: Battery,
  sparkPlug: Zap,
  nitrogen: CircleGauge,
  wash: SprayCan,
  alignment: Gauge,
  balancing: Disc3,
  tire: CircleDot,
  tireSale: BadgeDollarSign,
  tirePatch: Bandage,
  tireValve: CircleGauge,
  tireRotate: RotateCw,
  washInterior: Brush,
  polish: Sparkles,
  wax: ShieldCheck,
  nano: Activity,
  disinfect: ShieldCheck,
  diagnostic: MonitorCog,
  alternator: Cog,
  starter: PlugZap,
  sensor: ScanSearch,
  headlight: Lightbulb,
  fuse: Zap,
  brake: Disc3,
  shock: Activity,
  controlArm: Wrench,
  belt: RotateCw,
  waterPump: Droplets,
  radiator: ThermometerSnowflake,
  inspection: ScanSearch,
  acGas: Snowflake,
  acLeak: Wind,
  compressor: Cog,
  evaporator: Snowflake,
  fan: Fan,
  paint: PaintRoller,
  dent: Hammer,
  scratch: Eraser,
  protection: ShieldCheck,
  service: Wrench,
}
const QUICK_SERVICE_TYPES = [
  { label: 'تبديل زيت', image: '/service-icons-3d/auto-pack/oil-can.webp', tone: 'cyan', hint: 'الأكثر طلباً' },
  { label: 'فلتر زيت', image: '/service-icons-3d/auto-pack/oil-filter.webp', tone: 'amber', hint: 'فلترة المحرك' },
  { label: 'فلتر هواء', image: '/service-icons-3d/auto-pack/air-filter.webp', tone: 'sky', hint: 'تنفس أنظف' },
  { label: 'فلتر مكيف', image: '/service-icons-3d/auto-pack/ac-filter.webp', tone: 'violet', hint: 'هواء المقصورة' },
  { label: 'تبديل ماء رديتر', image: '/service-icons-3d/auto-pack/radiator-coolant-exact.webp', tone: 'blue', hint: 'تبريد المحرك' },
  { label: 'فحص بطارية', image: '/service-icons-3d/auto-pack/battery-check.webp', tone: 'emerald', hint: 'فولتية وشحن' },
  { label: 'تبديل بواجي', image: '/service-icons-3d/auto-pack/spark-plug.webp', tone: 'fuchsia', hint: 'تشغيل أنعم' },
  { label: 'تعبئة نيتروجين', image: '/service-icons-3d/auto-pack/nitrogen.webp', tone: 'teal', hint: 'ضغط مستقر' },
  { label: 'غسيل', image: '/service-icons-3d/auto-pack/car-wash.webp', tone: 'indigo', hint: 'تنظيف سريع' },
  { label: 'ميزان', image: '/service-icons-3d/auto-pack/wheel-alignment.webp', tone: 'rose', hint: 'ثبات الطريق' },
  { label: 'ترصيص', image: '/service-icons-3d/auto-pack/wheel-balancing.webp', tone: 'slate', hint: 'اهتزاز أقل' },
]
const SERVICE_TEMPLATES = {
  quick_service: QUICK_SERVICE_TYPES,
  tires: [
    { label: 'تبديل إطار', image: '/service-icons-3d/auto-pack/tire-change-exact.webp', tone: 'slate', hint: 'تركيب إطار' },
    { label: 'بيع إطار', image: '/service-icons-3d/auto-pack/tire-sale-exact.webp', tone: 'cyan', hint: 'إطار جديد' },
    { label: 'رقعة إطار', image: '/service-icons-3d/auto-pack/tire-patch.webp', tone: 'amber', hint: 'تصليح بنجر' },
    { label: 'ترصيص', image: '/service-icons-3d/auto-pack/wheel-balancing-exact.webp', tone: 'rose', hint: 'توازن الإطار' },
    { label: 'ميزان', image: '/service-icons-3d/auto-pack/wheel-alignment-exact.webp', tone: 'sky', hint: 'ضبط مسار' },
    { label: 'تعبئة نيتروجين', image: '/service-icons-3d/auto-pack/nitrogen-fill-exact.webp', tone: 'teal', hint: 'ضغط ثابت' },
    { label: 'تبديل بلف', image: '/service-icons-3d/auto-pack/tire-valve-exact.webp', tone: 'emerald', hint: 'بلف الإطار' },
    { label: 'تدوير إطارات', image: '/service-icons-3d/auto-pack/tire-rotate.webp', tone: 'violet', hint: 'توزيع التآكل' },
  ],
  wash: [
    { label: 'غسيل خارجي', image: '/service-icons-3d/auto-pack/car-wash-exterior-exact.webp', tone: 'sky', hint: 'تنظيف سريع' },
    { label: 'غسيل كامل', image: '/service-icons-3d/auto-pack/car-wash-full-exact.webp', tone: 'cyan', hint: 'خارجي وداخلي' },
    { label: 'تنظيف داخلي', image: '/service-icons-3d/auto-pack/interior-clean.webp', tone: 'indigo', hint: 'المقصورة' },
    { label: 'بولش', image: '/service-icons-3d/auto-pack/polisher.webp', tone: 'amber', hint: 'لمعان الطلاء' },
    { label: 'واكس', image: '/service-icons-3d/auto-pack/wax-shield.webp', tone: 'teal', hint: 'حماية الطلاء' },
    { label: 'نانو سيراميك', image: '/service-icons-3d/auto-pack/nano-shield.webp', tone: 'violet', hint: 'حماية متقدمة' },
    { label: 'تعقيم', image: '/service-icons-3d/auto-pack/disinfect-spray.webp', tone: 'emerald', hint: 'تنظيف صحي' },
  ],
  electrical: [
    { label: 'فحص كمبيوتر', image: '/service-icons-3d/auto-pack/computer-scan.webp', tone: 'cyan', hint: 'تشخيص أعطال' },
    { label: 'تبديل بطارية', image: '/service-icons-3d/auto-pack/battery.webp', tone: 'emerald', hint: 'بطارية جديدة' },
    { label: 'فحص دينمو', image: '/service-icons-3d/auto-pack/alternator.webp', tone: 'amber', hint: 'شحن السيارة' },
    { label: 'تصليح سلف', image: '/service-icons-3d/auto-pack/starter.webp', tone: 'slate', hint: 'تشغيل المحرك' },
    { label: 'تبديل حساس', image: '/service-icons-3d/auto-pack/sensor.webp', tone: 'sky', hint: 'حساسات السيارة' },
    { label: 'تصليح إنارة', image: '/service-icons-3d/auto-pack/headlight.webp', tone: 'violet', hint: 'مصابيح وأسلاك' },
    { label: 'تبديل فيوز', image: '/service-icons-3d/auto-pack/fuse.webp', tone: 'rose', hint: 'كهرباء داخلية' },
  ],
  mechanic: [
    { label: 'تبديل بريك', image: '/service-icons-3d/auto-pack/brake-replace-exact.webp', tone: 'rose', hint: 'أمان الفرامل' },
    { label: 'تبديل جامبين', image: '/service-icons-3d/auto-pack/shock.webp', tone: 'slate', hint: 'تعليق السيارة' },
    { label: 'تبديل مقص', image: '/service-icons-3d/auto-pack/control-arm.webp', tone: 'amber', hint: 'أذرع التعليق' },
    { label: 'تبديل سير', image: '/service-icons-3d/auto-pack/engine-belt.webp', tone: 'cyan', hint: 'سيور المحرك' },
    { label: 'تبديل مضخة ماء', image: '/service-icons-3d/auto-pack/water-pump.webp', tone: 'blue', hint: 'تبريد المحرك' },
    { label: 'تصليح رديتر', image: '/service-icons-3d/auto-pack/radiator.webp', tone: 'sky', hint: 'نظام التبريد' },
    { label: 'فحص عام', image: '/service-icons-3d/auto-pack/inspection.webp', tone: 'emerald', hint: 'كشف ميكانيكي' },
  ],
  ac: [
    { label: 'تعبئة غاز مكيف', image: '/service-icons-3d/auto-pack/ac-gas-exact.webp', tone: 'cyan', hint: 'تبريد أفضل' },
    { label: 'فحص تهريب مكيف', image: '/service-icons-3d/auto-pack/ac-leak-exact.webp', tone: 'sky', hint: 'كشف تسريب' },
    { label: 'تبديل كمبروسر', image: '/service-icons-3d/auto-pack/ac-compressor-exact.webp', tone: 'violet', hint: 'ضاغط المكيف' },
    { label: 'تبديل فلتر مكيف', image: '/service-icons-3d/auto-pack/ac-filter.webp', tone: 'emerald', hint: 'هواء المقصورة' },
    { label: 'تنظيف ثلاجة', image: '/service-icons-3d/auto-pack/ac-evaporator-exact.webp', tone: 'teal', hint: 'تنظيف داخلي' },
    { label: 'تصليح مروحة', image: '/service-icons-3d/auto-pack/fan.webp', tone: 'amber', hint: 'هواء وتبريد' },
  ],
  body_paint: [
    { label: 'صبغ قطعة', image: '/service-icons-3d/auto-pack/paint-spray.webp', tone: 'rose', hint: 'دهان موضعي' },
    { label: 'سمكرة ضربة', image: '/service-icons-3d/auto-pack/dent-repair.webp', tone: 'slate', hint: 'تعديل الهيكل' },
    { label: 'تلميع', image: '/service-icons-3d/auto-pack/polisher.webp', tone: 'amber', hint: 'لمعان الطلاء' },
    { label: 'بولش خدوش', image: '/service-icons-3d/auto-pack/scratch-polish.webp', tone: 'cyan', hint: 'إزالة آثار' },
    { label: 'حماية طلاء', image: '/service-icons-3d/auto-pack/paint-protection.webp', tone: 'teal', hint: 'طبقة حماية' },
  ],
}

const SERVICE_TONES = {
  amber: {
    icon: 'bg-gradient-to-br from-amber-50 via-orange-100 to-amber-200 text-orange-600 ring-orange-200 shadow-orange-200/70',
    card: 'from-orange-50/80 via-white to-white border-orange-200 hover:border-orange-300',
    active: 'border-orange-300 bg-gradient-to-l from-orange-50 via-white to-white text-slate-950 shadow-orange-100/80',
    check: 'bg-orange-500 text-white shadow-orange-200',
    oil: 'from-orange-50 via-white to-white border-orange-200 text-orange-700 shadow-orange-100/80',
  },
  blue: {
    icon: 'bg-gradient-to-br from-sky-50 via-blue-100 to-blue-200 text-blue-600 ring-blue-200 shadow-blue-200/70',
    card: 'from-blue-50/80 via-white to-white border-blue-200 hover:border-blue-300',
    active: 'border-blue-300 bg-gradient-to-l from-blue-50 via-white to-white text-slate-950 shadow-blue-100/80',
    check: 'bg-blue-500 text-white shadow-blue-200',
    oil: 'from-blue-50 via-white to-white border-blue-200 text-blue-700 shadow-blue-100/80',
  },
  cyan: {
    icon: 'bg-gradient-to-br from-cyan-50 via-sky-100 to-cyan-200 text-cyan-600 ring-cyan-200 shadow-cyan-200/70',
    card: 'from-cyan-50/80 via-white to-white border-cyan-200 hover:border-cyan-300',
    active: 'border-cyan-400 bg-gradient-to-l from-cyan-50 via-white to-white text-slate-950 shadow-cyan-100/90',
    check: 'bg-blue-500 text-white shadow-blue-200',
    oil: 'from-cyan-50 via-white to-white border-cyan-300 text-cyan-700 shadow-cyan-100/80',
  },
  emerald: {
    icon: 'bg-gradient-to-br from-emerald-50 via-teal-100 to-emerald-200 text-emerald-600 ring-emerald-200 shadow-emerald-200/70',
    card: 'from-emerald-50/80 via-white to-white border-emerald-200 hover:border-emerald-300',
    active: 'border-emerald-300 bg-gradient-to-l from-emerald-50 via-white to-white text-slate-950 shadow-emerald-100/80',
    check: 'bg-emerald-500 text-white shadow-emerald-200',
    oil: 'from-emerald-50 via-white to-white border-emerald-200 text-emerald-700 shadow-emerald-100/80',
  },
  fuchsia: {
    icon: 'bg-gradient-to-br from-fuchsia-50 via-purple-100 to-fuchsia-200 text-fuchsia-600 ring-fuchsia-200 shadow-fuchsia-200/70',
    card: 'from-fuchsia-50/80 via-white to-white border-fuchsia-200 hover:border-fuchsia-300',
    active: 'border-fuchsia-300 bg-gradient-to-l from-fuchsia-50 via-white to-white text-slate-950 shadow-fuchsia-100/80',
    check: 'bg-fuchsia-500 text-white shadow-fuchsia-200',
    oil: 'from-fuchsia-50 via-white to-white border-fuchsia-200 text-fuchsia-700 shadow-fuchsia-100/80',
  },
  indigo: {
    icon: 'bg-gradient-to-br from-indigo-50 via-blue-100 to-indigo-200 text-indigo-600 ring-indigo-200 shadow-indigo-200/70',
    card: 'from-blue-50/80 via-white to-white border-blue-200 hover:border-blue-300',
    active: 'border-blue-300 bg-gradient-to-l from-blue-50 via-white to-white text-slate-950 shadow-blue-100/80',
    check: 'bg-blue-500 text-white shadow-blue-200',
    oil: 'from-indigo-50 via-white to-white border-indigo-200 text-indigo-700 shadow-indigo-100/80',
  },
  rose: {
    icon: 'bg-gradient-to-br from-rose-50 via-pink-100 to-rose-200 text-rose-600 ring-rose-200 shadow-rose-200/70',
    card: 'from-rose-50/80 via-white to-white border-rose-200 hover:border-rose-300',
    active: 'border-rose-300 bg-gradient-to-l from-rose-50 via-white to-white text-slate-950 shadow-rose-100/80',
    check: 'bg-rose-500 text-white shadow-rose-200',
    oil: 'from-rose-50 via-white to-white border-rose-200 text-rose-700 shadow-rose-100/80',
  },
  sky: {
    icon: 'bg-gradient-to-br from-sky-50 via-cyan-100 to-sky-200 text-sky-600 ring-sky-200 shadow-sky-200/70',
    card: 'from-sky-50/80 via-white to-white border-sky-200 hover:border-sky-300',
    active: 'border-sky-300 bg-gradient-to-l from-sky-50 via-white to-white text-slate-950 shadow-sky-100/80',
    check: 'bg-sky-500 text-white shadow-sky-200',
    oil: 'from-sky-50 via-white to-white border-sky-200 text-sky-700 shadow-sky-100/80',
  },
  slate: {
    icon: 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-700 ring-slate-200 shadow-slate-200/70',
    card: 'from-slate-50/80 via-white to-white border-slate-200 hover:border-slate-300',
    active: 'border-slate-300 bg-gradient-to-l from-slate-100 via-white to-white text-slate-950 shadow-slate-100/80',
    check: 'bg-slate-700 text-white shadow-slate-200',
    oil: 'from-slate-50 via-white to-white border-slate-200 text-slate-700 shadow-slate-100/80',
  },
  teal: {
    icon: 'bg-gradient-to-br from-teal-50 via-emerald-100 to-teal-200 text-teal-600 ring-teal-200 shadow-teal-200/70',
    card: 'from-teal-50/80 via-white to-white border-teal-200 hover:border-teal-300',
    active: 'border-teal-300 bg-gradient-to-l from-teal-50 via-white to-white text-slate-950 shadow-teal-100/80',
    check: 'bg-teal-500 text-white shadow-teal-200',
    oil: 'from-teal-50 via-white to-white border-teal-200 text-teal-700 shadow-teal-100/80',
  },
  violet: {
    icon: 'bg-gradient-to-br from-violet-50 via-purple-100 to-violet-200 text-violet-600 ring-violet-200 shadow-violet-200/70',
    card: 'from-violet-50/80 via-white to-white border-violet-200 hover:border-violet-300',
    active: 'border-violet-300 bg-gradient-to-l from-violet-50 via-white to-white text-slate-950 shadow-violet-100/80',
    check: 'bg-violet-500 text-white shadow-violet-200',
    oil: 'from-violet-50 via-white to-white border-violet-200 text-violet-700 shadow-violet-100/80',
  },
}

export default function NewService() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const user = useAuthStore(s => s.user)
  const arrivalPlate = searchParams.get('plate') || ''
  const arrivalCarType = searchParams.get('car_type') || ''
  const arrivalCarColor = searchParams.get('car_color') || ''
  const [search, setSearch] = useState('')
  const [selectedCar, setSelectedCar] = useState(null)
  const [newCarForm, setNewCarForm] = useState(null) // { plate_number, car_type, car_color }
  const [serviceType, setServiceType] = useState('')
  const [oilGrade, setOilGrade] = useState('15W40')
  const [form, setForm] = useState({ amount: '', discount: '0', mileage: '', notes: '' })
  const [lineInventoryId, setLineInventoryId] = useState('')
  const [lineInventoryQty, setLineInventoryQty] = useState('1')
  const [invoiceLines, setInvoiceLines] = useState([])
  const [paymentMode, setPaymentMode] = useState('paid')
  const [paidAmount, setPaidAmount] = useState('')
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [receptionActive, setReceptionActive] = useState(false)
  const [receptionStatus, setReceptionStatus] = useState('idle')
  const [receptionError, setReceptionError] = useState('')
  const [receptionFrame, setReceptionFrame] = useState('')
  const [receptionPlates, setReceptionPlates] = useState([])
  const [receptionCount, setReceptionCount] = useState(0)
  const receptionWsRef = useRef(null)

  const { data: centerSettings, isLoading: centerSettingsLoading } = useQuery({
    queryKey: ['center-settings'],
    queryFn: () => getCenterSettings().then(r => r.data),
  })
  const centerSpecialty = centerSettings?.specialty || DEFAULT_CENTER_SPECIALTY
  const cameraEnabled = centerSettings && hasPlanFeature(centerSettings.plan, 'camera')
  const inventoryAutomationEnabled = centerSettings && hasPlanFeature(centerSettings.plan, 'inventory_auto_deduct')
  const serviceTypes = SERVICE_TEMPLATES[centerSpecialty] || SERVICE_TEMPLATES[DEFAULT_CENTER_SPECIALTY]
  const defaultServiceType = serviceTypes[0]?.label || 'خدمة'
  const usesOilGrade = serviceType === 'تبديل زيت'

  const stopReception = useCallback(() => {
    receptionWsRef.current?.close()
    receptionWsRef.current = null
    setReceptionStatus('idle')
    setReceptionActive(false)
    setReceptionFrame('')
  }, [])

  const chooseReceptionPlate = useCallback((item) => {
    setSearch(item.plate)
    setSubmitError('')
    if (item.car) {
      setSelectedCar(item.car)
      setNewCarForm(null)
      return
    }
    setSelectedCar(null)
    setNewCarForm({
      plate_number: item.plate,
      car_type: item.car_type || '',
      car_color: item.car_color || '',
      owner_name: '',
      phone: '',
    })
  }, [])

  const startReception = useCallback(() => {
    if (!user?.tenant_id) return
    receptionWsRef.current?.close()
    setReceptionStatus('connecting')
    setReceptionError('')
    const token = useAuthStore.getState().token
    const ws = new WebSocket(`${WS_CAMERA_BASE}/${user.tenant_id}?token=${encodeURIComponent(token || '')}`)
    receptionWsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'connected') {
        setReceptionStatus('active')
      } else if (msg.type === 'frame') {
        setReceptionFrame(`data:image/jpeg;base64,${msg.data}`)
      } else if (msg.type === 'plate_detected' || msg.type === 'plate_candidate') {
        const confirmed = msg.type === 'plate_detected'
        if (confirmed) setReceptionCount(n => n + 1)
        setReceptionPlates(prev => [
          {
            plate: msg.plate,
            car: msg.car,
            car_type: msg.car_type,
            car_color: msg.car_color,
            confidence: msg.confidence,
            votes: msg.votes,
            confirmed,
            frame: msg.frame ? `data:image/jpeg;base64,${msg.frame}` : '',
            time: new Date().toLocaleTimeString('ar-IQ'),
          },
          ...prev.filter(item => item.plate !== msg.plate).slice(0, 7)
        ])
      } else if (msg.type === 'error') {
        setReceptionStatus('error')
        setReceptionError(msg.message || 'تعذر تشغيل استقبال السيارة')
        setReceptionActive(false)
      }
    }

    ws.onclose = () => {
      setReceptionStatus(prev => prev === 'error' ? prev : 'idle')
    }

    ws.onerror = () => {
      setReceptionStatus('error')
      setReceptionError('تعذر الاتصال بالكاميرا')
      setReceptionActive(false)
    }
  }, [user?.tenant_id])

  useEffect(() => {
    if (receptionActive) startReception()
    else if (receptionWsRef.current) stopReception()
  }, [receptionActive, startReception, stopReception])

  useEffect(() => () => receptionWsRef.current?.close(), [])

  useEffect(() => {
    if (centerSettingsLoading) return
    if (!serviceTypes.some(item => item.label === serviceType)) {
      setServiceType(defaultServiceType)
      setLineInventoryId('')
      setForm(prev => ({ ...prev, amount: '', notes: '' }))
    }
  }, [centerSettingsLoading, defaultServiceType, serviceType, serviceTypes])

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data),
    enabled: !!selectedCar && !!inventoryAutomationEnabled,
  })

  // Auto-match inventory item when service type or oil grade changes
  useEffect(() => {
    if (!selectedCar || !inventoryAutomationEnabled || inventoryItems.length === 0) return
    const kwMap = {
      'تبديل زيت': [oilGrade, oilGrade.replace('W', 'W-'), 'زيت محرك', 'زيت'],
      'فلتر زيت': ['فلتر زيت'],
      'فلتر هواء': ['فلتر هواء'],
      'فلتر مكيف': ['فلتر مكيف'],
      'تبديل ماء رديتر': ['ماء رديتر', 'رديتر'],
      'تبديل بواجي': ['شمعات', 'بواجي'],
      'ترصيص': ['أوزان', 'ترصيص'],
      'تبديل إطار': ['إطار', 'تاير'],
      'بيع إطار': ['إطار', 'تاير'],
      'رقعة إطار': ['رقعة', 'لصق'],
      'تبديل بلف': ['بلف'],
      'تعبئة نيتروجين': ['نيتروجين'],
      'تبديل بطارية': ['بطارية'],
      'تبديل فلتر مكيف': ['فلتر مكيف'],
      'تعبئة غاز مكيف': ['غاز مكيف', 'فريون'],
      'تبديل بريك': ['بريك', 'فرامل'],
      'تبديل سير': ['سير'],
      'تبديل مضخة ماء': ['مضخة ماء', 'طرمبة ماء'],
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
  }, [serviceType, oilGrade, inventoryItems, selectedCar, inventoryAutomationEnabled])

  // Auto-fill price from selected inventory item
  useEffect(() => {
    if (!lineInventoryId) return
    const item = inventoryItems.find(i => i.id === Number(lineInventoryId))
    if (item?.unit_cost) {
      const qty = parseFloat(lineInventoryQty) || 1
      setForm(prev => ({ ...prev, amount: String(Math.round(item.unit_cost * qty)) }))
    }
  }, [lineInventoryId, lineInventoryQty, inventoryItems])

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
    onSuccess: (res) => {
      setSubmitError('')
      navigate(`/center/invoices/${res.data.invoice_id}/print`, { replace: true })
    },
    onError: (err) => {
      setSubmitError(err.response?.data?.detail || 'تعذر اعتماد الفاتورة. راجع البيانات وحاول مرة أخرى.')
    },
  })

  const createCarMutation = useMutation({
    mutationFn: createCar,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['cars'] })
      setSelectedCar(res.data)
      setNewCarForm(null)
    },
  })

  const latestPlateMutation = useMutation({
    mutationFn: readLatestMobilePlate,
    onSuccess: (res) => {
      const data = res.data || {}
      const plate = data.plate_number || ''
      if (!plate) {
        setReceptionStatus('error')
        setReceptionError(data.message || 'لم نتمكن من قراءة اللوحة من آخر صورة')
        return
      }
      const item = {
        plate,
        car: null,
        car_type: '',
        car_color: '',
        confidence: data.confidence,
        votes: 1,
        confirmed: true,
        frame: '',
        time: new Date().toLocaleTimeString('ar-IQ'),
      }
      setReceptionPlates(prev => [item, ...prev.filter(row => row.plate !== plate).slice(0, 7)])
      setReceptionCount(n => n + 1)
      chooseReceptionPlate(item)
      setReceptionStatus('active')
      setReceptionError('')
    },
    onError: (err) => {
      setReceptionStatus('error')
      setReceptionError(err.response?.data?.detail || 'لا توجد صورة حديثة من كاميرا الموبايل')
    },
  })

  const invoiceTotal = invoiceLines.reduce((sum, line) => sum + Number(line.amount || 0), 0)
  const netAmount = invoiceTotal - (parseFloat(form.discount) || 0)
  const normalizedNet = Math.max(netAmount, 0)
  const effectivePaidAmount = paymentMode === 'paid'
    ? normalizedNet
    : paymentMode === 'unpaid'
      ? 0
      : Math.min(Math.max(parseFloat(paidAmount) || 0, 0), normalizedNet)
  const remainingAmount = Math.max(normalizedNet - effectivePaidAmount, 0)
  const canSubmit = selectedCar && invoiceLines.length > 0 && !mutation.isPending
  const serviceName = usesOilGrade ? `${serviceType} ${oilGrade}` : serviceType
  const addLineToInvoice = () => {
    if (!form.amount) return
    setSubmitError('')
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
    setSubmitError('')
    const deductions = invoiceLines
      .filter(l => l.inventoryItemId)
      .map(l => ({ item_id: l.inventoryItemId, quantity: l.inventoryQty }))
    const invoiceDetails = invoiceLines.map(line => ({
      name: line.name,
      amount: Number(line.amount || 0),
      notes: line.notes || '',
      inventory_item_name: line.inventoryItemName || '',
      inventory_quantity: line.inventoryQty || null,
    }))
    mutation.mutate({
      car_id: selectedCar.id,
      oil_type: invoiceLines.map(line => line.name).join(' + '),
      amount: invoiceTotal,
      discount: parseFloat(form.discount) || 0,
      mileage: form.mileage ? parseFloat(form.mileage) : null,
      notes: `INVOICE_LINES:${JSON.stringify(invoiceDetails)}`,
      inventory_deductions: deductions,
      payment_status: paymentMode,
      paid_amount: effectivePaidAmount,
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

  if (result) return (
    <Layout>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="surface mx-auto max-w-lg rounded-2xl p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={32} /></div>
        <h2 className="text-2xl font-black text-slate-950 mb-1">تم تسجيل الخدمة</h2>
        <p className="text-slate-500 text-sm mb-5">الفاتورة جاهزة — يمكنك طباعتها أو تعديلها أو حذفها</p>
        <div className="mb-6 space-y-2 rounded-xl bg-slate-50 p-4 text-right border border-slate-200">
          <div className="flex justify-between"><span className="text-slate-500">رقم الفاتورة</span><span className="font-black text-slate-950">#{result.invoice_id}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">المبلغ</span><span className="font-black text-emerald-700">{result.amount?.toLocaleString()} IQD</span></div>
          <div className="flex justify-between"><span className="text-slate-500">المدفوع</span><span className="font-black text-slate-950">{Number(result.paid_amount || 0).toLocaleString()} IQD</span></div>
          <div className="flex justify-between"><span className="text-slate-500">الدين</span><span className={`font-black ${result.remaining_amount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{Number(result.remaining_amount || 0).toLocaleString()} IQD</span></div>
          <div className="flex justify-between"><span className="text-slate-500">الحالة</span><span className={`font-black ${result.status === 'paid' ? 'text-emerald-700' : result.status === 'partial' ? 'text-amber-700' : 'text-rose-700'}`}>{result.status === 'paid' ? 'مدفوعة' : result.status === 'partial' ? 'جزئية' : 'دين'}</span></div>
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
          <button onClick={() => { setResult(null); setSelectedCar(null); setSearch(''); setServiceType(defaultServiceType); setOilGrade('15W40'); setInvoiceLines([]); setPaymentMode('paid'); setPaidAmount(''); setForm({ amount: '', discount: '0', mileage: '', notes: '' }) }}
            className="rounded-xl border border-slate-200 px-8 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            خدمة جديدة
          </button>
        </div>
      </motion.div>
    </Layout>
  )

  if (centerSettingsLoading) return (
    <Layout>
      <div className="surface rounded-lg p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
          <Wrench size={24} />
        </div>
        <p className="text-lg font-black text-slate-950">جاري تجهيز قالب المركز...</p>
        <p className="mt-2 text-sm font-bold text-slate-500">نقرأ اختصاص المركز حتى تظهر الخدمات المناسبة فقط.</p>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-cyan-700">استقبال الخدمة</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">خدمة سيارة - {getSpecialtyLabel(centerSpecialty)}</h2>
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

      <section className="mb-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface overflow-hidden rounded-lg">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white p-4">
            <div>
              <p className="text-xs font-black text-cyan-700">كاميرا الاستقبال</p>
              <h3 className="mt-1 font-black text-slate-950">قراءة لوحة السيارة</h3>
            </div>
            <button
              type="button"
              onClick={() => cameraEnabled && setReceptionActive(v => !v)}
              disabled={!cameraEnabled}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition ${
                receptionActive
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-slate-950 text-white hover:bg-slate-800'
              } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
            >
              {receptionActive ? <CameraOff size={17} /> : <Camera size={17} />}
              {receptionActive ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
            </button>
          </div>
          <div className="p-4">
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
              {receptionFrame ? (
                <img src={receptionFrame} alt="بث كاميرا الاستقبال" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-slate-100">
                  <div className="text-center">
                    <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full ${
                      receptionActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {receptionActive ? <Camera size={30} /> : <CameraOff size={30} />}
                    </div>
                    <p className="font-black text-slate-600">
                      {cameraEnabled ? (receptionActive ? 'بانتظار صورة من الموبايل' : 'الكاميرا متوقفة') : 'قراءة اللوحة ضمن الخطة المميزة'}
                    </p>
                  </div>
                </div>
              )}
              {receptionStatus === 'active' && (
                <div className="absolute right-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white shadow-lg">
                  يعمل
                </div>
              )}
            </div>
            <div className="mt-3 min-h-[26px] text-center text-sm font-bold">
              {receptionStatus === 'connecting' && <span className="text-amber-600">جاري الاتصال بالكاميرا...</span>}
              {receptionStatus === 'active' && <span className="text-emerald-700">النظام يقرأ اللوحات الآن</span>}
              {receptionStatus === 'error' && <span className="text-rose-600">{receptionError}</span>}
              {receptionStatus === 'idle' && cameraEnabled && <span className="text-slate-500">افتح رابط كاميرا الموبايل ثم شغّل الكاميرا هنا</span>}
              {receptionStatus === 'idle' && !cameraEnabled && (
                <a href="/center/settings?upgrade=1" className="text-cyan-700 hover:underline">طلب ترقية لتفعيل كاميرا قراءة اللوحة</a>
              )}
            </div>
            {cameraEnabled && (
              <button
                type="button"
                onClick={() => latestPlateMutation.mutate()}
                disabled={latestPlateMutation.isPending}
                className="mt-3 w-full rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-black text-cyan-800 transition hover:bg-cyan-100 disabled:opacity-50"
              >
                {latestPlateMutation.isPending ? 'جاري قراءة آخر صورة...' : 'قراءة آخر صورة من كاميرا الموبايل'}
              </button>
            )}
          </div>
        </div>

        <div className="surface overflow-hidden rounded-lg">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white p-4">
            <div>
              <p className="text-xs font-black text-cyan-700">نتائج CTK</p>
              <h3 className="mt-1 font-black text-slate-950">اللوحات المقروءة</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
              {receptionCount}
            </span>
          </div>
          <div className="max-h-[430px] space-y-3 overflow-y-auto p-4">
            {receptionPlates.length ? receptionPlates.map((item, index) => (
              <motion.div
                key={`${item.plate}-${item.time}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[128px_1fr]"
              >
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  {item.frame ? (
                    <img src={item.frame} alt={`لوحة ${item.plate}`} className="h-24 w-full object-cover" />
                  ) : (
                    <div className="flex h-24 items-center justify-center">
                      <CarFront size={28} className="text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-2xl font-black text-slate-950">{item.plate}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                          item.confirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.confirmed ? 'مؤكد' : 'مرشح'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {item.confidence ? `ثقة ${Math.round(item.confidence * 100)}%` : 'قراءة أولية'}
                        {item.votes ? ` · ${item.votes} قراءات` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{item.time}</span>
                  </div>
                  <p className={`mt-2 rounded-md px-3 py-2 text-xs font-black ${
                    item.car ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {item.car ? `${item.car.owner_name || 'زبون معروف'} · ${item.car.car_type || 'سيارة مسجلة'}` : 'سيارة غير مسجلة'}
                  </p>
                  <button
                    type="button"
                    onClick={() => chooseReceptionPlate(item)}
                    className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black transition ${
                      item.car ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    {item.car ? <PlayCircle size={16} /> : <UserPlus size={16} />}
                    {item.car ? 'اختيار السيارة' : 'إضافة السيارة'}
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="flex min-h-[230px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                <div>
                  <ScanSearch size={34} className="mx-auto mb-3 text-slate-300" />
                  <p className="font-black text-slate-600">لا توجد لوحة مقروءة بعد</p>
                  <p className="mt-1 text-sm font-bold text-slate-400">عند قراءة اللوحة ستظهر هنا مع صورتها.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        {/* Service form */}
        <div className="space-y-4">
          {!selectedCar ? (
            <>
              <ServiceTypePicker
                serviceType={serviceType}
                setServiceType={setServiceType}
                oilGrade={oilGrade}
                setOilGrade={setOilGrade}
                serviceTypes={serviceTypes}
                specialtyLabel={getSpecialtyLabel(centerSpecialty)}
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
                    serviceTypes={serviceTypes}
                    specialtyLabel={getSpecialtyLabel(centerSpecialty)}
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
                  {inventoryAutomationEnabled ? (
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
                  ) : (
                    <div className="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-bold leading-5 text-cyan-900">
                      الخصم التلقائي من المخزون مفعل في خطتك عند توفر مواد مسجلة.
                    </div>
                  )}
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
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="mb-3 flex items-center gap-2 text-cyan-300">
                      <Wallet size={16} />
                      <span className="text-sm font-black">طريقة الدفع</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['paid', 'دفع كامل'],
                        ['partial', 'دفع جزء'],
                        ['unpaid', 'لم يدفع'],
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPaymentMode(key)}
                          className={`rounded-lg px-2 py-2 text-xs font-black transition ${
                            paymentMode === key ? 'bg-cyan-400 text-slate-950' : 'bg-white/10 text-slate-300 hover:bg-white/15'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {paymentMode === 'partial' && (
                      <input
                        type="number"
                        min="0"
                        max={normalizedNet}
                        placeholder="كم دفع الزبون؟"
                        value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value)}
                        className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-cyan-300"
                      />
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-emerald-500/10 px-2 py-2">
                        <p className="text-emerald-200">المدفوع</p>
                        <p className="mt-1 font-black text-white">{effectivePaidAmount.toLocaleString()} IQD</p>
                      </div>
                      <div className="rounded-md bg-rose-500/10 px-2 py-2">
                        <p className="text-rose-200">الدين</p>
                        <p className="mt-1 font-black text-white">{remainingAmount.toLocaleString()} IQD</p>
                      </div>
                    </div>
                  </div>
                </div>
                {submitError && (
                  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">
                    {submitError}
                  </div>
                )}
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

function ServiceTypePicker({ serviceType, setServiceType, oilGrade, setOilGrade, serviceTypes, specialtyLabel }) {
  const selectedService = serviceTypes.find(item => item.label === serviceType) || serviceTypes[0]
  const selectedTone = SERVICE_TONES[selectedService.tone] || SERVICE_TONES.cyan
  const SelectedIcon = SERVICE_ICON_MAP[selectedService.icon] || SERVICE_ICON_MAP.service

  return (
    <div className="surface overflow-hidden rounded-lg">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-l from-slate-50 via-white to-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 shadow-lg ${selectedTone.icon}`}>
            {selectedService.image ? (
              <img src={selectedService.image} alt="" className="h-11 w-11 object-contain" />
            ) : (
              <SelectedIcon size={26} strokeWidth={2.5} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Car size={17} className="text-cyan-700" />
              <h3 className="font-black text-slate-950">{specialtyLabel}</h3>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-500">{selectedService.label} · {selectedService.hint}</p>
          </div>
        </div>
        <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm">
          {serviceType === 'تبديل زيت' ? oilGrade : 'خدمة مباشرة'}
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {serviceTypes.map(({ label, icon, image, tone }) => {
            const isActive = serviceType === label
            const toneClasses = SERVICE_TONES[tone] || SERVICE_TONES.cyan
            const Icon = SERVICE_ICON_MAP[icon] || SERVICE_ICON_MAP.service

            return (
              <motion.button
                key={label}
                type="button"
                onClick={() => setServiceType(label)}
                whileTap={{ scale: 0.98 }}
                className={`group relative min-h-[82px] overflow-hidden rounded-xl border bg-gradient-to-l px-4 py-3 text-right transition duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-100 ${
                  isActive
                    ? `${toneClasses.active} shadow-xl`
                    : `${toneClasses.card} text-slate-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md`
                }`}
              >
                <span className="flex h-full items-center justify-between gap-3">
                  <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ring-1 shadow-lg transition ${toneClasses.icon}`}>
                    {image ? (
                      <img src={image} alt="" className="h-14 w-14 object-contain drop-shadow-md transition duration-200 group-hover:scale-105" />
                    ) : (
                      <Icon size={34} strokeWidth={2.35} className="transition duration-200 group-hover:scale-105" />
                    )}
                  </span>
                  {isActive && (
                    <span className={`absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full shadow-md ${toneClasses.check}`}>
                      <CheckCircle2 size={18} strokeWidth={3} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 pr-2">
                    <span className="block text-lg font-black leading-7 text-slate-950">{label}</span>
                  </span>
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
      {serviceType === 'تبديل زيت' && (
        <div className="border-t border-slate-100 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-black text-slate-800">
              <Droplets size={19} className="text-blue-500" />
              نوع الزيت
            </p>
            <p className="text-xs font-bold text-slate-500">درجة اللزوجة</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {OIL_GRADES.map((t, index) => {
              const oilTone = [
                SERVICE_TONES.cyan,
                SERVICE_TONES.amber,
                SERVICE_TONES.fuchsia,
                SERVICE_TONES.emerald,
                SERVICE_TONES.amber,
              ][index]
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOilGrade(t)}
                  className={`relative flex min-h-[54px] items-center justify-between gap-2 rounded-lg border bg-gradient-to-l px-3 py-2 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-cyan-100 ${
                    oilGrade === t
                      ? `${oilTone.oil} shadow-lg`
                      : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-cyan-200 hover:bg-cyan-50'
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 shadow-md ${oilTone.icon}`}>
                    <img src="/service-icons-3d/auto-pack/oil-can.webp" alt="" className="h-7 w-7 object-contain" />
                  </span>
                  <span className="text-slate-950">{t}</span>
                  {oilGrade === t && (
                    <CheckCircle2 size={20} className="text-blue-500" strokeWidth={3} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
