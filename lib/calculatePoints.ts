import { supabase } from "./supabase"

export async function calculatePointsForMatch(matchId: string) {
  // 1️⃣ Récupérer le match + event_id
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, winner, event_id")
    .eq("id", matchId)
    .single()

  if (matchError || !match?.winner) {
    throw new Error("Match introuvable ou vainqueur non défini")
  }

  // 2️⃣ Vérifier si l’event est un PLE
  const { data: eventData } = await supabase
    .from("events")
    .select("is_ple")
    .eq("id", match.event_id)
    .single()

  const isPLE = eventData?.is_ple === true

  // 3️⃣ Récupérer les pronos du match
  const { data: predictions, error: predError } = await supabase
    .from("predictions")
    .select("id, user_id, prediction")
    .eq("match_id", matchId)

  if (predError) {
    throw new Error("Erreur récupération pronostics")
  }

  // 4️⃣ Vérifier chaque prono
  for (const pred of predictions || []) {
    const isCorrect =
      pred.prediction.trim().toLowerCase() ===
      match.winner.trim().toLowerCase()

    // 🔵 Mise à jour prediction (is_correct + correct_answers)
    await supabase
      .from("predictions")
      .update({
        is_correct: isCorrect,
        correct_answers: isCorrect ? 1 : 0,
      })
      .eq("id", pred.id)

    if (isCorrect) {
      // 🟢 Ajouter +1 point (season + all time via RPC)
      await supabase.rpc("increment_user_points", {
        user_id_input: pred.user_id,
        increment_value: 1,
      })
    }
  }
}