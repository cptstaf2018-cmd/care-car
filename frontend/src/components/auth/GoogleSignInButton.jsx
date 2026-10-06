import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID } from '../../constants/contact'

const GSI_SRC = 'https://accounts.google.com/gsi/client'
const MAX_BUTTON_WIDTH = 400
let gsiPromise = null

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google)
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = GSI_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve(window.google)
      script.onerror = () => {
        gsiPromise = null
        reject(new Error('Google Identity Services failed to load'))
      }
      document.head.appendChild(script)
    })
  }
  return gsiPromise
}

/** Official Google button; calls onCredential(idToken) after the user picks an account. */
export default function GoogleSignInButton({ onCredential, text = 'continue_with', disabled = false }) {
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
          shape: 'pill',
          text,
          locale: 'ar',
          width: Math.min(holder.current.offsetWidth || 320, MAX_BUTTON_WIDTH),
        })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [text])

  if (failed) {
    return (
      <p role="alert" className="rounded-2xl bg-white px-4 py-3 text-sm text-alert">
        ما انفتح زر Google. تأكد من الإنترنت وحدّث الصفحة.
      </p>
    )
  }

  return (
    <div
      ref={holder}
      aria-busy={disabled}
      className={`flex min-h-[44px] w-full justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    />
  )
}
