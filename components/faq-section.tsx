"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "How does this YouTube transcript generator work?",
    answer:
      "Simply paste any YouTube video URL into the input field and click 'Get Transcript'. We extract the captions directly from YouTube's servers. If the video doesn't have captions, you can use our Gemini AI integration to generate a transcript automatically.",
  },
  {
    question: "What if a video doesn't have captions?",
    answer:
      "No problem! Click the sparkle button to use Gemini 2.5 Flash AI to generate a transcript. You'll need to provide your own free Gemini API key from Google AI Studio. The AI analyzes the video and creates an accurate transcript.",
  },
  {
    question: "Is this service free?",
    answer:
      "Yes! Extracting existing YouTube captions is completely free. Using Gemini AI requires your own API key, which Google provides with a generous free tier.",
  },
  {
    question: "What languages are supported?",
    answer:
      "We support all languages that have captions available on YouTube. When using Gemini AI, transcripts can be generated for any language the AI model supports.",
  },
  {
    question: "Is my API key secure?",
    answer:
      "Absolutely. Your Gemini API key is stored only in your browser's local storage and is sent directly to Google's servers. We never store or log your API key on our servers.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="mt-16"
    >
      <div className="text-center mb-8">
        <h2 className="font-mono text-xl font-bold text-white mb-2">Frequently Asked Questions</h2>
        <p className="font-mono text-sm text-zinc-400">Everything you need to know about our transcript generator</p>
      </div>

      <div className="border border-zinc-800 divide-y divide-zinc-800 rounded-lg overflow-hidden">
        {faqs.map((faq, index) => (
          <motion.div key={index} initial={false}>
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
            >
              <span className="font-mono text-sm font-medium text-white pr-4">{faq.question}</span>
              <motion.div animate={{ rotate: openIndex === index ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 bg-zinc-950/50">
                    <p className="font-mono text-sm text-zinc-400 leading-relaxed">{faq.answer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
