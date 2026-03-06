"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type PredictionRow = {
  id: string
  prediction: string
  is_correct: boolean | null
  match: {
    id: string
    match_title: string
    winner: string | null
    event: {
      id: string
      name: string
      starts_at: string
      ends_at: string | null
    }
  }
}

export default function MyPredictionsPage() {
  const [predictions, setPredictions] = useState<PredictionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPredictions = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("predictions")
        .select(`
          id,
          prediction,
          is_correct,
          match:matches (
            id,
            match_title,
            winner,
            event:events (
              id,
              name,
              starts_at,
              ends_at
            )
          )
        `)
        .eq("user_id", user.id)

      if (error) console.error(error)
      else setPredictions(data as any)

      setLoading(false)
    }

    fetchPredictions()
  }, [])

  if (loading) return <p className="text-white">Chargement...</p>
  if (!predictions.length)
    return <p className="text-white">Tu n’as encore fait aucun prono.</p>

  const now = Date.now()

  const groupedByEvent = predictions.reduce((acc: any, p) => {
    const eventId = p.match.event.id
    if (!acc[eventId]) {
      acc[eventId] = { event: p.match.event, items: [] }
    }
    acc[eventId].items.push(p)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto mt-10 text-white">
      <h1 className="text-2xl font-bold mb-6">Mes pronostics</h1>

      {Object.values(groupedByEvent).map((group: any) => {
        const totalCorrect = group.items.filter((p: any) => p.is_correct).length
        const totalWrong = group.items.filter(
          (p: any) => p.is_correct === false
        ).length
        const totalPoints = totalCorrect

        const startsAt = new Date(group.event.starts_at).getTime()
        const endsAt = group.event.ends_at
          ? new Date(group.event.ends_at).getTime()
          : null

        let statusLabel = "Show à venir"
        let statusColor = "border-white text-white"

        if (endsAt && now >= endsAt) {
          statusLabel = "Show terminé"
          statusColor = "border-green-500 text-green-400"
        } else if (now >= startsAt) {
          statusLabel = "Show en cours"
          statusColor = "border-orange-500 text-orange-400"
        }

        return (
          <div
            key={group.event.id}
            className={`border rounded p-4 mb-6 ${statusColor}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold">{group.event.name}</h2>
                <p className="opacity-70">
                  Show le {new Date(group.event.starts_at).toLocaleString()}
                </p>
              </div>

              <span className="text-sm font-semibold">{statusLabel}</span>
            </div>

            {/* Résumé */}
            <div className="mb-3 text-sm">
              ✔️ {totalCorrect} bons pronos &nbsp;|&nbsp; ❌ {totalWrong} mauvais
              &nbsp;|&nbsp; 🏆 {totalPoints} points
            </div>

            {group.items.map((p: any) => (
              <div
                key={p.id}
                className={`border-b border-neutral-700 pb-2 mb-2 ${
                  p.is_correct === true
                    ? "text-green-400"
                    : p.is_correct === false
                    ? "text-red-400"
                    : "text-neutral-400"
                }`}
              >
                <p className="font-semibold text-white">
                  {p.match.match_title}
                </p>
                <p>
                  Ton prono :{" "}
                  <span className="font-bold">{p.prediction}</span>
                </p>

                {p.match.winner ? (
                  <p>
                    Résultat :{" "}
                    <span className="font-bold">{p.match.winner}</span>{" "}
                    {p.is_correct ? "✅" : "❌"}
                  </p>
                ) : (
                  <p className="opacity-60">
                    Résultat pas encore disponible
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
