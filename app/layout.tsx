import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "AOT CRM \u2014 Enterprise Customer Relationship Management",
    template: "%s | AOT CRM",
  },
  description: "Manage leads, customers, pipelines, meetings, follow-ups, and Microsoft 365 conversations in one connected CRM platform.",
  keywords: ["CRM", "customer relationship management", "sales pipeline", "Microsoft 365", "enterprise software"],
  openGraph: {
    title: "AOT CRM \u2014 Enterprise Customer Relationship Management",
    description: "Turn every customer interaction into the next right action.",
    url: "https://aotcrm.com",
    siteName: "AOT CRM",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AOT CRM",
    description: "Enterprise CRM with Microsoft 365 integration.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}