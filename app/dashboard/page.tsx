"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import PixelWalker from "../components/PixelWalker"

type DashboardProfile = {
  id: string
  pseudo: string
  season_points: number | null
  all_time_points: number | null
  ple_best_player: number | null
  sprite_code: string | null
  card_code: string | null
  ppw_world_titles?: number | null
  ple_titles?: number | null
  all_time_titles?: number | null
}

type DashboardStats = {
  pronos: number
  season_points: number
  all_time_points: number
  ppw_world_titles: number
  ple_titles: number
  all_time_titles: number
}

type NextEvent = {
  id: string
  name: string
  starts_at: string
}

type TopPlayer = {
  pseudo: string
  season_points: number | null
}

const defaultStats: DashboardStats = {
  pronos: 0,
  season_points: 0,
  all_time_points: 0,
  ppw_world_titles: 0,
  ple_titles: 0,
  all_time_titles: 0,
}

function normalizeNumber(value: number | null | undefined) {
  return value ?? 0
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<DashboardProfile | null>(null)
  const [stats, setStats] = useState<DashboardStats>(defaultStats)
  const [nextEvent, setNextEvent] = useState<NextEvent | null>(null)
  const [top3, setTop3] = useState<TopPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!supabase) {
        setErrorMessage("Configuration Supabase manquante.")
        setLoading(false)
        return
      }

      const client = supabase

      const loadProfile = async (userId: string) => {
        const fullSelect =
          "id, pseudo, season_points, all_time_points, ple_best_player, sprite_code, card_code, ppw_world_titles, ple_titles, all_time_titles"
        const fallbackSelect =
          "id, pseudo, season_points, all_time_points, ple_best_player, sprite_code, card_code"

        const { data, error } = await client
          .from("profiles")
          .select(fullSelect)
          .eq("id", userId)
          .single()

        if (!error) {
          return data as DashboardProfile
        }

        console.warn("Dashboard titles fallback:", error.message)

        const { data: fallbackData, error: fallbackError } = await client
          .from("profiles")
          .select(fallbackSelect)
          .eq("id", userId)
          .single()

        if (fallbackError) {
          console.error("Dashboard profile error:", fallbackError)
          return null
        }

        return {
          ...(fallbackData as DashboardProfile),
          ppw_world_titles: 0,
          ple_titles: 0,
          all_time_titles: 0,
        }
      }

      try {
        const { data: userData } = await client.auth.getUser()
        const user = userData.user

        if (!user) {
          setErrorMessage("Connecte-toi pour voir ton dashboard.")
          return
        }

        const profileData = await loadProfile(user.id)

        if (!profileData) {
          setErrorMessage("Impossible de charger ton profil pour le moment.")
          return
        }

        const { count: pronosCount } = await client
          .from("predictions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        const { data: nextEventData } = await client
          .from("events")
          .select("id, name, starts_at")
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true })
          .limit(1)
          .maybeSingle()

        const { data: top3Data } = await client
          .from("profiles")
          .select("pseudo, season_points")
          .order("season_points", { ascending: false })
          .limit(3)

        setProfile(profileData)
        setStats({
          pronos: normalizeNumber(pronosCount),
          season_points: normalizeNumber(profileData.season_points),
          all_time_points: normalizeNumber(profileData.all_time_points),
          ppw_world_titles: normalizeNumber(profileData.ppw_world_titles),
          ple_titles: normalizeNumber(profileData.ple_titles),
          all_time_titles: normalizeNumber(profileData.all_time_titles),
        })
        setNextEvent(nextEventData as NextEvent | null)
        setTop3((top3Data as TopPlayer[]) || [])
      } catch (error) {
        console.error("Dashboard unexpected error:", error)
        setErrorMessage("Le dashboard a rencontre un probleme inattendu.")
      } finally {
        setLoading(false)
      }
    }

    void fetchDashboard()
  }, [])

  if (loading) return <p className="text-white">Chargement...</p>

  if (errorMessage) {
    return (
      <div className="max-w-3xl mx-auto mt-10 px-4 text-white">
        <h1 className="text-2xl font-bold mb-3">Dashboard</h1>
        <p className="rounded-xl border border-neutral-700 bg-neutral-900/60 p-4">
          {errorMessage}
        </p>
      </div>
    )
  }

  const cardImage = profile?.card_code
    ? `/cards/${profile.card_code}.png`
    : "/cards/default.png"

  return (
    <div className="max-w-6xl mx-auto mt-10 text-white space-y-10 relative">
      <h1 className="text-2xl font-bold">Salut {profile?.pseudo} !</h1>

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
              <p className="text-sm opacity-70 mb-2">PPW WORLD</p>
              <p className="text-3xl font-bold text-green-400">
                {stats.ppw_world_titles}
              </p>
            </div>

            <div className="w-56 border border-neutral-700 rounded-xl p-5 bg-neutral-900/60 text-center">
              <p className="text-sm opacity-70 mb-2">PLE</p>
              <p className="text-3xl font-bold text-yellow-400">
                {stats.ple_titles}
              </p>
            </div>

            <div className="w-56 border border-neutral-700 rounded-xl p-5 bg-neutral-900/60 text-center">
              <p className="text-sm opacity-70 mb-2">ALL TIME</p>
              <p className="text-3xl font-bold text-purple-400">
                {stats.all_time_titles}
              </p>
            </div>
          </div>
        </div>
      </div>

      {nextEvent && (
        <div className="border border-neutral-700 rounded p-4">
          <p className="font-bold mb-1">Prochain show</p>
          <p>{nextEvent.name}</p>
          <p className="opacity-70">
            {new Date(nextEvent.starts_at).toLocaleString()}
          </p>
          <Link
            href={`/events/${nextEvent.id}`}
            className="inline-block mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Parier maintenant
          </Link>
        </div>
      )}

      {profile?.sprite_code && (
        <PixelWalker spriteCode={profile.sprite_code} mode="walk" />
      )}

      <div className="border border-neutral-700 rounded p-4">
        <p className="font-bold mb-2">Classement (Top 3)</p>

        {top3.length === 0 ? (
          <p className="opacity-60">Pas encore de classement.</p>
        ) : (
          <ul className="space-y-1">
            {top3.map((player, index) => (
              <li key={`${player.pseudo}-${index}`}>
                {index + 1}. {player.pseudo} -{" "}
                {normalizeNumber(player.season_points)} pts
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div
      className={`border rounded p-4 text-center ${
        highlight ? "border-green-500 text-green-400" : "border-neutral-700"
      }`}
    >
      <p className="opacity-70">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
