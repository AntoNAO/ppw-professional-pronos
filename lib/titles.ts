import { supabase } from "./supabase"

type ProfileRow = {
  id: string
  season_points: number | null
  all_time_points: number | null
}

type EventRow = {
  id: string
}

type MatchRow = {
  id: string
  event_id: string
}

type PredictionRow = {
  user_id: string
  match_id: string
  correct_answers: number | null
}

function normalizeNumber(value: number | null | undefined) {
  return value ?? 0
}

function getLeaderIds(
  profiles: ProfileRow[],
  key: "season_points" | "all_time_points"
) {
  const maxScore = profiles.reduce((max, profile) => {
    return Math.max(max, normalizeNumber(profile[key]))
  }, 0)

  if (maxScore <= 0) {
    return new Set<string>()
  }

  return new Set(
    profiles
      .filter((profile) => normalizeNumber(profile[key]) === maxScore)
      .map((profile) => profile.id)
  )
}

export async function syncProfileTitles() {
  if (!supabase) {
    throw new Error("Configuration Supabase manquante")
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, season_points, all_time_points")

  if (profilesError) {
    throw new Error(`Erreur chargement profils: ${profilesError.message}`)
  }

  const profileRows = (profiles as ProfileRow[]) || []

  if (profileRows.length === 0) {
    return
  }

  const seasonLeaders = getLeaderIds(profileRows, "season_points")
  const allTimeLeaders = getLeaderIds(profileRows, "all_time_points")
  const pleTitleCounts = new Map<string, number>()

  const { data: pleEvents, error: pleEventsError } = await supabase
    .from("events")
    .select("id")
    .eq("is_ple", true)

  if (pleEventsError) {
    throw new Error(`Erreur chargement events PLE: ${pleEventsError.message}`)
  }

  const pleEventRows = (pleEvents as EventRow[]) || []

  if (pleEventRows.length > 0) {
    const pleEventIds = pleEventRows.map((event) => event.id)

    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id, event_id")
      .in("event_id", pleEventIds)

    if (matchesError) {
      throw new Error(`Erreur chargement matchs PLE: ${matchesError.message}`)
    }

    const matchRows = (matches as MatchRow[]) || []

    if (matchRows.length > 0) {
      const eventIdByMatchId = new Map(
        matchRows.map((match) => [match.id, match.event_id])
      )

      const { data: predictions, error: predictionsError } = await supabase
        .from("predictions")
        .select("user_id, match_id, correct_answers")
        .in(
          "match_id",
          matchRows.map((match) => match.id)
        )

      if (predictionsError) {
        throw new Error(
          `Erreur chargement pronostics PLE: ${predictionsError.message}`
        )
      }

      const predictionRows = (predictions as PredictionRow[]) || []
      const scoresByEvent = new Map<string, Map<string, number>>()

      for (const prediction of predictionRows) {
        const eventId = eventIdByMatchId.get(prediction.match_id)

        if (!eventId) {
          continue
        }

        const eventScores =
          scoresByEvent.get(eventId) || new Map<string, number>()
        const currentScore = eventScores.get(prediction.user_id) || 0

        eventScores.set(
          prediction.user_id,
          currentScore + normalizeNumber(prediction.correct_answers)
        )

        scoresByEvent.set(eventId, eventScores)
      }

      for (const eventScores of scoresByEvent.values()) {
        const maxScore = Array.from(eventScores.values()).reduce((max, score) => {
          return Math.max(max, score)
        }, 0)

        if (maxScore <= 0) {
          continue
        }

        for (const [userId, score] of eventScores.entries()) {
          if (score !== maxScore) {
            continue
          }

          const currentTitles = pleTitleCounts.get(userId) || 0
          pleTitleCounts.set(userId, currentTitles + 1)
        }
      }
    }
  }

  for (const profile of profileRows) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        ppw_world_titles: seasonLeaders.has(profile.id) ? 1 : 0,
        ple_titles: pleTitleCounts.get(profile.id) || 0,
        all_time_titles: allTimeLeaders.has(profile.id) ? 1 : 0,
        ple_best_player: pleTitleCounts.get(profile.id) || 0,
      })
      .eq("id", profile.id)

    if (updateError) {
      throw new Error(`Erreur mise a jour titres: ${updateError.message}`)
    }
  }
}
