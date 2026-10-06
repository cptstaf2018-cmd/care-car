/** Round up to 1, 2, 2.5 or 5 × 10ⁿ so the dial reads in clean steps. */
export function niceCeil(n) {
  const exp = 10 ** Math.floor(Math.log10(n))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * exp >= n)
  return step * exp
}
