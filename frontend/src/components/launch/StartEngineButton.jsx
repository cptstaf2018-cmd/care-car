import { useEffect, useRef, useState } from 'react'
import { Power } from 'lucide-react'
import { GOOGLE_CLIENT_ID } from '../../constants/contact'
import { loadGoogleIdentity } from '../auth/googleIdentity'
import './launch.css'

const BUTTON_SIZE = 112
const GOOGLE_ICON_SIZE = 40
const OVERLAY_SCALE = BUTTON_SIZE / GOOGLE_ICON_SIZE

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/**
 * Push-to-start button. It looks like an engine start button, but the real (transparent) Google
 * sign-in icon button sits on top of it, so pressing it opens Google sign-in and also fires `onPress`.
 */
export default function StartEngineButton({ phase, mode = 'google', formId, onPress, onCredential, disabled = false, caption = 'ببصمة حساب Google' }) {
  const holder = useRef(null)
  const callback = useRef(onCredential)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    callback.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (mode !== 'google') return undefined
    let cancelled = false
    loadGoogleIdentity()
      .then((google) => {
        if (cancelled || !holder.current) return
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => callback.current(response.credential),
          ux_mode: 'popup',
        })
        google.accounts.id.renderButton(holder.current, { type: 'icon', theme: 'outline', size: 'large', shape: 'circle' })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [mode])

  const running = phase !== 'parked'
  const lit = phase === 'igniting' || phase === 'driving'

  if (failed && mode === 'google') {
    return (
      <p role="alert" className="rounded-2xl bg-white px-4 py-3 text-center text-sm text-alert">
        ما انفتح تسجيل Google. تأكد من الإنترنت وحدّث الصفحة.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="group"
        aria-label={mode === 'google' ? 'شغّل الحساب: سجّل بحساب Google' : 'شغّل المحرك وادخل'}
        style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
        className={`relative -mt-14 rounded-full p-[7px] shadow-[0_16px_30px_-10px_rgba(0,0,0,0.75)] focus-within:ring-4 focus-within:ring-oil/60 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        onClickCapture={onPress}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{ background: 'conic-gradient(from 210deg, #9aa7a6, #3d4f50, #d3dddc, #2a3b3c, #9aa7a6)' }}
        />
        <span
          aria-hidden="true"
          className={`absolute inset-[7px] rounded-full bg-[radial-gradient(circle_at_50%_30%,#134549,#061819)] transition-shadow duration-300 ${
            lit ? 'shadow-[0_0_0_3px_#E5533D,0_0_28px_6px_rgba(229,83,61,0.65)]' : running ? 'shadow-[0_0_0_3px_#6E8C8A]' : 'start-ring-idle shadow-[0_0_0_3px_#F0A33A]'
          }`}
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="flex flex-col items-center leading-tight">
            <Power size={22} className={`transition-colors ${lit ? 'text-alert' : 'text-oil'}`} />
            <span dir="ltr" className="mt-1 text-[11px] font-bold tracking-[0.18em] text-mint">{lit ? 'ENGINE ON' : 'START'}</span>
            <span className="text-xs font-bold text-gauge-light">{lit ? 'شغّال' : 'ابدأ'}</span>
          </span>
        </span>
        {mode === 'google' ? (
          <div
            ref={holder}
            style={{ width: GOOGLE_ICON_SIZE, height: GOOGLE_ICON_SIZE, transform: `translate(-50%, -50%) scale(${OVERLAY_SCALE})` }}
            className="absolute start-auto left-1/2 top-1/2 overflow-hidden rounded-full opacity-[0.01]"
          />
        ) : (
          <button type="submit" form={formId} disabled={disabled} aria-label="ادخل" className="absolute inset-0 rounded-full focus-visible:outline-none" />
        )}
      </div>
      <p className="flex items-center gap-1.5 text-sm text-mint-ink">
        {mode === 'google' && <GoogleMark />}
        {caption}
      </p>
    </div>
  )
}
