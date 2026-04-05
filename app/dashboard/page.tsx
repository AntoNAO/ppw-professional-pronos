"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import PixelWalker from "../components/PixelWalker"

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    pronos: 0,
    season_points: 0,
    all_time_points: 0,
    ple_best_player: 0,
  })
  const [nextEvent, setNextEvent] = useState<any>(null)
  const [top3, setTop3] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!supabase) return

      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) return

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, pseudo, season_points, all_time_points, ple_best_player, sprite_code, card_code")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("Dashboard profile error:", profileError)
      }

      const { count: pronosCount } = await supabase
        .from("predictions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      const { data: nextEventData } = await supabase
        .from("events")
        .select("*")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(1)
        .single()

      const { data: top3Data } = await supabase
        .from("profiles")
        .select("pseudo, season_points")
        .order("season_points", { ascending: false })
        .limit(3)

      setProfile(profileData)
      setStats({
        pronos: pronosCount || 0,
        season_points: profileData?.season_points || 0,
        all_time_points: profileData?.all_time_points || 0,
        ple_best_player: profileData?.ple_best_player || 0,
      })
      setNextEvent(nextEventData)
      setTop3(top3Data || [])
      setLoading(false)
    }

    fetchDashboard()
  }, [])

  if (loading) return <p className="text-white">Chargement...</p>

  const cardImage = profile?.card_code
    ? `/cards/${profile.card_code}.png`
    : "/cards/default.png"

  return (
    <div className="max-w-6xl mx-auto mt-10 text-white space-y-10 relative">
      <h1 className="text-2xl font-bold">👋 Salut {profile?.pseudo} !</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Pronostics faits" value={stats.pronos} />
        <StatCard label="Points saison" value={stats.season_points} highlight />
        <StatCard label="Points all-time" value={stats.all_time_points} />
      </div>

      <div className="flex justify-center">
        <div className="flex gap-8 items-stretch">
          <div className="inline-block border-2 border-neutral-700 rounded-2xl shadow-2xl bg-neutral-900/40 p-3">
            <img
              src={cardImage}
              alt="Carte du joueur"
              className="block max-w-[520px] w-full h-auto rounded-xl card-pulse"
            />
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div className="w-56 border border-neutral-700 rounded-xl p-5 bg-neutral-900/60 text-center">
              <p className="text-sm opacity-70 mb-2">🏆 PPW WORLD</p>
              <p className="text-3xl font-bold text-green-400">{stats.season_points}</p>
            </div>

            <div className="w-56 border border-neutral-700 rounded-xl p-5 bg-neutral-900/60 text-center">
              <p className="text-sm opacity-70 mb-2">⭐ PLE</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.ple_best_player}</p>
            </div>

            <div className="w-56 border border-neutral-700 rounded-xl p-5 bg-neutral-900/60 text-center">
              <p className="text-sm opacity-70 mb-2">👑 ALL TIME</p>
              <p className="text-3xl font-bold text-purple-400">{stats.all_time_points}</p>
            </div>
          </div>
        </div>
      </div>

      {nextEvent && (
        <div className="border border-neutral-700 rounded p-4">
          <p className="font-bold mb-1">🔥 Prochain show</p>
          <p>{nextEvent.name}</p>
          <p className="opacity-70">{new Date(nextEvent.starts_at).toLocaleString()}</p>
          <Link href={`/events/${nextEvent.id}`} className="inline-block mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
            👉 Parier maintenant
          </Link>
        </div>
      )}

      {profile?.sprite_code && <PixelWalker spriteCode={profile.sprite_code} mode="walk" />}

      <div className="border border-neutral-700 rounded p-4">
        <p className="font-bold mb-2">🏆 Classement (Top 3)</p>
        {top3.length === 0 ? (
          <p className="opacity-60">Pas encore de classement.</p>
        ) : (
          <ul className="space-y-1">
            {top3.map((p, i) => (
              <li key={i}>
                {i + 1}. {p.pseudo} — {p.season_points} pts
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`border rounded p-4 text-center ${highlight ? "border-green-500 text-green-400" : "border-neutral-700"}`}>
      <p className="opacity-70">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
