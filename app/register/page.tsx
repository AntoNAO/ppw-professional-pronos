"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"

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

    // 1️⃣ Création du compte
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    // ⚠️ Supabase peut mettre user dans data.user OU data.session.user
    const user = data.user ?? data.session?.user

    if (!user) {
      alert("Compte créé, mais vérifie ton email pour activer le compte.")
      setLoading(false)
      router.push("/login")
      return
    }

    // 2️⃣ Création du profil
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      pseudo,
      season_points: 0,
      role: "user",
    })

    if (profileError) {
      alert("Erreur création profil : " + profileError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    alert("Compte créé ! Tu peux te connecter maintenant.")
    router.push("/login")
  }

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-white">Créer un compte</h1>

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
        {loading ? "Création en cours..." : "Créer mon compte"}
      </button>
    </div>
  )
}