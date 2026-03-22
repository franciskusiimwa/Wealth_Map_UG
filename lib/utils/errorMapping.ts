export interface MappedError {
  code: string
  status: number
  message: string
}

/**
 * Maps thrown refresh errors to stable API codes and HTTP statuses.
 * @param error Unknown thrown value from route execution.
 * @returns Normalized API error response metadata.
 */
export function mapRefreshError(error: unknown): MappedError {
  const fallback: MappedError = {
    code: 'REFRESH_FAILED',
    status: 500,
    message: 'Manual refresh failed.'
  }

  if (!(error instanceof Error)) {
    return fallback
  }

  if (error.message === 'CPI_FETCH_FAILED') {
    return {
      code: 'CPI_FETCH_FAILED',
      status: 503,
      message: 'Could not fetch CPI data.'
    }
  }

  if (error.message === 'BON_FETCH_FAILED') {
    return {
      code: 'BONDS_FETCH_FAILED',
      status: 503,
      message: 'Could not fetch bond data.'
    }
  }

  if (error.message === 'FOREX_FETCH_FAILED') {
    return {
      code: 'FOREX_FETCH_FAILED',
      status: 503,
      message: 'Could not fetch forex data.'
    }
  }

  return fallback
}
