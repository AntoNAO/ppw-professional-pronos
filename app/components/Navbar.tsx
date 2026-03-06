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
  const [username, setUsername] = useState<string>("")
  const [points, setPoints] = useState<number>(0)
  const [scrolled, setScrolled] = useState(false)

  // 🔥 Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

useEffect(() => {
  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setUser(null)
      setIsAdmin(false)
      setUsername("")
      setPoints(0)
      return
    }

    setUser(user)

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, username, season_points")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("Navbar profile error:", error)
      return
    }

    console.log("Navbar profile:", profile)

    setIsAdmin(profile.role === "admin")
    setUsername(profile.username || "")
    setPoints(profile.season_points ?? 0)
  }

  loadUser()

  const { data: listener } = supabase.auth.onAuthStateChange(() => {
    loadUser()
  })

  return () => {
    listener.subscription.unsubscribe()
  }
}, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  // 🎮 Hover esport + animation
  const linkClass = (path: string) =>
    `relative px-3 py-2 text-sm font-medium transition-all duration-300
     hover:-translate-y-[2px] hover:text-white
     ${pathname === path ? "text-white" : "text-neutral-400 hover:drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"}`

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 border-b border-neutral-800 transition-all duration-300
      ${scrolled ? "bg-black/90 backdrop-blur-lg py-3" : "bg-black/70 backdrop-blur-md py-4"}`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6">

        {/* LEFT */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
            {pathname === "/dashboard" && (
              <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-green-500 shadow-[0_0_12px_#22c55e]" />
            )}
          </Link>

          <Link href="/events" className={linkClass("/events")}>
            Événements
            {pathname === "/events" && (
              <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-green-500 shadow-[0_0_12px_#22c55e]" />
            )}
          </Link>

          <Link href="/pronostics" className={linkClass("/pronostics")}>
            Mes pronos
            {pathname === "/pronostics" && (
              <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-green-500 shadow-[0_0_12px_#22c55e]" />
            )}
          </Link>
        </div>

        {/* CENTER LOGO */}
        <Link href="/" className="flex items-center justify-center">
          <img
            src="/ppw-logo.png"
            alt="PPW Logo"
            className="h-15 drop-shadow-[0_0_20px_rgba(34,197,94,0.7)] hover:scale-105 transition duration-300"
          />
        </Link>

        {/* RIGHT */}
        <div className="flex items-center gap-6">

          <Link href="/leaderboard" className={linkClass("/leaderboard")}>
            Classement
            {pathname === "/leaderboard" && (
              <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-green-500 shadow-[0_0_12px_#22c55e]" />
            )}
          </Link>

          {/* 🔥 ADMIN Glow permanent */}
          {isAdmin && (
            <Link
              href="/admin"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300
              text-purple-400 hover:text-white
              animate-pulse
              ${pathname === "/admin" ? "drop-shadow-[0_0_10px_#a855f7]" : "drop-shadow-[0_0_6px_#a855f7]"}`}
            >
              Admin
              {pathname === "/admin" && (
                <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-purple-500 shadow-[0_0_12px_#a855f7]" />
              )}
            </Link>
          )}

          {user && (
            <div className="text-sm text-neutral-300 border-l border-neutral-700 pl-4 flex items-center gap-3">
              <span className="font-semibold text-white">{username}</span>

              {/* 🏆 Badge points */}
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
            <Link
              href="/login"
              className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-sm transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* ⚡ Barre lumineuse animée */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse" />
    </nav>
  )
}