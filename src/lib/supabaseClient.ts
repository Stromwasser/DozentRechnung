import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_KEY!

/** Call when JWT expired — clears session and redirects to login */
export function handleExpiredSession(): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key?.startsWith('sb-')) localStorage.removeItem(key)
  }
  window.location.replace('/auth')
}

function isJwtExpiredError(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const msg = String((data as { message?: string; error?: string }).message ?? (data as { message?: string; error?: string }).error ?? '').toLowerCase()
  return msg.includes('invalidjwt') || msg.includes('exp') || msg.includes('jwt')
}

const customFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input, init)
  if (res.status === 400 || res.status === 401) {
    try {
      const text = await res.clone().text()
      const lower = text.toLowerCase()
      if (lower.includes('invalidjwt') || lower.includes('"exp"') || lower.includes('jwt expired')) {
        handleExpiredSession()
      } else {
        try {
          const data = JSON.parse(text)
          if (isJwtExpiredError(data)) handleExpiredSession()
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }
  return res
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: customFetch },
})
