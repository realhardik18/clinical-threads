"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

const ASCII_CHARS = "`~!@#$%^&*()_+-=[]{}|;:,.<>?/\\\"'1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

export default function LoadingScreen() {
  const rows = 15
  const cols = 30
  const total = rows * cols

  const [chars, setChars] = useState(() =>
    Array.from({ length: total }, () => getRandomChar())
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setChars((prev) => {
        const idx = Math.floor(Math.random() * total)
        const next = [...prev]
        next[idx] = getRandomChar()
        return next
      })
    }, 50)

    return () => clearInterval(interval)
  }, [])

  function getRandomChar() {
    return ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)]
  }

  function isPartOfCross(index) {
    const row = Math.floor(index / cols)
    const col = index % cols
    const centerRow = Math.floor(rows / 2)
    const centerCol = Math.floor(cols / 2)
    const thickness = 3
    const halfThick = Math.floor(thickness / 2)
    const isH = row >= centerRow - halfThick &&
                row <= centerRow + halfThick &&
                col >= centerCol - 5 &&
                col <= centerCol + 5
    const isV = col >= centerCol - halfThick &&
                col <= centerCol + halfThick &&
                row >= centerRow - 5 &&
                row <= centerRow + 5
    return isH || isV
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center"
      >
        <motion.div
          className="font-mono text-white"
          style={{ 
            display: "grid", 
            gridTemplateColumns: `repeat(${cols}, 1ch)`,
            gap: 0
          }}
        >
          {chars.map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                delay: (i * 0.01) % 1,
              }}
              className={`inline-block leading-none ${
                isPartOfCross(i) ? "text-red-600 font-bold" : ""
              }`}
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>

        <motion.p
          className="mt-6 text-white font-bold tracking-widest text-lg md:text-2xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          DIAGNOSING TWEETS
        </motion.p>
      </motion.div>
    </div>
  )
}
