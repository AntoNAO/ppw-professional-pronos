import { supabase } from "./supabase"
import { syncProfileTitles } from "./titles"

type MatchRow = {
  id: string
  winner: string | null
  event_id: string
}

type PredictionRow = {
  id: string
  user_id: string
  prediction: string
  is_correct: boolean | null
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

export async function calculatePointsForMatch(matchId: string) {
  if (!supabase) {
    throw new Error("Configuration Supabase manquante")
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, winner, event_id")
    .eq("id", matchId)
    .single()

  const matchData = (match as MatchRow | null) ?? null

  if (matchError || !matchData?.winner) {
    throw new Error("Match introuvable ou vainqueur non defini")
  }

  const { data: predictions, error: predictionsError } = await supabase
    .from("predictions")
    .select("id, user_id, prediction, is_correct")
    .eq("match_id", matchId)

  if (predictionsError) {
    throw new Error("Erreur recuperation pronostics")
  }

  const predictionRows = (predictions as PredictionRow[]) || []

  for (const prediction of predictionRows) {
    const isCorrect =
      normalizeText(prediction.prediction) === normalizeText(matchData.winner)
    const wasCorrect = prediction.is_correct === true

    const { error: updatePredictionError } = await supabase
      .from("predictions")
      .update({
        is_correct: isCorrect,
        correct_answers: isCorrect ? 1 : 0,
      })
      .eq("id", prediction.id)

    if (updatePredictionError) {
      throw new Error(
        `Erreur mise a jour pronostic: ${updatePredictionError.message}`
      )
    }

    if (wasCorrect === isCorrect) {
      continue
    }

    const { error: pointsError } = await supabase.rpc("increment_user_points", {
      user_id_input: prediction.user_id,
      increment_value: isCorrect ? 1 : -1,
    })

    if (pointsError) {
      throw new Error(`Erreur mise a jour points: ${pointsError.message}`)
    }
  }
}

export async function calculatePointsForEvent(eventId: string) {
  if (!supabase) {
    throw new Error("Configuration Supabase manquante")
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id")
    .eq("event_id", eventId)

  if (matchesError) {
    throw new Error(`Erreur chargement matchs: ${matchesError.message}`)
  }

  for (const match of matches || []) {
    await calculatePointsForMatch(match.id)
  }

  await syncProfileTitles()
}
