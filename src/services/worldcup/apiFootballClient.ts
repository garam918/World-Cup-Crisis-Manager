import type { ApiFootballEnvelope } from './apiFootballTypes'

const defaultBaseUrl = 'https://v3.football.api-sports.io'

export async function requestApiFootball<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const apiKey = process.env.API_FOOTBALL_KEY
  if (!apiKey) {
    throw new Error('API_FOOTBALL_KEY is missing. Copy .env.example to .env and set the server-side API-Football key.')
  }

  const baseUrl = (process.env.API_FOOTBALL_BASE_URL || defaultBaseUrl).replace(/\/$/, '')
  const url = new URL(`${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  })

  const response = await fetch(url, { headers: { 'x-apisports-key': apiKey } })
  const payload = (await response.json()) as ApiFootballEnvelope<T>
  const hasErrors = Array.isArray(payload.errors)
    ? payload.errors.length > 0
    : Boolean(payload.errors && Object.keys(payload.errors as object).length > 0)

  if (!response.ok || hasErrors) {
    throw new Error(`API-Football request failed (${response.status}) ${url.pathname}: ${JSON.stringify(payload.errors ?? payload.message ?? 'unknown error')}`)
  }

  return (payload.response ?? ([] as T)) as T
}
