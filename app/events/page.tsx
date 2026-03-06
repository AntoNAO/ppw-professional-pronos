"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        setEvents(data || [])
      }

      setLoading(false)
    }

    fetchEvents()
  }, [])

  if (loading) return <p className="text-white">Chargement...</p>
  if (error) return <p className="text-red-500">Erreur: {error}</p>
  if (events.length === 0)
    return <p className="text-white">Aucun événement pour le moment.</p>

  return (
    <div className="max-w-6xl mx-auto mt-10 text-white">
      <h1 className="text-2xl font-bold mb-6">Événements</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => {
          const now = Date.now()
          const startsAt = new Date(event.starts_at).getTime()
          const isPast = now > startsAt
          const hasBet = false

          let badge = ""
          let badgeClass = ""
          let isClickable = true

          if (!event.is_ready) {
            badge = "🟠 En construction"
            badgeClass = "bg-orange-600"
            isClickable = false
          } else if (!event.is_open || isPast) {
            badge = "🔴 Fermé"
            badgeClass = "bg-red-600"
            isClickable = false
          } else if (hasBet) {
            badge = "🎯 Déjà parié"
            badgeClass = "bg-blue-600"
          } else {
            badge = "🟢 Ouvert"
            badgeClass = "bg-green-600"
          }

          const content = (
            <>
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${event.image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              <div className="absolute inset-0 bg-black/55" />

              <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold">{event.name}</h2>
                  <p className="text-sm opacity-80">
                    {new Date(event.starts_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-3 py-1 rounded-full text-white ${badgeClass}`}
                  >
                    {badge}
                  </span>

                  {isClickable && (
                    <span className="text-sm underline opacity-80">
                      Voir l’événement →
                    </span>
                  )}
                </div>
              </div>
            </>
          )

          if (isClickable) {
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="relative block rounded-2xl overflow-hidden border border-neutral-700 h-[200px] transition hover:scale-[1.02] hover:shadow-xl cursor-pointer"
              >
                {content}
              </Link>
            )
          }

          return (
            <div
              key={event.id}
              className="relative block rounded-2xl overflow-hidden border border-neutral-700 h-[200px] opacity-60 pointer-events-none"
            >
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}