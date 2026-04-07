import { supabase } from "./supabase"

export async function calculatePointsForEvent(eventId: string) {
  if (!supabase) {
    throw new Error("Configuration Supabase manquante")
  }

  const { error } = await supabase.rpc("score_event", {
    event_id_input: eventId,
  })

  if (error) {
    if (error.message.includes("score_event")) {
      throw new Error(
        "La fonction SQL score_event n'est pas encore installee dans Supabase."
      )
    }

    throw new Error(`Erreur calcul event: ${error.message}`)
  }
}
