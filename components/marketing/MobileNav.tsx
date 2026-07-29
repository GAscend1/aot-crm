"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useTheme } from "@/components/enterprise/ThemeProvider"

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  links: { href: string; label: string }[]
}

export function MobileNav({ open, onOpenChange, links }: MobileNavProps) {
  const { data: session } = useSession()
  const { setTheme, resolved } = useTheme()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-xs flex-col">
        <SheetHeader>
          <SheetTitle>
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={() => onOpenChange(false)}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-[oklch(0.546_0.245_262.881)] text-sm font-bold text-white">
                A
              </div>
              <span className="text-base font-semibold">AOT CRM</span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        <Separator />

        <nav className="flex flex-col gap-1 px-4" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-3 px-4 pb-6">
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} theme`}
            >
              {resolved === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {session ? (
              <Button asChild className="w-full">
                <Link href="/dashboard" onClick={() => onOpenChange(false)}>
                  Open CRM
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login" onClick={() => onOpenChange(false)}>
                    Log In
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/login" onClick={() => onOpenChange(false)}>
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
