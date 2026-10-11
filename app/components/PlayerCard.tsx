
"use client"

type PlayerCardProps = {
  pseudo: string
  wrestlerCode: string
  level: string
  season: number
  isChampion?: boolean
}

const levelStyles: Record<string, string> = {
  Rookie: "border-zinc-400 text-zinc-200",
  Prospect: "border-emerald-400 text-emerald-300",
  Superstar: "border-sky-400 text-sky-300",
  "Main Eventer": "border-amber-500 text-amber-300",
  "Hall of Famer": "border-yellow-300 text-yellow-200",
}

export default function PlayerCard({
  pseudo,
  wrestlerCode,
  level,
  season,
  isChampion = false,
}: PlayerCardProps) {
  const frameStyle =
    levelStyles[level] ?? levelStyles.Rookie

  return (
    <div
      className={`relative isolate mx-auto aspect-[5/8] w-full max-w-[320px] overflow-hidden rounded-[22px] border-4 bg-[#101010] p-3 shadow-2xl ${frameStyle}`}
    >
      {/* Fond métallique */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_35%,#494039_0%,#191817_45%,#050505_100%)]" />

      {/* Texture et reflets */}
      <div className="pointer-events-none absolute inset-2 rounded-xl border border-white/20" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_25%,rgba(255,255,255,0.08)_45%,transparent_60%)]" />

      {/* En-tête */}
      <div className="relative z-20 flex h-[18%] flex-col items-center justify-center">
        <p className="max-w-full truncate text-center text-2xl font-black uppercase italic tracking-tight text-[#f5d995] [text-shadow:2px_3px_0_#30200b,-1px_-1px_0_#fff2c4]">
          {pseudo}
        </p>
        <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.3em] text-white/60">
          Professional Pronos
        </span>
      </div>

      {/* Portrait transparent */}
      <div className="absolute inset-x-0 top-[17%] bottom-[23%] flex items-end justify-center">
        <img
          src={`/wrestlers/${wrestlerCode.toUpperCase()}.png`}
          alt={wrestlerCode}
          className="h-full w-full object-contain object-bottom drop-shadow-[0_8px_12px_rgba(0,0,0,0.8)]"
        />
      </div>

      {/* Bandeau inférieur */}
      <div className="absolute inset-x-3 bottom-[10%] z-20 border-y-2 border-[#c8a65a] bg-gradient-to-b from-[#28231a] via-[#080808] to-[#28231a] px-2 py-2 text-center">
        <p className="truncate text-2xl font-black uppercase tracking-[0.12em] text-[#f1d28a] [text-shadow:1px_2px_2px_#000]">
          {wrestlerCode}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/80">
          Saison {season}
        </p>
      </div>

      {/* Niveau */}
      <div className="absolute bottom-2 left-4 z-30 rounded border border-current bg-black/90 px-2 py-1 text-[9px] font-black uppercase tracking-wider">
        {level}
      </div>

      {/* Champion */}
      {isChampion && (
        <div className="absolute right-3 top-3 z-30 rounded-full border border-[#f5d995] bg-[#9a711c] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
          ★ Champion PPW
        </div>
      )}

      {/* Marque PPW */}
      <div className="absolute bottom-2 right-3 z-30 text-[11px] font-black italic tracking-tight text-[#f5d995]">
        PPW
      </div>
    </div>
  )
}
