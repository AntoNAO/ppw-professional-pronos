import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Créer le client Supabase en toute sécurité
let supabaseClient: any = null

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = supabaseClient