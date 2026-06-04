import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Camera, CameraOff, Loader2, ShieldCheck } from 'lucide-react'

export default function MobileCamera() {
  const { token } = useParams()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const [centerName, setCenterName] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/mobile-camera/${encodeURIComponent(token)}/info`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setCenterName(data.center_name || 'المركز'))
      .catch(() => setError('رابط الكاميرا غير صالح أو غير مفعل'))
    return stopCamera
  }, [token])

  const sendFrame = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return
    const width = 960
    const ratio = video.videoHeight / Math.max(video.videoWidth, 1)
    canvas.width = width
    canvas.height = Math.max(540, Math.round(width * ratio))
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const image = canvas.toDataURL('image/jpeg', 0.72)
    try {
      await fetch(`/mobile-camera/${encodeURIComponent(token)}/frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      setStatus('live')
    } catch {
      setStatus('error')
      setError('تعذر إرسال الصورة إلى النظام')
    }
  }

  const startCamera = async () => {
    setError('')
    setStatus('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      await sendFrame()
      timerRef.current = window.setInterval(sendFrame, 1200)
      setStatus('live')
    } catch {
      setStatus('error')
      setError('لم يتم فتح الكاميرا. اسمح للتطبيق باستخدام الكاميرا من المتصفح.')
    }
  }

  function stopCamera() {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (status === 'live') setStatus('idle')
  }

  const isLive = status === 'live'
  const isStarting = status === 'starting'

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
        <div className="mb-5">
          <p className="text-sm font-bold text-cyan-300">كاميرا المركز</p>
          <h1 className="mt-1 text-2xl font-black">{centerName || 'ربط كاميرا الموبايل'}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            ثبّت الهاتف باتجاه مدخل السيارات واترك هذه الصفحة مفتوحة.
          </p>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
          <video ref={videoRef} muted playsInline className="h-full min-h-[420px] w-full object-cover" />
          {!isLive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 p-6 text-center">
              {isStarting ? <Loader2 className="mb-4 animate-spin text-cyan-300" size={44} /> : <CameraOff className="mb-4 text-slate-500" size={54} />}
              <p className="font-bold text-slate-200">
                {isStarting ? 'جاري فتح الكاميرا...' : 'الكاميرا غير مشغلة'}
              </p>
              {error && <p className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-200">{error}</p>}
            </div>
          )}
          {isLive && (
            <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-black text-emerald-950">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-950" />
              بث مباشر
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-5 space-y-3">
          <button
            onClick={isLive ? stopCamera : startCamera}
            disabled={isStarting || Boolean(error && !centerName)}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-black transition ${
              isLive ? 'bg-rose-500 text-white' : 'bg-cyan-300 text-slate-950'
            } disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400`}
          >
            {isLive ? <CameraOff size={20} /> : <Camera size={20} />}
            {isLive ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
          </button>
          <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
            <ShieldCheck className="mt-0.5 shrink-0 text-cyan-300" size={16} />
            <p>هذا الرابط خاص بمركزك، والفيديو يذهب مباشرة إلى لوحة المركز لقراءة اللوحات.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
