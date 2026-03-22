/**
 * Formats a numeric value as full UGX currency.
 * @param value Value in Uganda shillings.
 * @returns Currency string such as UGX 1,000,000.
 */
export function formatUGX(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? '-' : ''
  const absolute = Math.abs(rounded)
  return `${sign}UGX ${absolute.toLocaleString('en-UG')}`
}

/**
 * Formats a numeric value as compact notation.
 * @param value Value in Uganda shillings.
 * @returns Compact string such as 1B, 300M, 50K, or 500.
 */
export function formatUGXShort(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? '-' : ''
  const absolute = Math.abs(rounded)

  if (absolute >= 1_000_000_000) {
    return `${sign}${Math.round(absolute / 1_000_000_000)}B`
  }
  if (absolute >= 1_000_000) {
    return `${sign}${Math.round(absolute / 1_000_000)}M`
  }
  if (absolute >= 1_000) {
    return `${sign}${Math.round(absolute / 1_000)}K`
  }

  return `${sign}${absolute}`
}

/**
 * Formats a numeric value into human-readable words.
 * @param value Value in Uganda shillings.
 * @returns Phrase such as 1 billion shillings.
 */
export function formatUGXWords(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? 'minus ' : ''
  const absolute = Math.abs(rounded)

  if (absolute >= 1_000_000_000) {
    return `${sign}${Math.round(absolute / 1_000_000_000)} billion shillings`
  }
  if (absolute >= 1_000_000) {
    return `${sign}${Math.round(absolute / 1_000_000)} million shillings`
  }
  if (absolute >= 1_000) {
    return `${sign}${Math.round(absolute / 1_000)} thousand shillings`
  }

  return `${sign}${absolute} shillings`
}
