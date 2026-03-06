"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const SPRITES = [
  "CIAMPA",
  "JEY",
  "JIMMY",
  "MIZ",
  "MJF",
  "OWENS",
  "PUNK",
  "REIGNS",
  "ROLLINS",
  "ZAYN",
  "CODY",
  "SOLO",
  "GUNTHER",
  "JACOB",
  "TAMA",
  "TANGA",
  "OBA",
  "PENTA",
  "FENIX",
  "TRUTH",
  "LESNAR",
  "MCINTYRE",
  "KAISER",
  "PRIEST",
  "LA",
  "SHEAMUS",
  "REED",
  "BLACK",
  "CREWS",
  "MYSTERIO",
  "KOFI",
  "BIG_E",
  "WOODS",
  "SANTOS",
  "CARDONA",
  "DRAGUNOV",
  "STYLES",
  "BREAKER",
  "HAYES",
  "PAUL",
  "THEORY",
  "WALLER",
  "NAKAMURA",
  "DUNNE",
  "BATE",
  "FRAZER",
  "AXIOM",
  "TRICK",
  "FORD",
  "DAWKINS",
  "KIT",
  "BALOR",
  "TOZAWA",
  "GABLE",
  "DOMINIK",
  "JD",
  "ROCK",
  "CENA",
  "OSPREAY",
  "OMEGA",
]

export default function ChooseWrestlerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
        return
      }
      setUserId(data.user.id)
    }
    fetchUser()
  }, [router])

  const chooseSprite = async (spriteCode: string) => {
    if (!userId) return
    setLoading(true)

    await supabase
      .from("profiles")
      .update({ sprite_code: spriteCode })
      .eq("id", userId)

    router.push("/dashboard")
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">
        🎮 Choisis ton catcheur
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {SPRITES.map((code) => (
          <button
            key={code}
            onClick={() => chooseSprite(code)}
            disabled={loading}
            className="border border-neutral-700 rounded-xl p-4 hover:border-green-500 transition text-center bg-neutral-900/40"
          >
            <p className="font-bold mb-2">{code}</p>

            <img
              src={`/sprites/${code}/idle.png`}
              alt={code}
              className="mx-auto image-pixelated"
            />
          </button>
        ))}
      </div>
    </div>
  )
}