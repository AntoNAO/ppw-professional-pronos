"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { usePathname, useRouter } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [pseudo, setPseudo] = useState<string>("")
  const [points, setPoints] = useState<number>(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const loadUser = async () => {
      if (!supabase) return

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setUser(null)
        setIsAdmin(false)
        setPseudo("")
        setPoints(0)
        return
      }

      setUser(user)

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, pseudo, season_points")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Navbar profile error:", error)
        return
      }

      setIsAdmin(profile?.role === "admin")
      setPseudo(profile?.pseudo || "")
      setPoints(profile?.season_points ?? 0)
    }

    loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const linkClass = (path: string) =>
    `relative px-3 py-2 text-sm font-medium transition-all duration-300
     hover:-translate-y-[2px] hover:text-white
     ${pathname === path ? "text-white" : "text-neutral-400 hover:drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"}`

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 border-b border-neutral-800 transition-all duration-300
      ${scrolled ? "bg-black/90 backdrop-blur-lg py-3" : "bg-black/70 backdrop-blur-md py-4"}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
          <Link href="/events" className={linkClass("/events")}>Événements</Link>
          <Link href="/pronostics" className={linkClass("/pronostics")}>Mes pronos</Link>
        </div>

        <Link href="/" className="flex items-center justify-center">
          <img
            src="/ppw-logo.png"
            alt="PPW Logo"
            className="h-15 drop-shadow-[0_0_20px_rgba(34,197,94,0.7)] hover:scale-105 transition duration-300"
          />
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/leaderboard" className={linkClass("/leaderboard")}>Classement</Link>

          {user && (
            <div className="text-sm text-neutral-300 border-l border-neutral-700 pl-4 flex items-center gap-3">
              <span className="font-semibold text-white">{pseudo}</span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-black border border-green-500 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]">
                {points} PTS
              </span>
            </div>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm transition"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-sm transition">
              Login
            </Link>
          )}
        </div>
      </div>
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse" />
    </nav>
  )
}