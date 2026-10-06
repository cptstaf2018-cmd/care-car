const TRIAL_TOTAL_DAYS = 14
const SUBSCRIPTION_TOTAL_DAYS = 30
const DAY_MS = 86400000

/** Days left and the full-tank length for a center, or null when there is nothing to show. */
export function tankFor(center, now = new Date()) {
  const daysUntil = (date) => Math.ceil((new Date(date) - now) / DAY_MS)
  if (center?.subscription_ends_at) {
    return { days: Math.max(0, daysUntil(center.subscription_ends_at)), total: SUBSCRIPTION_TOTAL_DAYS, kind: 'subscription' }
  }
  if (center?.trial_ends_at) {
    return { days: Math.max(0, daysUntil(center.trial_ends_at)), total: TRIAL_TOTAL_DAYS, kind: 'trial' }
  }
  return null
}
