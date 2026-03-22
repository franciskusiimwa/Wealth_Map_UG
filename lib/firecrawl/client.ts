import FirecrawlApp from '@mendable/firecrawl-js'

/**
 * Returns a configured Firecrawl client.
 * @returns Firecrawl SDK instance.
 */
export function createFirecrawlClient(): FirecrawlApp {
  return new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY ?? '' })
}

/**
 * Scrapes a URL and returns markdown output when available.
 * @param url Source URL to scrape.
 * @returns Markdown content from the page.
 */
export async function scrapeMarkdown(url: string): Promise<string> {
  const app = createFirecrawlClient()
  const result = await app.scrapeUrl(url, { formats: ['markdown'] })
  if (!result.success) {
    return ''
  }
  return typeof result.markdown === 'string' ? result.markdown : ''
}
