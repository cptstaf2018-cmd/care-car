const GSI_SRC = 'https://accounts.google.com/gsi/client'
let gsiPromise = null

/** Load Google Identity Services once and resolve with `window.google`. */
export function loadGoogleIdentity() {
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
