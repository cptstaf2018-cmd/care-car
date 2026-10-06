import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID } from '../../constants/contact'
import { loadGoogleIdentity } from './googleIdentity'

const MAX_BUTTON_WIDTH = 400
const GOOGLE_BUTTON_HEIGHT = 40
const VISUAL_HEIGHT = 44

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/**
 * Secondary "sign in with Google" button for existing accounts. Same trick as the START button:
 * our Arabic face underneath, Google's real transparent button on top to take the click.
 */
export default function GoogleLoginPill({ onPress, onCredential, label = 'ادخل بحساب Google', disabled = false }) {
  const holder = useRef(null)
  const callback = useRef(onCredential)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    callback.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let cancelled = false
    loadGoogleIdentity()
      .then((google) => {
        if (cancelled || !holder.current) return
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => callback.current(response.credential),
          ux_mode: 'popup',
        })
        google.accounts.id.renderButton(holder.current, {
          theme: 'outline',
          size: 'large',
          width: Math.min(holder.current.offsetWidth || 320, MAX_BUTTON_WIDTH),
        })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (failed) return null

  return (
    <div
      aria-busy={disabled}
      onClickCapture={onPress}
      style={{ height: VISUAL_HEIGHT }}
      className={`group relative mx-auto w-full max-w-[400px] overflow-hidden rounded-full focus-within:ring-4 focus-within:ring-oil/50 ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 rounded-full border border-mint-dim bg-transparent text-sm font-bold text-petrol-deep transition-colors group-hover:border-gauge group-hover:bg-white"
      >
        <GoogleMark />
        {label}
      </span>
      <div
        ref={holder}
        style={{ height: GOOGLE_BUTTON_HEIGHT, transform: `scaleY(${VISUAL_HEIGHT / GOOGLE_BUTTON_HEIGHT})`, transformOrigin: 'top' }}
        className="absolute inset-x-0 top-0 flex justify-center opacity-[0.01]"
      />
    </div>
  )
}
