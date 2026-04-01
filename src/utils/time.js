/**
 * Returns a human-readable string like "2d 5h", "6h 30m", or "45m" for
 * the time remaining until `deadline`. Returns null if the deadline has
 * already passed or if deadline is falsy.
 */
export function formatTimeRemaining(deadline) {
  if (!deadline) return null
  const ms = new Date(deadline) - Date.now()
  if (ms <= 0) return null
  const totalMins = Math.floor(ms / 60000)
  const days = Math.floor(totalMins / 1440)
  const hours = Math.floor((totalMins % 1440) / 60)
  const mins = totalMins % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}
