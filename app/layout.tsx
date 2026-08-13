import type { Metadata } from "next";
import {
  Inter,
  JetBrains_Mono,
  Outfit,
  Plus_Jakarta_Sans
} from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const defaultUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "DomDock — Calm Domain & RDAP Monitoring Workspace",
    template: "%s | DomDock"
  },
  description:
    "Experience a calmer, focused domain health & expiry monitoring workspace. Track domain expirations, DNS records, SSL certificates, and hosting providers in one clear view.",
  keywords: [
    "domain monitoring",
    "domain expiration tracker",
    "RDAP registry lookup",
    "SSL certificate monitoring",
    "DNS inspector",
    "domain portfolio management",
    "web hosting detector",
    "open-source domain tool",
    "DomDock"
  ],
  authors: [{ name: "DomDock Team", url: defaultUrl }],
  creator: "DomDock",
  publisher: "DomDock",
  verification: {
    google: "qqRJmG0Jxd46iySEguo0wUqEvzQ4U7ygBXGkQCvAIv8"
  },
  openGraph: {
    title: "DomDock — Calm Domain & RDAP Monitoring Workspace",
    description:
      "Track domain expirations, DNS records, SSL certs, and hosting providers in one clear, quiet workspace.",
    url: defaultUrl,
    siteName: "DomDock",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "DomDock Domain Control Room"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "DomDock — Calm Domain & RDAP Monitoring Workspace",
    description:
      "Track domain expirations, DNS records, SSL certs, and hosting providers.",
    images: ["/twitter-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg"
  }
};

const fontDisplay = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap"
});

const fontHeading = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap"
});

const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap"
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap"
});

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
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
  );
}
