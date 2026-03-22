import { scrapeMarkdown } from '@/lib/firecrawl/client'
import { getPreviousMacroValue, deriveTrend } from '@/lib/data/macro'
import type { MacroIndicator } from '@/types'

const UBOS_CPI_URL = 'https://www.ubos.org/statistics/economic-statistics/consumer-price-indices/'

function extractHeadlineCpi(markdown: string): number {
  const directCpi = markdown.match(/headline\s+cpi[^\d-]*(-?\d+(?:\.\d+)?)/i)
  if (directCpi) {
    const value = Number.parseFloat(directCpi[1])
    if (Number.isFinite(value)) {
      return value
    }
  }

  const yoy = markdown.match(/year[-\s]*on[-\s]*year[^\d-]*(-?\d+(?:\.\d+)?)\s*%/i)
  if (yoy) {
    const value = Number.parseFloat(yoy[1])
    if (Number.isFinite(value)) {
      return value
    }
  }

  const percentageMatches = Array.from(markdown.matchAll(/(-?\d+(?:\.\d+)?)\s*%/g))
    .map((entry) => Number.parseFloat(entry[1]))
    .filter((value) => Number.isFinite(value) && value > -20 && value < 50)

  if (percentageMatches.length > 0) {
    return percentageMatches[0]
  }

  throw new Error('Unable to parse CPI values from UBOS content')
}

function extractYoyChange(markdown: string): number {
  const yoy = markdown.match(/year[-\s]*on[-\s]*year[^\d-]*(-?\d+(?:\.\d+)?)\s*%/i)
  if (yoy) {
    const value = Number.parseFloat(yoy[1])
    if (Number.isFinite(value)) {
      return value
    }
  }

  const inflationMentions = Array.from(
    markdown.matchAll(/(?:inflation|annual\s+change|yoy|year[-\s]*on[-\s]*year)[^\d-]{0,40}(-?\d+(?:\.\d+)?)\s*%/gi)
  )
    .map((match) => Number.parseFloat(match[1]))
    .filter((value) => Number.isFinite(value) && value > -20 && value < 50)

  if (inflationMentions.length > 0) {
    return inflationMentions[0]
  }

  throw new Error('Unable to parse YoY CPI change from UBOS content')
}

/**
 * Scrapes UBOS CPI page and returns latest CPI indicator.
 * @returns CPI macro indicator.
 */
export async function fetchUgandaCPI(): Promise<MacroIndicator> {
  try {
    const markdown = await scrapeMarkdown(UBOS_CPI_URL)
    if (!markdown.trim()) {
      throw new Error('Empty UBOS CPI response')
    }

    const value = extractHeadlineCpi(markdown)
    const yoyChange = extractYoyChange(markdown)
    const previous = await getPreviousMacroValue('ug-cpi')

    return {
      key: 'ug-cpi',
      label: `Uganda Headline CPI (YoY ${yoyChange.toFixed(1)}%)`,
      value,
      period: new Date().toISOString().slice(0, 7),
      trend: deriveTrend(previous, value),
      last_updated: new Date().toISOString(),
      stale_after_days: 30
    }
  } catch (error: unknown) {
    console.error('CPI scrape failed', error)
    throw new Error('CPI_FETCH_FAILED')
  }
}
