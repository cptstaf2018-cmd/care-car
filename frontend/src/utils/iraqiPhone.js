const EASTERN_DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' }
const IRAQI_MOBILE = /^(?:00964|964|0)?(7\d{9})$/

export const toWesternDigits = (value) => value.replace(/[٠-٩]/g, (d) => EASTERN_DIGITS[d])

/** "+964 780 668 8044", "9647806688044", "٠٧٨٠…" → "07806688044"; null when it is not an Iraqi mobile number. */
export function normalizeIraqiMobile(raw) {
  const digits = toWesternDigits(raw || '').replace(/\D/g, '')
  const match = IRAQI_MOBILE.exec(digits)
  return match ? `0${match[1]}` : null
}
