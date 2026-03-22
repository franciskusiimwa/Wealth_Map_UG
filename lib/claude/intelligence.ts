import { createClaudeClient } from '@/lib/claude/client'
import { scrapeMarkdown } from '@/lib/firecrawl/client'
import type { CompanyIntelligence, InvestmentProduct } from '@/types'

const INTELLIGENCE_SYSTEM_PROMPT =
  'You are a senior investment analyst specialising in East African financial markets, particularly Uganda. You evaluate investment opportunities not just on financial metrics but on the quality of leadership, organisational culture, competitive positioning, and long-term business model sustainability. You are rigorous, evidence-based, and honest about uncertainty. You never fabricate facts. Every claim you make must be supported by evidence from the provided source material. If you cannot find evidence for a claim, you say so explicitly rather than guessing.'

const MAX_SOURCE_CONTEXT_CHARS = 8000

function extractCompanyName(productName: string): string {
  const cleaned = productName.replace(/\([^)]*\)/g, '').trim()
  const parts = cleaned.split(/\s+-\s+|\s+\|\s+/)
  return (parts[0] || cleaned).trim()
}

function toCompanyDomainName(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join('')
}

/**
 * Creates a research plan of official URLs and web-search prompts for intelligence analysis.
 * @param product Selected product under review.
 * @returns Ordered list of URLs and search-query strings.
 */
export function buildIntelligenceResearchPlan(product: InvestmentProduct): string[] {
  const companyName = extractCompanyName(product.name)
  const year = new Date().getFullYear()
  const domainSeed = toCompanyDomainName(companyName)
  const officialWebsite = product.source_url?.trim() || `https://www.${domainSeed}.co.ug`

  const plan = [
    officialWebsite,
    `site:monitor.co.ug ${companyName}`,
    `site:newvision.co.ug ${companyName}`,
    `site:capitalfm.co.ug ${companyName}`,
    `${companyName} Uganda annual report ${year}`,
    `${companyName} Uganda CEO leadership`,
    `CMA Uganda ${companyName}`
  ]

  if (product.category === 'insurance') {
    plan.push(`IRA Uganda ${companyName}`)
  }

  return plan
}

function isUrlTarget(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

/**
 * Scrapes URL targets in the plan and returns capped joined context for Claude.
 * @param plan Mixed list of URLs and search strings.
 * @returns Single source-material string capped to 8000 characters.
 */
export async function scrapeIntelligenceSources(plan: string[]): Promise<string> {
  const urls = Array.from(new Set(plan.filter((entry) => typeof entry === 'string').map((entry) => entry.trim()))).filter(
    isUrlTarget
  )

  if (urls.length === 0) {
    return ''
  }

  const pages = await Promise.all(
    urls.map(async (url) => {
      try {
        const content = await scrapeMarkdown(url)
        return content ? `[SOURCE URL] ${url}\n${content.trim()}` : ''
      } catch (_error: unknown) {
        return ''
      }
    })
  )

  return pages.join('\n\n').slice(0, MAX_SOURCE_CONTEXT_CHARS)
}

/**
 * Builds Claude system and user messages for intelligence generation.
 * @param product Product details being analyzed.
 * @param scrapedContent Aggregated source material for evidence grounding.
 * @returns Claude message payload shape.
 */
export function buildIntelligencePrompt(product: InvestmentProduct, scrapedContent: string): {
  system: string
  messages: Array<{ role: 'user'; content: string }>
} {
  const companyName = extractCompanyName(product.name)

  const userPrompt = [
    'Analyse this company as an investment target. For every claim in your analysis, cite the specific source (publication name and approximate date if available). If a claim cannot be supported by the source material, label it [INFERENCE] and explain your reasoning.',
    '',
    'PRODUCT DETAILS:',
    `- Product ID: ${product.id}`,
    `- Product Name: ${product.name}`,
    `- Company Name: ${companyName}`,
    `- Category: ${product.category}`,
    `- Return Display: ${product.return_display}`,
    `- Minimum Investment (UGX): ${product.min_investment_ugx}`,
    `- Risk Level: ${product.risk_level}`,
    `- Description: ${product.description}`,
    '',
    'SOURCE MATERIAL:',
    scrapedContent || 'No scraped source material was available. Use web search carefully and cite all findings.',
    '',
    'Return ONLY valid JSON using exactly this schema:',
    '{',
    '  "company_name": "string",',
    '  "verdict": "strong | moderate | caution | avoid",',
    '  "verdict_label": "string — e.g. \"Strong conviction\"",',
    '  "score_financial": number 0-10,',
    '  "score_leadership": number 0-10,',
    '  "score_culture": number 0-10,',
    '  "score_market": number 0-10,',
    '  "overall_confidence": number 0-1,',
    '  "claude_read": "string — 2-3 paragraphs synthesis, written in plain English accessible to a non-expert Ugandan investor",',
    '  "signals": [',
    '    {',
    '      "type": "positive | negative | neutral",',
    '      "text": "string — the finding, 1-2 sentences",',
    '      "source": "string — where this came from",',
    '      "confidence": "high | medium | low"',
    '    }',
    '  ],',
    '  "sources": ["string — list of source names used"]',
    '}'
  ].join('\n')

  return {
    system: INTELLIGENCE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  }
}

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  }
  return trimmed
}

function isCompanyIntelligencePayload(
  value: unknown
): value is Omit<CompanyIntelligence, 'id' | 'product_id' | 'generated_at' | 'next_refresh'> {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  const isNumber = (input: unknown) => typeof input === 'number' && Number.isFinite(input)

  const signalsValid =
    Array.isArray(candidate.signals) &&
    candidate.signals.every((entry) => {
      if (!entry || typeof entry !== 'object') {
        return false
      }
      const signal = entry as Record<string, unknown>
      return (
        (signal.type === 'positive' || signal.type === 'negative' || signal.type === 'neutral') &&
        typeof signal.text === 'string' &&
        typeof signal.source === 'string' &&
        (signal.confidence === 'high' || signal.confidence === 'medium' || signal.confidence === 'low')
      )
    })

  return (
    typeof candidate.company_name === 'string' &&
    (candidate.verdict === 'strong' || candidate.verdict === 'moderate' || candidate.verdict === 'caution' || candidate.verdict === 'avoid') &&
    typeof candidate.verdict_label === 'string' &&
    isNumber(candidate.score_financial) &&
    isNumber(candidate.score_leadership) &&
    isNumber(candidate.score_culture) &&
    isNumber(candidate.score_market) &&
    isNumber(candidate.overall_confidence) &&
    typeof candidate.claude_read === 'string' &&
    signalsValid &&
    Array.isArray(candidate.sources) &&
    candidate.sources.every((source) => typeof source === 'string')
  )
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(10, value))
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/**
 * Runs the intelligence generation pipeline and returns a typed result payload.
 * @param product Product under analysis.
 * @returns Generated intelligence payload ready for persistence.
 */
export async function generateCompanyIntelligence(
  product: InvestmentProduct
): Promise<Omit<CompanyIntelligence, 'id' | 'generated_at' | 'next_refresh'>> {
  const plan = buildIntelligenceResearchPlan(product)
  const scrapedContent = await scrapeIntelligenceSources(plan)
  const prompt = buildIntelligencePrompt(product, scrapedContent)
  const client = createClaudeClient()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    system: prompt.system,
    messages: prompt.messages
  })

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')

  const cleaned = stripMarkdownFences(text)
  const parsed: unknown = JSON.parse(cleaned)

  if (!isCompanyIntelligencePayload(parsed)) {
    throw new Error('Invalid intelligence payload shape')
  }

  return {
    product_id: product.id,
    company_name: parsed.company_name,
    verdict: parsed.verdict,
    verdict_label: parsed.verdict_label,
    score_financial: clampScore(parsed.score_financial),
    score_leadership: clampScore(parsed.score_leadership),
    score_culture: clampScore(parsed.score_culture),
    score_market: clampScore(parsed.score_market),
    overall_confidence: clampConfidence(parsed.overall_confidence),
    claude_read: parsed.claude_read,
    signals: parsed.signals,
    sources: parsed.sources
  }
}
