import { createClaudeClient } from '@/lib/claude/client'
import type { BusinessCanvas } from '@/types'

export interface CanvasInput {
  name?: string
  background?: string
  capitalRange: string
  sector: string
  idea: string
  concernKey: string
  revenueRange: string
  extra?: string
}

const CANVAS_SYSTEM_PROMPT =
  'You are a business consultant specialising in the Ugandan and East African market. You have deep knowledge of the Uganda Revenue Authority (URA) registration process, Uganda Registration Services Bureau (URSB) requirements, local market dynamics, consumer behaviour in Kampala and secondary cities, common challenges for SMEs in Uganda, and the competitive landscape across key sectors. Your analysis is grounded, realistic, and Uganda-specific — not generic African market advice.'

const JSON_RETRY_INSTRUCTION =
  'Your previous response was not valid JSON. Return ONLY the JSON object, starting with { and ending with }. No other text.'

export class CanvasParseError extends Error {
  constructor(message = 'Canvas parse failed') {
    super(message)
    this.name = 'CanvasParseError'
  }
}

/**
 * Builds the user prompt for generating a Uganda-specific business canvas.
 * @param data Intake payload submitted by the user.
 * @returns Prompt string for Claude's user message.
 */
export function buildCanvasPrompt(data: CanvasInput): string {
  return [
    'Generate a Uganda-specific business canvas from this intake data:',
    '',
    'Intake Data:',
    `- Name: ${data.name?.trim() || 'Not provided'}`,
    `- Background: ${data.background?.trim() || 'Not provided'}`,
    `- Capital Range: ${data.capitalRange}`,
    `- Sector: ${data.sector}`,
    `- Business Idea: ${data.idea}`,
    `- Main Concern Key: ${data.concernKey}`,
    `- Revenue Target Range: ${data.revenueRange}`,
    `- Extra Notes: ${data.extra?.trim() || 'None'}`,
    '',
    'Return ONLY a valid JSON object. No markdown fences, no preamble, no explanation. Start your response with { and end with }.',
    '',
    'Use exactly this JSON schema:',
    '{',
    '  "value_proposition": "string — 2 sentences max",',
    '  "target_customers": "string — 1-2 sentences, include specific Uganda demographics or geography",',
    '  "revenue_streams": ["string", "string", "string"],',
    '  "key_activities": ["string", "string", "string"],',
    '  "key_resources": ["string", "string"],',
    '  "cost_structure": ["string", "string", "string"],',
    '  "ugandan_context": "string — 2-3 sentences covering: market size estimate, main local competitors, relevant regulations (URA, URSB, sector-specific), infrastructure considerations",',
    '  "quick_wins": ["string", "string"],',
    '  "key_risks": ["string", "string"],',
    '  "first_30_days": ["string", "string", "string"]',
    '}'
  ].join('\n')
}

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  }
  return trimmed
}

function isBusinessCanvas(value: unknown): value is BusinessCanvas {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  const isStringArray = (item: unknown) => Array.isArray(item) && item.every((entry) => typeof entry === 'string')

  return (
    typeof candidate.value_proposition === 'string' &&
    typeof candidate.target_customers === 'string' &&
    isStringArray(candidate.revenue_streams) &&
    isStringArray(candidate.key_activities) &&
    isStringArray(candidate.key_resources) &&
    isStringArray(candidate.cost_structure) &&
    typeof candidate.ugandan_context === 'string' &&
    isStringArray(candidate.quick_wins) &&
    isStringArray(candidate.key_risks) &&
    isStringArray(candidate.first_30_days)
  )
}

async function requestCanvasText(prompt: string): Promise<string> {
  const client = createClaudeClient()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    system: CANVAS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }]
  })

  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
}

function parseCanvasJson(rawText: string): BusinessCanvas {
  const cleaned = stripMarkdownFences(rawText)
  let parsed: unknown

  try {
    parsed = JSON.parse(cleaned)
  } catch (_error: unknown) {
    throw new CanvasParseError('Claude output is not valid JSON')
  }

  if (!isBusinessCanvas(parsed)) {
    throw new CanvasParseError('Parsed canvas is missing required fields')
  }

  return parsed
}

/**
 * Generates a Uganda-specific business model canvas using Claude.
 * @param input Form input from the 4-step intake.
 * @returns Parsed business canvas JSON object.
 */
export async function generateBusinessCanvas(input: CanvasInput): Promise<BusinessCanvas> {
  const prompt = buildCanvasPrompt(input)

  try {
    const firstResponseText = await requestCanvasText(prompt)
    return parseCanvasJson(firstResponseText)
  } catch (firstError: unknown) {
    if (!(firstError instanceof CanvasParseError)) {
      throw firstError
    }

    const secondResponseText = await requestCanvasText(`${prompt}\n\n${JSON_RETRY_INSTRUCTION}`)

    try {
      return parseCanvasJson(secondResponseText)
    } catch (secondError: unknown) {
      if (secondError instanceof CanvasParseError) {
        throw secondError
      }
      throw new Error('Unable to generate canvas at the moment.')
    }
  }
}
