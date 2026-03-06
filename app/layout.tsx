import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Navbar from "./components/Navbar" // 👈 on ajoute la navbar

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "PPW - Professional Pronos",
  description: "Jeu de pronostics WWE",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black min-h-screen`}
      >
        {/* 🔝 Navbar affichée partout */}
        <Navbar />

        {/* 📄 Contenu des pages */}
        <main className="pt-24">
          {children}
        </main>
      </body>
    </html>
  )
}
