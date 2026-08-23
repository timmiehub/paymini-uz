import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

export function requireSb() {
  if (!supabase) throw new Error('Supabase не настроен. Заполни webapp/.env')
  return supabase
}
