"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [nextEvent, setNextEvent] = useState<any>(null)
  const [topPlayers, setTopPlayers] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      // 🔐 Si connecté → dashboard
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        router.push("/dashboard")
        return
      }

      // 🎯 Prochain event ouvert
      const { data: event } = await supabase
        .from("events")
        .select("*")
        .eq("is_ready", true)
        .eq("is_open", true)
        .order("starts_at", { ascending: true })
        .limit(1)
        .single()

      if (event) setNextEvent(event)

      // 🏆 Top 3
      const { data: leaderboard } = await supabase
        .from("profiles")
        .select("username, total_points")
        .order("total_points", { ascending: false })
        .limit(3)

      if (leaderboard) setTopPlayers(leaderboard)
    }

    init()
  }, [router])

  return (
    <div className="bg-black text-white">

{/* HERO */}
<section className="relative h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden">

  {/* 🎥 VIDEO BACKGROUND */}
  <video
    autoPlay
    muted
    loop
    playsInline
    className="absolute inset-0 w-full h-full object-cover grayscale brightness-50"
  >
    <source src="/hero.mp4" type="video/mp4" />
  </video>

  {/* 🔥 OVERLAY */}
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

  {/* CONTENT */}
  <div className="relative z-10 max-w-3xl">
<img
  src="/ppw-logo.png"
  alt="PPW Logo"
  className="w-72 md:w-200 mx-auto mb-6 drop-shadow-2xl"
/>
    <p className="text-xl text-neutral-200 mb-8">
      Prédits les shows WWE, TNA, AEW,... Gagne des points,
      domine le classement et deviens champion.
    </p>

    <div className="flex gap-6 justify-center">
      <Link
        href="/register"
        className="px-8 py-3 bg-green-600 rounded-lg text-lg font-bold hover:bg-green-700 transition shadow-lg shadow-green-500/30"
      >
        🚀 Créer un compte
      </Link>

      <Link
        href="/login"
        className="px-8 py-3 border border-neutral-400 rounded-lg text-lg hover:bg-neutral-800 transition"
      >
        🔑 Se connecter
      </Link>
    </div>
  </div>
</section>

      {/* COMMENT ÇA MARCHE */}
      <section className="py-24 bg-neutral-950 text-center">
        <h2 className="text-3xl font-bold mb-12">Comment ça marche ?</h2>

        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto px-6">

          <div>
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">Choisis un show</h3>
            <p className="text-neutral-400">
              Sélectionne un PPV ouvert aux pronostics.
            </p>
          </div>

          <div>
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-bold mb-2">Fais tes pronos</h3>
            <p className="text-neutral-400">
              Prédit les vainqueurs de chaque match.
            </p>
          </div>

          <div>
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">Grimpe au classement</h3>
            <p className="text-neutral-400">
              Gagne des points et deviens le champion PPW.
            </p>
          </div>

        </div>
      </section>

      {/* PROCHAIN SHOW */}
      {nextEvent && (
        <section className="py-24 text-center">
          <h2 className="text-3xl font-bold mb-6">🔥 Prochain show</h2>

          <div
            className="max-w-3xl mx-auto rounded-2xl overflow-hidden border border-neutral-800"
            style={{
              backgroundImage: `url(${nextEvent.image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="bg-black/70 p-10">
              <h3 className="text-2xl font-bold mb-2">
                {nextEvent.name}
              </h3>
              <p className="mb-6 text-neutral-300">
                {new Date(nextEvent.starts_at).toLocaleString()}
              </p>

              <Link
                href="/register"
                className="px-6 py-3 bg-green-600 rounded-lg font-bold hover:bg-green-700 transition"
              >
                🎯 Parier maintenant
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* LEADERBOARD PREVIEW */}
      {topPlayers.length > 0 && (
        <section className="py-24 bg-neutral-950 text-center">
          <h2 className="text-3xl font-bold mb-12">🏆 Top Joueurs</h2>

          <div className="max-w-xl mx-auto space-y-4">
            {topPlayers.map((player, index) => (
              <div
                key={player.username}
                className="flex justify-between px-6 py-4 bg-neutral-900 rounded-lg border border-neutral-800"
              >
                <span>
                  #{index + 1} – {player.username}
                </span>
                <span className="font-bold">
                  {player.total_points} pts
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/leaderboard"
            className="inline-block mt-8 px-6 py-3 border border-neutral-500 rounded-lg hover:bg-neutral-800 transition"
          >
            Voir le classement complet →
          </Link>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="py-24 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Es-tu prêt à devenir Champion ?
        </h2>

        <Link
          href="/register"
          className="px-10 py-4 bg-green-600 text-lg font-bold rounded-lg hover:bg-green-700 transition"
        >
          🚀 Rejoindre PPW
        </Link>
      </section>

    </div>
  )
}