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
  const [savedPredictionCount, setSavedPredictionCount] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const hasDraftPredictions =
    savedPredictionCount > 0 && savedPredictionCount < matches.length

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
          const loadedPredictions = (existingPredictions as UserPredictionRow[]) || []
          const predictionMap = loadedPredictions.reduce<
            Record<string, string>
          >((acc, prediction) => {
            acc[prediction.match_id] = prediction.prediction
            return acc
          }, {})

          setPredictions(predictionMap)
          setSavedPredictionCount(loadedPredictions.length)
          setIsSubmitted(
            loadedMatches.length > 0 &&
              loadedPredictions.length === loadedMatches.length
          )
        }
      } else {
        setPredictions({})
        setSavedPredictionCount(0)
        setIsSubmitted(false)
      }

      setLoading(false)
    }

    void fetchData()
  }, [eventId])

  const handleChange = (matchId: string, value: string) => {
    if (isClosed || isSubmitted || isSubmitting) return

    setPredictions((prev) => ({ ...prev, [matchId]: value }))
  }

  const handleSubmit = async () => {
    if (isClosed) return alert("Pronos fermes")
    if (isSubmitted) {
      return alert("Tu as deja valide tes pronos pour ce show.")
    }

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) return alert("Connecte-toi")
    if (matches.length === 0) return alert("Aucun match disponible pour ce show.")

    const entries = matches.map((match) => ({
      matchId: match.id,
      prediction: (predictions[match.id] || "").trim(),
    }))

    const hasEmptyPrediction = entries.some(
      (entry) => entry.prediction.length === 0
    )

    if (hasEmptyPrediction) {
      return alert("Tu dois remplir tous les matchs avant la validation finale.")
    }

    setIsSubmitting(true)

    const { error } = await supabase.rpc("submit_event_predictions", {
      event_id_input: eventId,
      predictions_input: entries.map((entry) => ({
        match_id: entry.matchId,
        prediction: entry.prediction,
      })),
    })

    setIsSubmitting(false)

    if (error) {
      if (error.message.includes("submit_event_predictions")) {
        alert(
          "La fonction SQL de validation finale n'est pas encore installee dans Supabase."
        )
        return
      }

      if (error.message.includes("ALREADY_SUBMITTED")) {
        setIsSubmitted(true)
        setSavedPredictionCount(matches.length)
        alert("Tu as deja valide tes pronos pour ce show.")
        return
      }

      if (error.message.includes("INVALID_PREDICTIONS_SET")) {
        alert("Tous les matchs doivent avoir un prono valide avant d'envoyer.")
        return
      }

      if (error.message.includes("EVENT_CLOSED")) {
        setIsClosed(true)
        alert("Les pronos sont fermes pour ce show.")
        return
      }

      alert("Erreur validation finale : " + error.message)
      return
    }

    setSavedPredictionCount(matches.length)
    setIsSubmitted(true)
    alert("Pronostics valides. Ils sont maintenant verrouilles pour ce show.")
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
            disabled={isClosed || isSubmitted || isSubmitting}
            className="border p-3 rounded w-full text-white placeholder-neutral-300 bg-neutral-800"
            placeholder="Ton prono (ex: Roman Reigns)"
            value={predictions[match.id] || ""}
            onChange={(e) => handleChange(match.id, e.target.value)}
          />
        </div>
      ))}

      <div className="mt-4">
        {hasDraftPredictions && !isClosed && !isSubmitted && (
          <p className="text-center text-sm text-neutral-300 mb-3">
            Tes anciens champs sont precharges. Termine tous les matchs puis
            valide une seule fois.
          </p>
        )}

        {isSubmitted && (
          <p className="text-center text-sm text-green-400 mb-3">
            Tes pronos sont valides et verrouilles pour ce show.
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <button
          disabled={isClosed || isSubmitted || isSubmitting}
          onClick={handleSubmit}
          className="px-6 py-3 rounded mt-4 font-bold bg-green-600 hover:bg-green-700"
        >
          {isSubmitted
            ? "Pronostics verrouilles"
            : isSubmitting
              ? "Validation..."
              : "Valider definitivement mes pronos"}
        </button>
      </div>
    </div>
  )
}
