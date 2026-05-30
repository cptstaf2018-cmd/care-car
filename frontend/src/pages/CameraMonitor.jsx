import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, CheckCircle2, Car, Wifi, WifiOff } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuthStore } from '../store/auth'

const WS_BASE = window.location.protocol === 'https:'
  ? `wss://${window.location.host}/ws/camera`
  : `ws://${window.location.host}/ws/camera`

export default function CameraMonitor() {
  const user = useAuthStore(s => s.user)
  const [active, setActive] = useState(false)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [todayCount, setTodayCount] = useState(0)
  const [recentPlates, setRecentPlates] = useState([])
  const wsRef = useRef(null)

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
      } else if (msg.type === 'plate_detected') {
        setTodayCount(n => n + 1)
        setRecentPlates(prev => [
          { plate: msg.plate, car: msg.car, time: new Date().toLocaleTimeString('ar-IQ') },
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
  }

  useEffect(() => {
    if (active) connect()
    else disconnect()
  }, [active])

  useEffect(() => () => wsRef.current?.close(), [])

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="text-sm font-bold text-cyan-600">كاميرا IP</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">جمع بيانات السيارات</h2>
          <p className="mt-1 text-sm text-slate-500">
            الكاميرا تقرأ رقم اللوحة ونوع السيارة تلقائياً وتحفظها في النظام لإرسال التذكيرات
          </p>
        </div>

        {/* Main toggle card */}
        <div className={`rounded-2xl border-2 p-8 text-center transition-all duration-300 ${
          active ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'
        }`}>
          <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full transition-all ${
            active ? 'bg-emerald-400 shadow-lg shadow-emerald-200' : 'bg-slate-100'
          }`}>
            {active
              ? <Camera size={36} className="text-white" />
              : <CameraOff size={36} className="text-slate-400" />
            }
          </div>

          {status === 'active' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-4 flex items-center justify-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="font-bold text-emerald-700">الكاميرا نشطة — تجمع البيانات تلقائياً</span>
            </motion.div>
          )}
          {status === 'connecting' && (
            <p className="mb-4 font-bold text-amber-600">جاري الاتصال بالكاميرا...</p>
          )}
          {status === 'error' && (
            <p className="mb-4 font-bold text-rose-600">{errorMsg}</p>
          )}
          {status === 'idle' && (
            <p className="mb-4 text-slate-500">الكاميرا متوقفة — اضغط لبدء جمع البيانات</p>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setActive(v => !v)}
            className={`rounded-xl px-10 py-3.5 text-base font-black transition-all ${
              active
                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                : 'bg-slate-950 text-white hover:bg-slate-800'
            }`}
          >
            {active ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
          </motion.button>
        </div>

        {/* Stats */}
        {active && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-3xl font-black text-slate-950">{todayCount}</p>
              <p className="mt-1 text-xs text-slate-500">سيارة تم تسجيلها اليوم</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-3xl font-black text-emerald-700">
                {recentPlates.filter(p => p.car).length}
              </p>
              <p className="mt-1 text-xs text-slate-500">زبون معروف في النظام</p>
            </div>
          </motion.div>
        )}

        {/* Recent detections */}
        <AnimatePresence>
          {recentPlates.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
              <p className="mb-3 text-sm font-black text-slate-700">آخر السيارات المسجّلة</p>
              <div className="space-y-2">
                {recentPlates.map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                        <Car size={16} className="text-slate-600" />
                      </div>
                      <div>
                        <p className="font-mono font-black text-slate-950">{item.plate}</p>
                        {item.car
                          ? <p className="text-xs text-emerald-600 font-bold">✓ {item.car.owner_name} · {item.car.car_type || ''}</p>
                          : <p className="text-xs text-amber-600">سيارة جديدة — تم حفظها</p>
                        }
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">{item.time}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-bold text-slate-800 mb-2">كيف يعمل؟</p>
          <div className="space-y-1.5">
            <p>📷 كاميرا عند المدخل تصور كل سيارة تدخل</p>
            <p>🔍 تقرأ: رقم اللوحة + نوع السيارة + اللون</p>
            <p>💾 تحفظ البيانات تلقائياً في النظام</p>
            <p>📲 النظام يُرسل تذكير واتساب عند موعد التبديل</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
