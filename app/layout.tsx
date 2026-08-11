import type { Metadata } from "next"
import { Inter, JetBrains_Mono, Outfit, Plus_Jakarta_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const defaultUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "DomDock — Experience calmer domain tracking",
  description: "Experience a calmer, focused domain health & expiry monitoring workspace. Designed for creators who ship on the web.",
}

const fontDisplay = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
})

const fontHeading = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
})

const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
})

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
})

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontDisplay.variable} ${fontHeading.variable} ${fontBody.variable} ${fontMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-[#fffadd] selection:text-[#3139fb]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

