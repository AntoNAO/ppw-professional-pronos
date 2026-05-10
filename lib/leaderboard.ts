import { supabase } from "@/lib/supabase"

export type LeaderboardMode = "season" | "alltime"

export type LeaderboardProfile = {
  id: string
  pseudo: string
  season_points: number
  all_time_points: number
}

export async function fetchPublicLeaderboard({
  mode = "season",
  limit,
}: {
  mode?: LeaderboardMode
  limit?: number
} = {}): Promise<LeaderboardProfile[]> {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase.rpc("get_public_leaderboard", {
    sort_mode: mode,
    result_limit: limit ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  return (data as LeaderboardProfile[] | null) ?? []
}
