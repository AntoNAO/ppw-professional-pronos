"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

type Match = {
  id: string
  event_name: string
  match_title: string
  starts_at: string
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMatches = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("starts_at", { ascending: true })

      if (error) {
        alert("Erreur chargement matchs : " + error.message)
        return
      }

      setMatches(data || [])
      setLoading(false)
    }

    loadMatches()
  }, [])

  if (loading) return <div className="text-white mt-20 text-center">Chargement...</div>

  return (
    <div className="max-w-2xl mx-auto mt-20 text-white">
      <h1 className="text-2xl font-bold mb-4">Matchs à venir</h1>

      {matches.length === 0 && <p>Aucun match pour le moment.</p>}

      <ul className="space-y-4">
        {matches.map((m) => (
          <li key={m.id} className="border border-gray-700 p-4 rounded">
            <p className="font-semibold">{m.event_name}</p>
            <p>{m.match_title}</p>
            <p className="text-sm text-gray-400">
              Débute le {new Date(m.starts_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
