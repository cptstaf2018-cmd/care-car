import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Camera, CameraOff, Car, PlayCircle, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import UpgradePrompt from '../components/UpgradePrompt'
import { getCenterSettings } from '../api/settings'
import { hasPlanFeature } from '../constants/plans'
import { useAuthStore } from '../store/auth'

const WS_BASE = window.location.protocol === 'https:'
  ? `wss://${window.location.host}/ws/camera`
  : `ws://${window.location.host}/ws/camera`

export default function CameraMonitor() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { data: center } = useQuery({
    queryKey: ['center-settings', 'camera-gate'],
    queryFn: () => getCenterSettings().then(r => r.data),
  })
  const [active, setActive] = useState(false)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [todayCount, setTodayCount] = useState(0)
  const [recentPlates, setRecentPlates] = useState([])
  const [currentFrame, setCurrentFrame] = useState('')
  const wsRef = useRef(null)
  const cameraEnabled = center && hasPlanFeature(center.plan, 'camera')

  const connect = useCallback(() => {
    if (wsRef.current) wsRef.current.close()
    setStatus('connecting')
    setErrorMsg('')
    const token = useAuthStore.getState().token
    const ws = new WebSocket(`${WS_BASE}/${user?.tenant_id}?token=${encodeURIComponent(token || '')}`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'connected') {
        setStatus('active')
      } else if (msg.type === 'frame') {
        setCurrentFrame(`data:image/jpeg;base64,${msg.data}`)
      } else if (msg.type === 'plate_detected') {
        setTodayCount(n => n + 1)
        setRecentPlates(prev => [
          {
            plate: msg.plate,
            car: msg.car,
            car_type: msg.car_type,
            car_color: msg.car_color,
            confidence: msg.confidence,
            frame: msg.frame ? `data:image/jpeg;base64,${msg.frame}` : currentFrame,
            time: new Date().toLocaleTimeString('ar-IQ'),
          },
          ...prev.slice(0, 9)
        ])
      } else if (msg.type === 'error') {
        setStatus('error')
        setErrorMsg(msg.message)
        setActive(false)
      }
    }

    ws.onclose = () => {
      if (active) setStatus('idle')
    }

    ws.onerror = () => {
      setStatus('error')
      setErrorMsg('تعذر الاتصال بالكاميرا')
      setActive(false)
    }
  }, [user?.tenant_id, active])

  const disconnect = () => {
    wsRef.current?.close()
    wsRef.current = null
    setStatus('idle')
    setActive(false)
    setCurrentFrame('')
  }

  const startService = (item) => {
    const params = new URLSearchParams({ plate: item.plate })
    const carType = item.car?.car_type || item.car_type
    const carColor = item.car?.car_color || item.car_color
    if (carType) params.set('car_type', carType)
    if (carColor) params.set('car_color', carColor)
    navigate(`/center/services/new?${params.toString()}`)
  }

  useEffect(() => {
    if (active) connect()
    else disconnect()
  }, [active])

  useEffect(() => () => wsRef.current?.close(), [])

  if (center && !cameraEnabled) {
    return (
      <Layout>
        <UpgradePrompt
          center={center}
          feature="استقبال السيارة وقراءة اللوحات"
          requiredPlan="enterprise"
          benefits={['باركود كاميرا الموبايل', 'التعرف على السيارة تلقائيًا', 'فتح خدمة مباشرة من رقم اللوحة']}
        />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-sm font-bold text-cyan-600">استقبال الخدمة</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">استقبال السيارة</h2>
          <p className="mt-1 text-sm text-slate-500">
            شغّل الاستقبال، ودع النظام يقرأ لوحة السيارة عند دخولها ثم ابدأ الخدمة من النتيجة.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <section className={`rounded-2xl border-2 p-5 text-center transition-all duration-300 ${
            active ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'
          }`}>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
              {currentFrame ? (
                <img src={currentFrame} alt="بث الاستقبال" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center">
                  <div className="text-center">
                    <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full transition-all ${
                      active ? 'bg-emerald-400 shadow-lg shadow-emerald-200' : 'bg-slate-800'
                    }`}>
                      {active
                        ? <Camera size={36} className="text-white" />
                        : <CameraOff size={36} className="text-slate-400" />
                      }
                    </div>
                    <p className="font-bold text-slate-300">
                      {active ? 'بانتظار وصول صورة من الكاميرا' : 'الاستقبال متوقف'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {status === 'active' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-4 flex items-center justify-center gap-2">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="font-bold text-emerald-700">
                  {currentFrame ? 'الاستقبال نشط — النظام يراقب اللوحات' : 'الاستقبال نشط — بانتظار بث الكاميرا'}
                </span>
              </motion.div>
            )}
            {status === 'connecting' && <p className="mt-4 font-bold text-amber-600">جاري الاتصال بالكاميرا...</p>}
            {status === 'error' && <p className="mt-4 font-bold text-rose-600">{errorMsg}</p>}
            {status === 'idle' && <p className="mt-4 text-slate-500">اضغط تشغيل الاستقبال عند بداية العمل.</p>}

            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActive(v => !v)}
              className={`mt-4 rounded-xl px-10 py-3.5 text-base font-black transition-all ${
                active
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-slate-950 text-white hover:bg-slate-800'
              }`}
            >
              {active ? 'إيقاف الاستقبال' : 'تشغيل الاستقبال'}
            </motion.button>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-black text-slate-950">سيارات وصلت الآن</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{recentPlates.length}</span>
            </div>

            {active && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-2xl font-black text-slate-950">{todayCount}</p>
                  <p className="mt-1 text-xs text-slate-500">اليوم</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                  <p className="text-2xl font-black text-emerald-700">{recentPlates.filter(p => p.car).length}</p>
                  <p className="mt-1 text-xs text-slate-500">زبائن معروفون</p>
                </div>
              </div>
            )}

            <AnimatePresence>
              {recentPlates.length > 0 ? (
                <div className="space-y-3">
                  {recentPlates.map((item, i) => (
                    <motion.div key={`${item.plate}-${item.time}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      {item.frame ? (
                        <img src={item.frame} alt={`لقطة ${item.plate}`} className="h-32 w-full bg-slate-950 object-cover" />
                      ) : (
                        <div className="flex h-24 items-center justify-center bg-slate-100">
                          <Car size={24} className="text-slate-400" />
                        </div>
                      )}
                      <div className="p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="font-mono text-xl font-black text-slate-950">{item.plate}</p>
                          <span className="text-xs font-bold text-slate-400">{item.time}</span>
                        </div>
                        {item.confidence ? (
                          <p className="mb-2 text-xs font-bold text-slate-500">ثقة القراءة {Math.round(item.confidence * 100)}%</p>
                        ) : null}
                        {item.car
                          ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">✓ {item.car.owner_name || 'زبون معروف'} · {item.car.car_type || 'نوع غير محدد'}</p>
                          : <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                              سيارة جديدة — أكمل بياناتها عند الإضافة
                            </p>
                        }
                        <button
                          onClick={() => startService(item)}
                          className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black transition ${
                            item.car ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-amber-500 text-white hover:bg-amber-600'
                          }`}
                        >
                          {item.car ? <PlayCircle size={16} /> : <UserPlus size={16} />}
                          {item.car ? 'بدء الخدمة' : 'إضافة سيارة وبدء خدمة'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                  <div>
                    <Car size={34} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-bold text-slate-500">لا توجد سيارات مقروءة بعد</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">عند قراءة لوحة ستظهر هنا مع زر الإضافة أو بدء الخدمة.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Info */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-bold text-slate-800 mb-2">كيف يعمل؟</p>
          <div className="space-y-1.5">
            <p>📷 السيارة تدخل من الباب وتظهر هنا فوراً</p>
            <p>🔍 النظام يبحث عن رقم اللوحة في سيارات المركز</p>
            <p>✅ إذا كانت معروفة يظهر اسم الزبون ونوع السيارة</p>
            <p>🧾 اضغط بدء الخدمة لتكمل الفاتورة والخدمات مباشرة</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
