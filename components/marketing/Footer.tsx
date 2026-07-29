import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Globe, MessageCircle, ExternalLink } from "lucide-react"

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/integrations", label: "Integrations" },
      { href: "/security", label: "Security" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { href: "/solutions/small-business", label: "Small Business" },
      { href: "/solutions/enterprise", label: "Enterprise" },
      { href: "/solutions/sales-teams", label: "Sales Teams" },
      { href: "/solutions/customer-success", label: "Customer Success" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/docs", label: "Docs" },
      { href: "/help", label: "Help Center" },
      { href: "/community", label: "Community" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/careers", label: "Careers" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
]

const socialLinks = [
  { href: "#", label: "LinkedIn", icon: Globe },
  { href: "#", label: "Twitter", icon: MessageCircle },
  { href: "#", label: "GitHub", icon: ExternalLink },
]

export function Footer() {
  return (
    <footer className="border-t bg-muted/50 dark:bg-[oklch(0.13_0_0)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[oklch(0.546_0.245_262.881)] text-sm font-bold text-white">
                A
              </div>
              <span className="text-base font-semibold tracking-tight">AOT CRM</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              The connected CRM for teams that rely on Microsoft 365. Manage
              relationships, pipelines, and conversations in one place.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={social.label}
                  >
                    <Icon className="size-4" />
                  </Link>
                )
              })}
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="mt-12 mb-6" />

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Ascend One Tech. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
