import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.warn('[db] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — DB calls will fail')
}

export const db = url && key
  ? createClient(url, key, { auth: { persistSession: false } })
  : null

export function requireDb() {
  if (!db) throw new Error('Supabase not configured')
  return db
}
