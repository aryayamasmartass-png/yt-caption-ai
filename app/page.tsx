"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Youtube, Sparkles, Loader2, AlertCircle, Key, X, Zap, FileText, Clock, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiKeyModal } from "@/components/api-key-modal"
import { TranscriptOutput } from "@/components/transcript-output"
import { LearningTools } from "@/components/learning-tools"


import { FaqSection } from "@/components/faq-section"

export default function HomePage() {
  const [url, setUrl] = useState("")
  const [transcript, setTranscript] = useState("")
  const [videoTitle, setVideoTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showApiModal, setShowApiModal] = useState(false)
  const [geminiApiKey, setGeminiApiKey] = useState("")
  const [openRouterApiKey, setOpenRouterApiKey] = useState("")
  const [nvidiaApiKey, setNvidiaApiKey] = useState("")
  const [useGemini, setUseGemini] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const savedGeminiKey = localStorage.getItem("gemini_api_key")
    const savedOpenRouterKey = localStorage.getItem("openrouter_api_key")
    const savedNvidiaKey = localStorage.getItem("nvidia_api_key")
    if (savedGeminiKey) {
      setGeminiApiKey(savedGeminiKey)
    }
    if (savedOpenRouterKey) {
      setOpenRouterApiKey(savedOpenRouterKey)
    }
    if (savedNvidiaKey) {
      setNvidiaApiKey(savedNvidiaKey)
    }
  }, [])

  const validateYouTubeUrl = (url: string): boolean => {
    return url.includes("youtube.com") || url.includes("youtu.be")
  }

  const handleSubmit = async (withGemini = false) => {
    if (!url.trim()) {
      setError("Please enter a YouTube URL")
      return
    }

    if (!validateYouTubeUrl(url)) {
      setError("Please enter a valid YouTube URL")
      return
    }

    if (withGemini && !geminiApiKey) {
      setShowApiModal(true)
      return
    }

    setIsLoading(true)
    setError(null)
    setTranscript("")
    setVideoTitle("")
    setUseGemini(withGemini)

    try {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          useGemini: withGemini,
          geminiApiKey: withGemini ? geminiApiKey : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If captions are missing and we haven't tried Gemini yet, and we have an API key, try Gemini automatically
        if (data.error?.includes("Captions are disabled") && !withGemini && geminiApiKey) {
          // Add a small delay to prevent race conditions and allow UI to update if needed
          await new Promise(resolve => setTimeout(resolve, 100));
          return handleSubmit(true);
        }
        throw new Error(data.error || "Failed to fetch transcript")
      }

      setTranscript(data.transcript)
      setVideoTitle(data.title || "YouTube Video")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([transcript], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${videoTitle || "transcript"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const saveApiKeys = (geminiKey: string, openRouterKey: string, nvidiaKey: string) => {
    setGeminiApiKey(geminiKey)
    setOpenRouterApiKey(openRouterKey)
    setNvidiaApiKey(nvidiaKey)
    localStorage.setItem("gemini_api_key", geminiKey)
    localStorage.setItem("openrouter_api_key", openRouterKey)
    localStorage.setItem("nvidia_api_key", nvidiaKey)
    setShowApiModal(false)
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="border-b border-zinc-800"
      >
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center rounded">
              <Youtube className="w-4 h-4 text-white" />
            </div>
            <span className="font-mono text-sm font-medium text-white">TranscriptAI</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowApiModal(true)}
            className="font-mono text-xs bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-600"
          >
            <Key className="w-3 h-3 mr-1" />
            API Key
          </Button>
        </div>
      </motion.header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full mb-6"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="font-mono text-xs text-purple-400">Powered by AI</span>
          </motion.div>

          <h1 className="font-mono text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Free YouTube Transcript Generator
          </h1>
          <p className="font-mono text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Get the text from any YouTube video in seconds. No captions? Use Gemini AI to generate them automatically.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg shadow-2xl shadow-purple-500/10">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="url"
                  placeholder="Paste YouTube URL here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 h-11 font-mono text-sm bg-black border-zinc-800 text-white placeholder:text-zinc-600 focus:border-purple-500 focus:ring-purple-500/20"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit(false)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={isLoading}
                  className="h-11 px-6 bg-white hover:bg-zinc-100 text-black font-mono text-sm"
                >
                  {isLoading && !useGemini ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Get Transcript
                </Button>
                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="h-11 px-4 border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-mono text-sm"
                >
                  {isLoading && useGemini ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Instant extraction
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Any language
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Any video length
              </span>
            </div>
          </div>
        </motion.div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <div className="border border-red-900/50 bg-red-950/50 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-mono text-sm text-red-300">{error}</p>
                  {error.includes("captions") && (
                    <Button
                      onClick={() => handleSubmit(true)}
                      variant="link"
                      className="font-mono text-xs text-red-400 p-0 h-auto mt-2 hover:text-red-300"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Try with Gemini AI instead
                    </Button>
                  )}
                </div>
                <button onClick={() => setError(null)}>
                  <X className="w-4 h-4 text-red-400 hover:text-red-300" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcript Output & Learning Tools */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TranscriptOutput
                transcript={transcript}
                videoTitle={videoTitle}
                onCopy={handleCopy}
                onDownload={handleDownload}
                copied={copied}
                usedGemini={useGemini}
              />

              <LearningTools
                transcript={transcript}
                geminiKey={geminiApiKey}
                openRouterKey={openRouterApiKey}
                nvidiaKey={nvidiaApiKey}
                onOpenApiModal={() => setShowApiModal(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAQ Section */}
        <FaqSection />
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="border-t border-zinc-800 py-8"
      >
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="font-mono text-xs text-zinc-600">Built with AI • TranscriptAI © 2025</p>
        </div>
      </motion.footer>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        onSave={saveApiKeys}
        geminiKey={geminiApiKey}
        openRouterKey={openRouterApiKey}
        nvidiaKey={nvidiaApiKey}
      />
    </div>
  )
}
