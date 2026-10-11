
import PlayerCard from "../components/PlayerCard"

export default function CardPreviewPage() {
  return (
    <main className="min-h-screen bg-[#090909] px-4 py-10 text-white">
      <h1 className="mb-8 text-center text-3xl font-black uppercase tracking-wider">
        PPW — Aperçu des cartes
      </h1>

      <div className="mx-auto grid max-w-5xl grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <PlayerCard
          pseudo="ANTONAO"
          wrestlerCode="MJF"
          level="Rookie"
          season={3}
        />

        <PlayerCard
          pseudo="THE CHAMP"
          wrestlerCode="CENA"
          level="Superstar"
          season={3}
          isChampion
        />

        <PlayerCard
          pseudo="MAIN EVENT"
          wrestlerCode="REIGNS"
          level="Hall of Famer"
          season={3}
        />
      </div>
    </main>
  )
}
