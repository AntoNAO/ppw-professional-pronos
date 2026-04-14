"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type EventRow = {
  id: string
  name: string
  image_url: string | null
  starts_at: string
  ends_at: string | null
  is_open: boolean
  is_ready: boolean
}

type MatchRow = {
  id: string
  event_id: string
}

type PredictionRow = {
  match_id: string
}

type EventMeta = Record<
  string,
  {
    totalMatches: number
    userPredictionCount: number
  }
>

function getEventClosureTimestamp(event: EventRow) {
  return new Date(event.ends_at || event.starts_at).getTime()
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [eventMeta, setEventMeta] = useState<EventMeta>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("starts_at", { ascending: true })

      if (error) {
        console.error(error)
        setError(error.message)
      } else {
        const loadedEvents = (data as EventRow[]) || []
        setEvents(loadedEvents)

        const eventIds = loadedEvents.map((event) => event.id)

        if (eventIds.length === 0) {
          setEventMeta({})
          setLoading(false)
          return
        }

        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select("id, event_id")
          .in("event_id", eventIds)

        if (matchesError) {
          console.error(matchesError)
          setError(matchesError.message)
          setLoading(false)
          return
        }

        const loadedMatches = (matchesData as MatchRow[]) || []
        const nextEventMeta: EventMeta = {}
        const matchIdToEventId = new Map<string, string>()

        for (const event of loadedEvents) {
          nextEventMeta[event.id] = {
            totalMatches: 0,
            userPredictionCount: 0,
          }
        }

        for (const match of loadedMatches) {
          matchIdToEventId.set(match.id, match.event_id)

          nextEventMeta[match.event_id] = {
            totalMatches: (nextEventMeta[match.event_id]?.totalMatches || 0) + 1,
            userPredictionCount:
              nextEventMeta[match.event_id]?.userPredictionCount || 0,
          }
        }

        const { data: userData } = await supabase.auth.getUser()
        const user = userData.user

        if (user && loadedMatches.length > 0) {
          const { data: predictionsData, error: predictionsError } = await supabase
            .from("predictions")
            .select("match_id")
            .eq("user_id", user.id)
            .in(
              "match_id",
              loadedMatches.map((match) => match.id)
            )

          if (predictionsError) {
            console.error(predictionsError)
            setError(predictionsError.message)
            setLoading(false)
            return
          }

          for (const prediction of (predictionsData as PredictionRow[]) || []) {
            const eventId = matchIdToEventId.get(prediction.match_id)

            if (!eventId) continue

            nextEventMeta[eventId] = {
              totalMatches: nextEventMeta[eventId]?.totalMatches || 0,
              userPredictionCount:
                (nextEventMeta[eventId]?.userPredictionCount || 0) + 1,
            }
          }
        }

        setEventMeta(nextEventMeta)
      }

      setLoading(false)
    }

    void fetchEvents()
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [])

  if (loading) return <p className="text-white">Chargement...</p>
  if (error) return <p className="text-red-500">Erreur: {error}</p>
  if (events.length === 0) {
    return <p className="text-white">Aucun evenement pour le moment.</p>
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 text-white">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Evenements</h1>
          <p className="mt-2 text-sm text-neutral-300">
            Suis tes shows, reprends un brouillon ou verifie tout de suite si tes
            pronos sont deja verrouilles.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-green-300">
            Pas encore parie
          </span>
          <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-orange-300">
            Brouillon
          </span>
          <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-blue-300">
            Deja valide
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => {
          const closesAt = getEventClosureTimestamp(event)
          const isPast = currentTime > closesAt
          const meta = eventMeta[event.id] || {
            totalMatches: 0,
            userPredictionCount: 0,
          }
          const totalMatches = meta.totalMatches
          const userPredictionCount = meta.userPredictionCount
          const hasCompletedPredictions =
            totalMatches > 0 && userPredictionCount >= totalMatches
          const hasDraftPredictions =
            userPredictionCount > 0 && userPredictionCount < totalMatches
          const playerStatus = hasCompletedPredictions
            ? {
                label: "Deja valide",
                className:
                  "border-blue-500/40 bg-blue-500/10 text-blue-300",
              }
            : hasDraftPredictions
              ? {
                  label: "Brouillon en cours",
                  className:
                    "border-orange-500/40 bg-orange-500/10 text-orange-300",
                }
              : {
                  label: "Pas encore parie",
                  className:
                    "border-green-500/40 bg-green-500/10 text-green-300",
                }

          let badge = ""
          let badgeClass = ""
          const isClickable = event.is_ready

          if (!event.is_ready) {
            badge = "En construction"
            badgeClass = "bg-orange-600/90"
          } else if (!event.is_open || isPast) {
            badge = "Ferme"
            badgeClass = "bg-red-600/90"
          } else {
            badge = "Ouvert"
            badgeClass = "bg-green-600/90"
          }

          let ctaLabel = "Voir l'evenement"

          if (!event.is_ready) {
            ctaLabel = "Bientot disponible"
          } else if (hasCompletedPredictions) {
            ctaLabel = "Voir mes choix"
          } else if (hasDraftPredictions) {
            ctaLabel = "Reprendre le brouillon"
          } else if (event.is_open && !isPast) {
            ctaLabel = "Parier maintenant"
          } else {
            ctaLabel = "Voir le show"
          }

          const content = (
            <>
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: event.image_url
                    ? `url(${event.image_url})`
                    : "linear-gradient(135deg, rgba(10,10,10,1) 0%, rgba(22,101,52,0.7) 100%)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              <div className="absolute inset-0 bg-black/60" />

              <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold">{event.name}</h2>
                  <p className="text-sm opacity-80">
                    {new Date(event.starts_at).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full text-white ${badgeClass}`}
                    >
                      {badge}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${playerStatus.className}`}
                    >
                      {playerStatus.label}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/35 p-3">
                    <div className="flex items-center justify-between text-sm text-neutral-200">
                      <span>
                        Matchs: <span className="font-semibold">{totalMatches}</span>
                      </span>
                      <span>
                        Choisis:{" "}
                        <span className="font-semibold">{userPredictionCount}</span>
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 via-lime-400 to-emerald-300 transition-all duration-300"
                        style={{
                          width: `${
                            totalMatches === 0
                              ? 0
                              : Math.min(
                                  100,
                                  Math.round(
                                    (userPredictionCount / totalMatches) * 100
                                  )
                                )
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-200">
                      {ctaLabel}
                    </span>

                    {isClickable && (
                      <span className="text-sm underline opacity-80">
                        Ouvrir
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )

          if (isClickable) {
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="relative block rounded-2xl overflow-hidden border border-neutral-700 h-[260px] transition hover:scale-[1.02] hover:shadow-xl cursor-pointer"
              >
                {content}
              </Link>
            )
          }

          return (
            <div
              key={event.id}
              className="relative block rounded-2xl overflow-hidden border border-neutral-700 h-[260px] opacity-70 pointer-events-none"
            >
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
