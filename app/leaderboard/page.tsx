"use client"

import { useEffect, useState } from "react"
import {
  fetchPublicLeaderboard,
  type LeaderboardMode,
  type LeaderboardProfile,
} from "@/lib/leaderboard"

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<LeaderboardProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<LeaderboardMode>("season")

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      try {
        const data = await fetchPublicLeaderboard({ mode })
        setPlayers(data)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur inconnue"
        alert("Erreur leaderboard : " + message)
        setPlayers([])
      } finally {
        setLoading(false)
      }
    }

    void load()
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
