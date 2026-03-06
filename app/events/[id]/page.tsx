"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams } from "next/navigation"
import { calculatePointsForMatch } from "@/lib/calculatePoints"

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [predictions, setPredictions] = useState<Record<string, string>>({})
  const [isClosed, setIsClosed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single()

      const { data: matchesData } = await supabase
        .from("matches")
        .select("*")
        .eq("event_id", eventId)

      setEvent(eventData)
      setMatches(matchesData || [])

      if (eventData?.starts_at) {
        const startsAt = new Date(eventData.starts_at).getTime()
        setIsClosed(Date.now() > startsAt || eventData.is_open === false)
      }

      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .single()

        setIsAdmin(profile?.role === "admin")
      }

      setLoading(false)
    }

    fetchData()
  }, [eventId])

  const handleChange = (matchId: string, value: string) => {
    if (isClosed) return
    setPredictions((prev) => ({ ...prev, [matchId]: value }))
  }

  const handleSubmit = async () => {
    if (isClosed) return alert("Pronos fermés")

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return alert("Connecte-toi")

    const inserts = Object.entries(predictions).map(([matchId, prediction]) => ({
      user_id: userData.user.id,
      match_id: matchId,
      prediction,
    }))

    await supabase.from("predictions").insert(inserts)
    alert("Pronostics enregistrés 🔥")
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
          {/* Type de match */}
          <p className="text-center text-green-400 font-bold mb-2 uppercase">
            {match.match_type}
          </p>

          {/* Image du match */}
          {match.match_image_url && (
            <div className="flex justify-center mb-4">
              <img
                src={match.match_image_url}
                alt={match.match_type}
                className="max-h-[400px] object-contain rounded"
              />
            </div>
          )}

          {/* Input prono */}
          <input
            disabled={isClosed}
            className="border p-3 rounded w-full text-white placeholder-neutral-300 bg-neutral-800"
            placeholder="👉 Ton prono (ex: Roman Reigns)"
            onChange={(e) => handleChange(match.id, e.target.value)}
          />
        </div>
      ))}

      <div className="flex justify-center">
        <button
          disabled={isClosed}
          onClick={handleSubmit}
          className="px-6 py-3 rounded mt-4 font-bold bg-green-600 hover:bg-green-700"
        >
          Valider mes pronos pour le show
        </button>
      </div>

      {isAdmin && (
        <div className="mt-8 text-center">
          <button
            onClick={async () => {
              for (const match of matches) {
                await calculatePointsForMatch(match.id)
              }
              alert("Points calculés ✅")
            }}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded"
          >
            ⚙️ Calculer les points (admin)
          </button>
        </div>
      )}
    </div>
  )
}