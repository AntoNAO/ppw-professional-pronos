import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug en développement
if (typeof window !== "undefined") {
  console.log("🔍 Supabase URL:", supabaseUrl ? "✅ Présent" : "❌ Manquant")
  console.log("🔍 Supabase Key:", supabaseAnonKey ? "✅ Présent" : "❌ Manquant")
}

// Créer le client Supabase
let supabaseClient: any = null

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.error("❌ Supabase variables missing!")
}

export const supabase = supabaseClient