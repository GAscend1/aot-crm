"use client"

import { useEffect, useRef } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { X, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoModalProps {
  open: boolean
  onClose: () => void
}

export function VideoModal({ open, onClose }: VideoModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
      closeRef.current?.focus()
    }
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Root open={open} onOpenChange={onClose}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Backdrop
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              render={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              }
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <DialogPrimitive.Popup
                className={cn(
                  "relative w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-2xl outline-none",
                )}
                render={
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="relative aspect-video flex items-center justify-center bg-gradient-to-br from-[oklch(0.546_0.245_262.881)] to-[oklch(0.45_0.2_260)]">
                      <div className="flex flex-col items-center gap-3 text-white">
                        <div className="flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                          <Play className="size-8 fill-white text-white" />
                        </div>
                        <p className="text-lg font-medium">Product Tour</p>
                        <p className="text-sm text-white/70">
                          Watch how AOT CRM transforms your workflow
                        </p>
                      </div>
                    </div>
                    <button
                      ref={closeRef}
                      onClick={onClose}
                      className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/30 text-white/80 transition-colors hover:bg-black/50 hover:text-white"
                      aria-label="Close video modal"
                    >
                      <X className="size-4" />
                    </button>
                  </motion.div>
                }
              />
            </div>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  )
}
