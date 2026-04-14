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
  prediction_options: string[] | null
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const hasDraftPredictions =
    savedPredictionCount > 0 && savedPredictionCount < matches.length

  const normalizeChoice = (value: string) => value.trim().toLowerCase()
  const totalMatches = matches.length
  const completedMatches = matches.filter(
    (match) => (predictions[match.id] || "").trim().length > 0
  ).length
  const remainingMatches = Math.max(totalMatches - completedMatches, 0)
  const progressPercentage =
    totalMatches === 0 ? 0 : Math.round((completedMatches / totalMatches) * 100)
  const canRequestSubmit =
    totalMatches > 0 &&
    remainingMatches === 0 &&
    !isClosed &&
    !isSubmitted &&
    !isSubmitting

  const eventState = isSubmitted
    ? {
        label: "Valide",
        badgeClass: "bg-green-500/15 text-green-300 border-green-500/40",
      }
    : isClosed
      ? {
          label: "Ferme",
          badgeClass: "bg-red-500/15 text-red-300 border-red-500/40",
        }
      : totalMatches === 0
        ? {
            label: "Sans matchs",
            badgeClass:
              "bg-neutral-500/15 text-neutral-200 border-neutral-500/40",
          }
      : remainingMatches === 0
        ? {
            label: "Pret a valider",
            badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/40",
          }
        : completedMatches > 0
          ? {
              label: "Brouillon",
              badgeClass:
                "bg-orange-500/15 text-orange-300 border-orange-500/40",
            }
          : {
              label: "En attente",
              badgeClass:
                "bg-neutral-500/15 text-neutral-200 border-neutral-500/40",
            }

  useEffect(() => {
    const fetchData = async () => {
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single()

      const { data: matchesData } = await supabase
        .from("matches")
        .select("id, match_type, match_image_url, prediction_options")
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

  const isSelectedOption = (matchId: string, option: string) =>
    normalizeChoice(predictions[matchId] || "") === normalizeChoice(option)

  const handleOpenConfirmation = () => {
    if (isClosed) return alert("Pronos fermes")
    if (isSubmitted) {
      return alert("Tu as deja valide tes pronos pour ce show.")
    }
    if (totalMatches === 0) {
      return alert("Aucun match disponible pour ce show.")
    }
    if (remainingMatches > 0) {
      return alert("Tu dois choisir tous les matchs avant la validation finale.")
    }

    setIsConfirmOpen(true)
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

    setIsConfirmOpen(false)
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

      if (error.message.includes("INVALID_PREDICTION_OPTION")) {
        alert("Un des choix envoyes ne correspond pas aux options du match.")
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
    <div className="max-w-4xl mx-auto mt-10 pb-44 text-white px-4">
      {event?.logo_url && (
        <div className="flex justify-center mb-8">
          <img
            src={event.logo_url}
            alt={event.name}
            className="max-h-[180px] object-contain"
          />
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5 shadow-[0_0_40px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{event?.name || "Evenement"}</h1>
            {event?.starts_at && (
              <p className="mt-1 text-sm text-neutral-300">
                Show le {new Date(event.starts_at).toLocaleString()}
              </p>
            )}
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-semibold ${eventState.badgeClass}`}
          >
            {eventState.label}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-sm text-neutral-300">
            <span>
              Progression: {completedMatches}/{totalMatches}
            </span>
            <span>
              {remainingMatches === 0
                ? "Tout est choisi"
                : `${remainingMatches} match${
                    remainingMatches > 1 ? "s" : ""
                  } restant${remainingMatches > 1 ? "s" : ""}`}
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 via-lime-400 to-emerald-300 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {matches.map((match) => (
        <div
          key={match.id}
          className={`mb-6 rounded-xl border p-6 transition ${
            (predictions[match.id] || "").trim().length > 0
              ? "border-green-500/40 bg-green-500/5"
              : "border-neutral-700 bg-neutral-900/40"
          }`}
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

          {(match.prediction_options || []).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(match.prediction_options || []).map((option) => {
                const isSelected = isSelectedOption(match.id, option)

                return (
                  <button
                    key={`${match.id}-${option}`}
                    type="button"
                    disabled={isClosed || isSubmitted || isSubmitting}
                    onClick={() => handleChange(match.id, option)}
                    className={`rounded-xl border px-4 py-3 text-left font-semibold transition ${
                      isSelected
                        ? "border-green-400 bg-green-500/20 text-green-200 shadow-[0_0_18px_rgba(34,197,94,0.2)]"
                        : "border-neutral-700 bg-neutral-800 text-white hover:border-green-500"
                    }`}
                  >
                    <span className="block">{option}</span>
                    {isSelected && (
                      <span className="mt-1 block text-xs font-medium uppercase tracking-wide text-green-300">
                        Ton choix
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <input
              disabled={isClosed || isSubmitted || isSubmitting}
              className="border p-3 rounded w-full text-white placeholder-neutral-300 bg-neutral-800"
              placeholder="Ton prono (ex: Roman Reigns)"
              value={predictions[match.id] || ""}
              onChange={(e) => handleChange(match.id, e.target.value)}
            />
          )}

          {(predictions[match.id] || "").trim().length > 0 && (
            <p className="mt-4 text-sm text-neutral-300">
              {isSubmitted ? "Choix verrouille :" : "Choix selectionne :"}{" "}
              <span className="font-semibold text-white">
                {predictions[match.id]}
              </span>
            </p>
          )}
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

      <div className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/95 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                {completedMatches}/{totalMatches} choix completes
              </p>
              <p className="text-sm text-neutral-300">
                {isSubmitted
                  ? "Tes pronos sont deja verrouilles pour ce show."
                  : isClosed
                    ? "Le show est ferme, tu ne peux plus envoyer de pronos."
                    : remainingMatches === 0
                      ? "Tout est pret. La prochaine validation sera definitive."
                      : `Il te reste ${remainingMatches} choix a faire avant de pouvoir valider.`}
              </p>
            </div>

            <button
              disabled={!canRequestSubmit}
              onClick={handleOpenConfirmation}
              className={`rounded-xl px-6 py-3 font-bold transition ${
                canRequestSubmit
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "cursor-not-allowed bg-neutral-800 text-neutral-500"
              }`}
            >
              {isSubmitted
                ? "Pronostics verrouilles"
                : isSubmitting
                  ? "Validation..."
                  : "Valider definitivement"}
            </button>
          </div>
        </div>
      </div>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-[0_16px_60px_rgba(0,0,0,0.55)]">
            <h2 className="text-xl font-bold text-white">
              Confirmer la validation finale ?
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-300">
              Une fois valides, tes pronos seront verrouilles pour ce show.
              Verifie bien tes choix avant de continuer.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-3">
                <p className="text-xs uppercase tracking-wide text-neutral-400">
                  Matchs
                </p>
                <p className="mt-1 text-xl font-bold">{totalMatches}</p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-3">
                <p className="text-xs uppercase tracking-wide text-neutral-400">
                  Choisis
                </p>
                <p className="mt-1 text-xl font-bold text-green-300">
                  {completedMatches}
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-3">
                <p className="text-xs uppercase tracking-wide text-neutral-400">
                  Restants
                </p>
                <p className="mt-1 text-xl font-bold text-orange-300">
                  {remainingMatches}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="rounded-xl border border-neutral-700 px-4 py-3 font-semibold text-neutral-200 transition hover:border-neutral-500"
              >
                Revenir en arriere
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-xl bg-green-600 px-4 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-neutral-700"
              >
                {isSubmitting ? "Validation..." : "Confirmer et verrouiller"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
