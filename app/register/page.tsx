"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pseudo, setPseudo] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!email || !password || !pseudo) {
      alert("Remplis tous les champs !")
      return
    }

    if (loading) return
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    const user = data.user ?? data.session?.user

    if (!user) {
      alert("Compte cree, mais verifie ton email pour l'activer.")
      setLoading(false)
      router.push("/login")
      return
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      pseudo,
      season_points: 0,
      all_time_points: 0,
      ple_best_player: 0,
      ppw_world_titles: 0,
      ple_titles: 0,
      all_time_titles: 0,
      role: "user",
    })

    if (profileError) {
      alert("Erreur creation profil : " + profileError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    alert("Compte cree ! Tu peux te connecter maintenant.")
    router.push("/login")
  }

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-white">Creer un compte</h1>

      <input
        className="border p-2 rounded"
        placeholder="Pseudo"
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)}
      />

      <input
        className="border p-2 rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-2 rounded"
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? "Creation en cours..." : "Creer mon compte"}
      </button>
    </div>
  )
}
