import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const defaultUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "DomDock — Domain health, without the noise",
  description: "Track domain expiry and health in one quiet, focused workspace.",
}

const geistSans = Geist({ variable: "--font-geist-sans", display: "swap", subsets: ["latin"] })

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
