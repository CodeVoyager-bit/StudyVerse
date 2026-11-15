import { createClient } from '@supabase/supabase-js'

/** Service-role client that bypasses RLS. Server-only, for cron jobs. Returns null when the key isn't configured. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
