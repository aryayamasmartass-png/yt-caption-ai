"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Key, Eye, EyeOff, ExternalLink, Sparkles, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (geminiKey: string, openRouterKey: string, nvidiaKey: string) => void
  geminiKey: string
  openRouterKey: string
  nvidiaKey: string
}

const OPENROUTER_MODELS = [
  { id: "x-ai/grok-4.1-fast:free", name: "Grok 4.1 Fast (Free)" },
  { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1 (Free)" },
  { id: "openai/gpt-oss-20b:free", name: "GPT OSS 20B (Free)" },
  { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air (Free)" },
]

export function ApiKeyModal({ isOpen, onClose, onSave, geminiKey, openRouterKey, nvidiaKey }: ApiKeyModalProps) {
  const [geminiApiKey, setGeminiApiKey] = useState(geminiKey)
  const [openRouterApiKeyInput, setOpenRouterApiKeyInput] = useState(openRouterKey)
  const [nvidiaApiKeyInput, setNvidiaApiKeyInput] = useState(nvidiaKey)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false)
  const [showNvidiaKey, setShowNvidiaKey] = useState(false)
  const [activeTab, setActiveTab] = useState<"gemini" | "openrouter" | "nvidia">("gemini")

  const handleSave = () => {
    onSave(geminiApiKey.trim(), openRouterApiKeyInput.trim(), nvidiaApiKeyInput.trim())
  }

  const handleClear = () => {
    setGeminiApiKey("")
    setOpenRouterApiKeyInput("")
    setNvidiaApiKeyInput("")
    localStorage.removeItem("gemini_api_key")
    localStorage.removeItem("openrouter_api_key")
    localStorage.removeItem("nvidia_api_key")
    onSave("", "", "")
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50"
          >
            <div className="bg-zinc-950 border border-zinc-800 shadow-2xl shadow-purple-500/10 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="border-b border-zinc-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center rounded">
                    <Cpu className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-mono text-sm font-medium text-white">AI API Keys</h2>
                    <p className="font-mono text-xs text-zinc-500">For AI-powered features</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center hover:bg-zinc-900 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-zinc-800">
                <button
                  onClick={() => setActiveTab("gemini")}
                  className={`flex-1 px-4 py-3 font-mono text-xs transition-colors ${activeTab === "gemini"
                    ? "bg-zinc-900/50 text-white border-b-2 border-purple-500"
                    : "text-zinc-500 hover:text-white"
                    }`}
                >
                  <Sparkles className="w-3 h-3 inline-block mr-1" />
                  Gemini
                </button>
                <button
                  onClick={() => setActiveTab("openrouter")}
                  className={`flex-1 px-4 py-3 font-mono text-xs transition-colors ${activeTab === "openrouter"
                    ? "bg-zinc-900/50 text-white border-b-2 border-purple-500"
                    : "text-zinc-500 hover:text-white"
                    }`}
                >
                  <Cpu className="w-3 h-3 inline-block mr-1" />
                  OpenRouter
                </button>
                <button
                  onClick={() => setActiveTab("nvidia")}
                  className={`flex-1 px-4 py-3 font-mono text-xs transition-colors ${activeTab === "nvidia"
                    ? "bg-zinc-900/50 text-white border-b-2 border-purple-500"
                    : "text-zinc-500 hover:text-white"
                    }`}
                >
                  <Cpu className="w-3 h-3 inline-block mr-1" />
                  NVIDIA
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                {activeTab === "gemini" ? (
                  <>
                    <p className="font-mono text-xs text-zinc-400 leading-relaxed">
                      Gemini 2.5 Flash generates transcripts when captions are unavailable. Your API key is stored locally.
                    </p>

                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        type={showGeminiKey ? "text" : "password"}
                        placeholder="Enter your Gemini API key..."
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        className="pl-10 pr-10 h-11 font-mono text-sm bg-black border-zinc-800 text-white placeholder:text-zinc-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showGeminiKey ? (
                          <EyeOff className="w-4 h-4 text-zinc-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-zinc-500" />
                        )}
                      </button>
                    </div>

                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-mono text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Get a free API key from Google AI Studio
                    </a>
                  </>
                ) : activeTab === "openrouter" ? (
                  <>
                    <p className="font-mono text-xs text-zinc-400 leading-relaxed">
                      OpenRouter provides access to multiple free AI models. Your API key is stored locally.
                    </p>

                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        type={showOpenRouterKey ? "text" : "password"}
                        placeholder="Enter your OpenRouter API key..."
                        value={openRouterApiKeyInput}
                        onChange={(e) => setOpenRouterApiKeyInput(e.target.value)}
                        className="pl-10 pr-10 h-11 font-mono text-sm bg-black border-zinc-800 text-white placeholder:text-zinc-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showOpenRouterKey ? (
                          <EyeOff className="w-4 h-4 text-zinc-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-zinc-500" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="font-mono text-xs text-zinc-500">Available Free Models:</p>
                      <div className="space-y-1">
                        {OPENROUTER_MODELS.map((model) => (
                          <div
                            key={model.id}
                            className="p-2 bg-zinc-900/50 border border-zinc-800 rounded text-xs font-mono text-zinc-300"
                          >
                            {model.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-mono text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Get a free API key from OpenRouter
                    </a>
                  </>
                ) : activeTab === "nvidia" ? (
                  <>
                    <p className="font-mono text-xs text-zinc-400 leading-relaxed">
                      NVIDIA provides access to the Kimi K2 Instruct model via their API. Your API key is stored locally.
                    </p>

                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        type={showNvidiaKey ? "text" : "password"}
                        placeholder="Enter your NVIDIA API key..."
                        value={nvidiaApiKeyInput}
                        onChange={(e) => setNvidiaApiKeyInput(e.target.value)}
                        className="pl-10 pr-10 h-11 font-mono text-sm bg-black border-zinc-800 text-white placeholder:text-zinc-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNvidiaKey(!showNvidiaKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showNvidiaKey ? (
                          <EyeOff className="w-4 h-4 text-zinc-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-zinc-500" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="font-mono text-xs text-zinc-500">Available Model:</p>
                      <div className="p-2 bg-zinc-900/50 border border-zinc-800 rounded text-xs font-mono text-zinc-300">
                        Kimi K2 Instruct (moonshotai/kimi-k2-instruct-0905)
                      </div>
                    </div>

                    <a
                      href="https://build.nvidia.com/explore/discover"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-mono text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Get an API key from NVIDIA
                    </a>
                  </>
                ) : null}
              </div>

              {/* Footer */}
              <div className="border-t border-zinc-800 p-4 flex gap-2">
                {(geminiKey || openRouterKey || nvidiaKey) && (
                  <Button variant="outline" onClick={handleClear} className="font-mono text-xs bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800">
                    Clear All
                  </Button>
                )}
                <div className="flex-1" />
                <Button variant="outline" onClick={onClose} className="font-mono text-xs bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!geminiApiKey.trim() && !openRouterApiKeyInput.trim() && !nvidiaApiKeyInput.trim()}
                  className="bg-white hover:bg-zinc-100 text-black font-mono text-xs disabled:opacity-50"
                >
                  Save Keys
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
