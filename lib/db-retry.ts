export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      const msg = (error?.message ?? String(error)).toString()
      const isConnectionError =
        msg.includes("Can't reach database") ||
        msg.includes('connect ETIMEDOUT') ||
        msg.includes('Connection terminated') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ENOTFOUND') ||
        msg.includes('timed out') ||
        msg.includes('P1001') ||
        msg.includes('P1002')

      if (isConnectionError && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        delayMs = Math.floor(delayMs * 1.5)
        continue
      }

      throw error
    }
  }

  throw lastError
}
