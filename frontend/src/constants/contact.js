export const SUPPORT_WHATSAPP_DISPLAY = '07806688044'
export const SUPPORT_WHATSAPP_URL = 'https://wa.me/9647806688044'

export const whatsappLink = (text) => `${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(text)}`

export const TRIAL_DAYS = 14

// Public OAuth client ID (not a secret); override per environment with VITE_GOOGLE_CLIENT_ID.
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || '963766535610-sghoo3g527t0aad7t1e56jmfivr1l7b4.apps.googleusercontent.com'
