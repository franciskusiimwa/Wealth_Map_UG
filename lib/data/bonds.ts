import { scrapeMarkdown } from '@/lib/firecrawl/client'
import { createAdminClient } from '@/lib/supabase/admin'
import type { MacroIndicator, Trend } from '@/types'

const BOU_BONDS_URL =
  'https://www.bou.or.ug/bou/rates_statistics/market_statistics/Treasury_Bills_Bonds.html'

function detectTrend(current: number, previous?: number): Trend {
  if (typeof previous !== 'number' || Number.isNaN(previous)) {
    return 'stable'
  }

  const delta = current - previous
  if (Math.abs(delta) < 0.01) {
    return 'stable'
  }

  return delta > 0 ? 'rising' : 'falling'
}

function parsePercentFromLine(line: string): number | null {
  const match = line.match(/(-?\d+(?:\.\d+)?)\s*%/)
  if (!match) {
    return null
  }

  const numeric = Number.parseFloat(match[1])
  return Number.isFinite(numeric) ? numeric : null
}

function parseDateFromText(input: string): number | null {
  const normalized = input.replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, '$1')
  const directDate = normalized.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/)?.[0]
  const monthDate = normalized.match(
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/i
  )?.[0]
  const yearMonth = normalized.match(/\b\d{4}-\d{2}\b/)?.[0]

  const candidate = directDate || monthDate || (yearMonth ? `${yearMonth}-01` : null)
  if (!candidate) {
    return null
  }

  const timestamp = Date.parse(candidate)
  return Number.isNaN(timestamp) ? null : timestamp
}

interface YieldPoint {
  tenor: 'tbill_91d' | 'bond_2y'
  value: number
  publishedAt: number | null
  lineIndex: number
}

function extractYieldPoints(markdown: string): YieldPoint[] {
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const points: YieldPoint[] = []
  let activeDate: number | null = null

  lines.forEach((line, index) => {
    const dateInLine = parseDateFromText(line)
    if (dateInLine !== null) {
      activeDate = dateInLine
    }

    const value = parsePercentFromLine(line)
    if (value === null) {
      return
    }

    if (/91\s*-?\s*day/i.test(line) && /treasury\s*bill|t[-\s]?bill/i.test(line)) {
      points.push({ tenor: 'tbill_91d', value, publishedAt: activeDate, lineIndex: index })
      return
    }

    if (/2\s*-?\s*year/i.test(line) && /bond/i.test(line)) {
      points.push({ tenor: 'bond_2y', value, publishedAt: activeDate, lineIndex: index })
    }
  })

  return points
}

function extractLatestYield(markdown: string): number {
  const points = extractYieldPoints(markdown)
  const ninetyOnePoints = points.filter((point) => point.tenor === 'tbill_91d')
  const twoYearPoints = points.filter((point) => point.tenor === 'bond_2y')

  // Requirement: extract both tenors; fail fast if either is missing.
  if (ninetyOnePoints.length === 0 || twoYearPoints.length === 0) {
    throw new Error('Missing required tenor yields (91-day and 2-year)')
  }

  const datedPoints = [...ninetyOnePoints, ...twoYearPoints].filter((point) => point.publishedAt !== null)

  if (datedPoints.length > 0) {
    const latestByDate = datedPoints.sort((a, b) => (b.publishedAt as number) - (a.publishedAt as number))[0]
    return latestByDate.value
  }

  // If dates are absent in scraped text, use the last encountered tenor value as best recent proxy.
  const latestByPosition = [...ninetyOnePoints, ...twoYearPoints].sort((a, b) => b.lineIndex - a.lineIndex)[0]
  return latestByPosition.value
}

/**
 * Scrapes and parses BoU rates page to produce current bond indicator.
 * @returns Macro indicator keyed to BoU bond yield.
 */
export async function fetchBoUBondData(): Promise<MacroIndicator> {
  try {
    const markdown = await scrapeMarkdown(BOU_BONDS_URL)
    if (!markdown.trim()) {
      throw new Error('Empty BoU response')
    }

    const value = extractLatestYield(markdown)
    const period = new Date().toISOString().slice(0, 7)

    const supabase = createAdminClient()
    const { data: previous } = await supabase
      .from('wm_macro_indicators')
      .select('value')
      .eq('key', 'bou-bond-yield')
      .maybeSingle()

    return {
      key: 'bou-bond-yield',
      label: 'BoU Treasury Yield Snapshot',
      value,
      period,
      trend: detectTrend(value, previous?.value as number | undefined),
      last_updated: new Date().toISOString(),
      stale_after_days: 30
    }
  } catch (_error: unknown) {
    throw new Error('BON_FETCH_FAILED')
  }
}
