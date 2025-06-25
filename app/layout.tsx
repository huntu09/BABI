import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
// Tambahkan import PWAManager
import PWAManager from "@/components/pwa-manager"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dropiyo - Get Paid To Complete Tasks",
  description:
    "Earn money online by completing simple tasks, surveys, and offers. Join thousands of users earning real money with our trusted GPT platform.",
  keywords: "earn money online, get paid to, GPT platform, surveys, tasks, referral program, dropiyo",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Di dalam return statement, tambahkan PWAManager sebelum closing body tag
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster />
          <PWAManager />
        </ThemeProvider>
      </body>
    </html>
  )
}
