"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Profile = {
  id: string
  pseudo: string
  season_points: number
  all_time_points: number
}

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<"season" | "alltime">("season")

  useEffect(() => {
    const load = async () => {
      if (!supabase) return

      const { data, error } = await supabase
        .from("profiles")
        .select("id, pseudo, season_points, all_time_points")
        .order(
          mode === "season" ? "season_points" : "all_time_points",
          { ascending: false }
        )

      if (error) {
        alert("Erreur leaderboard : " + error.message)
        return
      }

      setPlayers(data || [])
      setLoading(false)
    }

    load()
  }, [mode])

  if (loading)
    return <div className="text-white mt-20 text-center">Chargement...</div>

  return (
    <div className="max-w-md mx-auto mt-20 text-white">
      <h1 className="text-2xl font-bold mb-4">Classement</h1>

      <div className="flex gap-4 mb-6 justify-center">
        <button
          onClick={() => setMode("season")}
          className={`px-4 py-2 rounded ${mode === "season" ? "bg-green-600" : "bg-neutral-800"}`}
        >
          Saison
        </button>
        <button
          onClick={() => setMode("alltime")}
          className={`px-4 py-2 rounded ${mode === "alltime" ? "bg-green-600" : "bg-neutral-800"}`}
        >
          All Time
        </button>
      </div>

      <ol className="space-y-2">
        {players.map((p, i) => (
          <li key={p.id} className="flex justify-between border border-gray-700 p-2 rounded">
            <span>#{i + 1} – {p.pseudo}</span>
            <span>{mode === "season" ? p.season_points : p.all_time_points} pts</span>
          </li>
        ))}
      </ol>
    </div>
  )
}