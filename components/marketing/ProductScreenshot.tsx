"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ProductScreenshotProps {
  children: React.ReactNode
  className?: string
}

export function ProductScreenshot({
  children,
  className,
}: ProductScreenshotProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-4 shadow-lg ring-1 ring-foreground/5",
        "before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-xl before:ring-1 before:ring-inset before:ring-foreground/10",
        mounted && "animate-float",
        className,
      )}
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
    >
      {children}
    </motion.div>
  )
}
