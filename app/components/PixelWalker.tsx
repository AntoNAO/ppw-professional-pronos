"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  spriteCode: string
  mode?: "walk" | "idle"
}

export default function PixelWalker({ spriteCode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [x, setX] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [frame, setFrame] = useState(0)
  const [maxX, setMaxX] = useState(300)

  const frames = [
    `/sprites/${spriteCode}/run1.png`,
    `/sprites/${spriteCode}/mid.png`,
    `/sprites/${spriteCode}/run2.png`,
    `/sprites/${spriteCode}/mid.png`,
  ]

  // 📏 largeur dispo automatiquement
  useEffect(() => {
    const updateBounds = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      setMaxX(containerWidth - 48) // 48px = largeur du sprite
    }

    updateBounds()
    window.addEventListener("resize", updateBounds)
    return () => window.removeEventListener("resize", updateBounds)
  }, [])

  // 🏃 Déplacement horizontal
  useEffect(() => {
    const move = setInterval(() => {
      setX((prev) => {
        let next = prev + dir * 2

        if (next <= 0) {
          setDir(1)
          next = 0
        }

        if (next >= maxX) {
          setDir(-1)
          next = maxX
        }

        return next
      })
    }, 30)

    return () => clearInterval(move)
  }, [dir, maxX])

  // 🎞️ Animation des frames
  useEffect(() => {
    const anim = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length)
    }, 120)

    return () => clearInterval(anim)
  }, [frames.length])

  return (
    <div ref={containerRef} className="relative w-full h-16 overflow-hidden pointer-events-none">
      <img
        src={frames[frame]}
        alt="pixel-walker"
        className="absolute bottom-0"
        style={{
          transform: `translateX(${x}px) scaleX(${dir === -1 ? -1 : 1})`,
          imageRendering: "pixelated",
          width: 48,
        }}
      />
    </div>
  )
}
