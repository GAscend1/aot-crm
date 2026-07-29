"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: "What is AOT CRM and who is it for?",
    answer:
      "AOT CRM is a customer relationship management platform built for teams that rely on Microsoft 365. It is designed for sales teams, customer success managers, and small-to-medium businesses that want to manage leads, pipelines, and customer conversations inside a single interface.",
  },
  {
    question: "Does AOT CRM integrate with Microsoft 365?",
    answer:
      "Yes. AOT CRM natively syncs with Microsoft Entra ID, Outlook, Teams, Azure SQL, and Azure Blob. You can import contacts, sync emails and calendar events, and collaborate in Teams without leaving the CRM.",
  },
  {
    question: "Is there a free trial available?",
    answer:
      "Absolutely. We offer a 14-day free trial with full access to all features. No credit card is required. After the trial, you can choose a plan that fits your team or contact us for a custom enterprise quote.",
  },
  {
    question: "How does AOT CRM handle data security?",
    answer:
      "We use Microsoft Entra ID for authentication and role-based access control. All data is encrypted at rest and in transit. We comply with SOC 2 standards and offer configurable data retention policies for enterprise plans.",
  },
  {
    question: "Can I import my existing contacts and data?",
    answer:
      "Yes. You can import contacts, leads, and deals from CSV files or directly from Outlook and Microsoft Entra ID. Our onboarding team can help with migration from other CRM platforms.",
  },
  {
    question: "Does AOT CRM work on mobile devices?",
    answer:
      "Yes, AOT CRM is fully responsive and works on tablets and mobile phones through any modern browser. Native mobile apps for iOS and Android are on our roadmap.",
  },
  {
    question: "What kind of support do you offer?",
    answer:
      "Starter plans include standard support via email and community forums. Professional plans include priority support with faster response times. Enterprise plans include a dedicated success manager and 24/7 premium support.",
  },
  {
    question: "Can I customize workflows and automation?",
    answer:
      "Yes. Professional and Enterprise plans include an advanced workflow builder with trigger-based actions. You can automate task creation, email sequences, deal stage transitions, and more.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to know about AOT CRM.
          </p>
        </div>

        <div className="mt-12 space-y-2">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className="rounded-xl border transition-colors hover:bg-muted/30"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
