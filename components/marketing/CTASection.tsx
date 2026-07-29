"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="border-t py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.546_0.245_262.881)] to-indigo-600 px-6 py-16 text-center text-white sm:px-16 sm:py-20"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-[-30%] right-[-10%] size-[300px] rounded-full bg-white/10 blur-[80px]" />
            <div className="absolute bottom-[-20%] left-[-5%] size-[250px] rounded-full bg-cyan-400/10 blur-[60px]" />
          </div>

          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to transform your customer relationships?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-white/80">
              Start your free trial today. No credit card required.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-11 border border-white/20 bg-white text-[oklch(0.546_0.245_262.881)] shadow-lg hover:bg-white/90"
              >
                <Link href="/login">
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-11 text-white hover:bg-white/10"
              >
                <Link href="/book-demo">Book a Demo</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
