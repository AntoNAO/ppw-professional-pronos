"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

type EventRow = {
  id: string
  name: string
  starts_at: string
  ends_at: string | null
  is_open: boolean
  logo_url: string | null
}

type MatchRow = {
  id: string
  match_type: string | null
  match_image_url: string | null
}

type UserPredictionRow = {
  id: string
  match_id: string
  prediction: string
}

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<EventRow | null>(null)
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [predictions, setPredictions] = useState<Record<string, string>>({})
  const [isClosed, setIsClosed] = useState(false)
  const [loading, setLoading] = useState(true)
  const hasSavedPredictions = matches.some(
    (match) => (predictions[match.id] || "").trim().length > 0
  )

  useEffect(() => {
    const fetchData = async () => {
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single()

      const { data: matchesData } = await supabase
        .from("matches")
        .select("id, match_type, match_image_url")
        .eq("event_id", eventId)
        .order("display_order", { ascending: true })

      const loadedMatches = (matchesData as MatchRow[]) || []

      setEvent((eventData as EventRow | null) ?? null)
      setMatches(loadedMatches)

      if (eventData?.starts_at) {
        const closesAt = new Date(
          eventData.ends_at || eventData.starts_at
        ).getTime()
        setIsClosed(Date.now() > closesAt || eventData.is_open === false)
      }

      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user

      if (user && loadedMatches.length > 0) {
        const { data: existingPredictions, error: predictionsError } =
          await supabase
            .from("predictions")
            .select("id, match_id, prediction")
            .eq("user_id", user.id)
            .in(
              "match_id",
              loadedMatches.map((match) => match.id)
            )

        if (predictionsError) {
          console.error("Event predictions load error:", predictionsError)
        } else {
          const predictionMap = ((existingPredictions as UserPredictionRow[]) || []).reduce<
            Record<string, string>
          >((acc, prediction) => {
            acc[prediction.match_id] = prediction.prediction
            return acc
          }, {})

          setPredictions(predictionMap)
        }
      } else {
        setPredictions({})
      }

      setLoading(false)
    }

    void fetchData()
  }, [eventId])

  const handleChange = (matchId: string, value: string) => {
    if (isClosed) return

    setPredictions((prev) => ({ ...prev, [matchId]: value }))
  }

  const handleSubmit = async () => {
    if (isClosed) return alert("Pronos fermes")

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) return alert("Connecte-toi")

    const entries = Object.entries(predictions)
      .map(([matchId, prediction]) => ({
        matchId,
        prediction: prediction.trim(),
      }))
      .filter((entry) => entry.prediction.length > 0)

    if (entries.length === 0) {
      return alert("Ajoute au moins un prono avant de valider.")
    }

    const { data: existingPredictions, error: existingError } = await supabase
      .from("predictions")
      .select("id, match_id, prediction")
      .eq("user_id", user.id)
      .in(
        "match_id",
        entries.map((entry) => entry.matchId)
      )

    if (existingError) {
      alert("Erreur chargement pronos existants : " + existingError.message)
      return
    }

    const existingByMatchId = new Map(
      ((existingPredictions as UserPredictionRow[]) || []).map((prediction) => [
        prediction.match_id,
        prediction,
      ])
    )

    const predictionsToInsert = entries
      .filter((entry) => !existingByMatchId.has(entry.matchId))
      .map((entry) => ({
        user_id: user.id,
        match_id: entry.matchId,
        prediction: entry.prediction,
      }))

    const predictionsToUpdate = entries.filter((entry) =>
      existingByMatchId.has(entry.matchId)
    )

    if (predictionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("predictions")
        .insert(predictionsToInsert)

      if (insertError) {
        alert("Erreur enregistrement pronos : " + insertError.message)
        return
      }
    }

    for (const entry of predictionsToUpdate) {
      const existingPrediction = existingByMatchId.get(entry.matchId)

      if (!existingPrediction) continue

      const { error: updateError } = await supabase
        .from("predictions")
        .update({ prediction: entry.prediction })
        .eq("id", existingPrediction.id)

      if (updateError) {
        alert("Erreur mise a jour pronos : " + updateError.message)
        return
      }
    }

    alert("Pronostics enregistres")
  }

  if (loading) return <p className="text-white">Chargement...</p>

  return (
    <div className="max-w-4xl mx-auto mt-10 text-white">
      {event?.logo_url && (
        <div className="flex justify-center mb-8">
          <img
            src={event.logo_url}
            alt={event.name}
            className="max-h-[180px] object-contain"
          />
        </div>
      )}

      {matches.map((match) => (
        <div
          key={match.id}
          className="border border-neutral-700 rounded-xl p-6 mb-6 bg-neutral-900/40"
        >
          <p className="text-center text-green-400 font-bold mb-2 uppercase">
            {match.match_type}
          </p>

          {match.match_image_url && (
            <div className="flex justify-center mb-4">
              <img
                src={match.match_image_url}
                alt={match.match_type || "Match"}
                className="max-h-[400px] object-contain rounded"
              />
            </div>
          )}

          <input
            disabled={isClosed}
            className="border p-3 rounded w-full text-white placeholder-neutral-300 bg-neutral-800"
            placeholder="Ton prono (ex: Roman Reigns)"
            value={predictions[match.id] || ""}
            onChange={(e) => handleChange(match.id, e.target.value)}
          />
        </div>
      ))}

      <div className="mt-4">
        {hasSavedPredictions && !isClosed && (
          <p className="text-center text-sm text-neutral-300 mb-3">
            Tes pronos deja enregistres sont charges ici. Tu peux les modifier
            puis enregistrer de nouveau.
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <button
          disabled={isClosed}
          onClick={handleSubmit}
          className="px-6 py-3 rounded mt-4 font-bold bg-green-600 hover:bg-green-700"
        >
          {hasSavedPredictions
            ? "Mettre a jour mes pronos"
            : "Valider mes pronos pour le show"}
        </button>
      </div>
    </div>
  )
}
