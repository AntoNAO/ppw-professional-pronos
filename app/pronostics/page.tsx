"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type PredictionRow = {
  id: string
  prediction: string
  is_correct: boolean | null
  match: {
    id: string
    match_type: string | null
    winner: string | null
    event: {
      id: string
      name: string
      starts_at: string
      ends_at: string | null
    }
  }
}

type GroupedPredictions = Record<
  string,
  {
    event: PredictionRow["match"]["event"]
    items: PredictionRow[]
  }
>

export default function MyPredictionsPage() {
  const [predictions, setPredictions] = useState<PredictionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

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
            match_type,
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

      if (error) {
        console.error(error)
        setErrorMessage(error.message)
      } else {
        setPredictions((data as PredictionRow[]) || [])
      }

      setLoading(false)
    }

    void fetchPredictions()
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [])

  if (loading) return <p className="text-white">Chargement...</p>
  if (errorMessage) {
    return <p className="text-red-500">Erreur: {errorMessage}</p>
  }
  if (!predictions.length) {
    return <p className="text-white">Tu n&apos;as encore fait aucun prono.</p>
  }

  const groupedByEvent = predictions.reduce<GroupedPredictions>((acc, prediction) => {
    const eventId = prediction.match.event.id

    if (!acc[eventId]) {
      acc[eventId] = { event: prediction.match.event, items: [] }
    }

    acc[eventId].items.push(prediction)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto mt-10 text-white">
      <h1 className="text-2xl font-bold mb-6">Mes pronostics</h1>

      {Object.values(groupedByEvent).map((group) => {
        const totalCorrect = group.items.filter((item) => item.is_correct).length
        const totalWrong = group.items.filter(
          (item) => item.is_correct === false
        ).length
        const totalPoints = totalCorrect

        const startsAt = new Date(group.event.starts_at).getTime()
        const endsAt = group.event.ends_at
          ? new Date(group.event.ends_at).getTime()
          : null

        let statusLabel = "Show a venir"
        let statusColor = "border-white text-white"

        if (endsAt && currentTime >= endsAt) {
          statusLabel = "Show termine"
          statusColor = "border-green-500 text-green-400"
        } else if (currentTime >= startsAt) {
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

            <div className="mb-3 text-sm">
              {totalCorrect} bons pronos | {totalWrong} mauvais | {totalPoints}{" "}
              points
            </div>

            {group.items.map((prediction) => (
              <div
                key={prediction.id}
                className={`border-b border-neutral-700 pb-2 mb-2 ${
                  prediction.is_correct === true
                    ? "text-green-400"
                    : prediction.is_correct === false
                      ? "text-red-400"
                      : "text-neutral-400"
                }`}
              >
                <p className="font-semibold text-white">
                  {prediction.match.match_type || "Match"}
                </p>
                <p>
                  Ton prono :{" "}
                  <span className="font-bold">{prediction.prediction}</span>
                </p>

                {prediction.match.winner ? (
                  <p>
                    Resultat :{" "}
                    <span className="font-bold">{prediction.match.winner}</span>{" "}
                    {prediction.is_correct ? "OK" : "KO"}
                  </p>
                ) : (
                  <p className="opacity-60">Resultat pas encore disponible</p>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
