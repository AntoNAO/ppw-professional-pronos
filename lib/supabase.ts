import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (typeof window !== "undefined") {
  console.log(
    "Supabase URL:",
    supabaseUrl ? "present" : "missing"
  )
  console.log(
    "Supabase key:",
    supabaseAnonKey ? "present" : "missing"
  )
}

let supabaseClient: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.error("Supabase variables missing.")
}

export const supabase = supabaseClient
