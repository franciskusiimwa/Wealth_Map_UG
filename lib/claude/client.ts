import Anthropic from '@anthropic-ai/sdk'

/**
 * Returns a configured Anthropic client for server-side use.
 * @returns Anthropic SDK client instance.
 */
export function createClaudeClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}
