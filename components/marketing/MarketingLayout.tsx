"use client"

import { Header } from "@/components/marketing/Header"
import { Footer } from "@/components/marketing/Footer"

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
