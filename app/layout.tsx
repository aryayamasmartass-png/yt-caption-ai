import type React from "react"
import type { Metadata } from "next"

import "./globals.css"


// Initialize fonts
import { Geist_Mono } from "next/font/google"

const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Free YouTube Transcript Generator | TranscriptAI",
  description:
    "Get the text from any YouTube video in seconds. Extract captions or use Gemini AI to generate transcripts automatically.",
  keywords: ["youtube transcript", "transcript generator", "youtube captions", "video to text", "ai transcript"],
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.className} font-mono antialiased`}>
        {children}
      </body>
    </html>
  )
}
