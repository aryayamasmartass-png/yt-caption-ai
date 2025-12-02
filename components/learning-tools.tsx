"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Sparkles, HelpCircle, FileText, ChevronRight, ChevronLeft, RotateCw, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GoogleGenerativeAI } from "@google/generative-ai"
import OpenAI from "openai"

interface LearningToolsProps {
    transcript: string
    geminiKey: string
    openRouterKey: string
    nvidiaKey: string
    onOpenApiModal: () => void
}

type ToolType = "summary" | "flashcards" | "quiz" | null

interface FlashCard {
    front: string
    back: string
}

interface QuizQuestion {
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
}

export function LearningTools({ transcript, geminiKey, openRouterKey, nvidiaKey, onOpenApiModal }: LearningToolsProps) {
    const [activeTool, setActiveTool] = useState<ToolType>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Content State
    const [summary, setSummary] = useState<string>("")
    const [flashCards, setFlashCards] = useState<FlashCard[]>([])
    const [quiz, setQuiz] = useState<QuizQuestion[]>([])

    // Interactive State
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isCardFlipped, setIsCardFlipped] = useState(false)
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [quizScore, setQuizScore] = useState(0)
    const [showQuizResult, setShowQuizResult] = useState(false)

    const hasApiKey = !!(geminiKey || openRouterKey || nvidiaKey)

    const generateContent = async (tool: ToolType) => {
        if (!hasApiKey) {
            onOpenApiModal()
            return
        }

        setIsLoading(true)
        setError(null)
        setActiveTool(tool)

        try {
            let prompt = ""
            if (tool === "summary") {
                prompt = `You are an expert tutor. Create a comprehensive summary of the following transcript. 
        Focus on the key concepts, important details, and actionable takeaways. 
        Format the output in clean Markdown with headers and bullet points.
        Do not include any introductory text, just the summary.
        
        Transcript:
        ${transcript.slice(0, 25000)}` // Limit context window
            } else if (tool === "flashcards") {
                prompt = `You are an expert tutor. Create 10 high-quality flashcards based on the following transcript to help a student master the topic.
        Return ONLY a raw JSON array (no markdown formatting, no code blocks) of objects with "front" (question/concept) and "back" (answer/definition) properties.
        Ensure the content is accurate and covers the most important points.
        
        Transcript:
        ${transcript.slice(0, 25000)}`
            } else if (tool === "quiz") {
                prompt = `You are an expert tutor. Create a 5-question multiple-choice quiz based on the following transcript.
        Return ONLY a raw JSON array (no markdown formatting, no code blocks) of objects with the following structure:
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0, // Index of the correct option (0-3)
          "explanation": "Brief explanation of why this is correct"
        }
        Ensure the questions challenge the user's understanding and the options are plausible.
        
        Transcript:
        ${transcript.slice(0, 25000)}`
            }

            let content = ""

            // 1. Try Gemini (using @google/generative-ai SDK)
            if (geminiKey) {
                try {
                    const genAI = new GoogleGenerativeAI(geminiKey)
                    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
                    const result = await model.generateContent(prompt)
                    content = result.response.text()
                } catch (e) {
                    console.error("Gemini failed", e)
                    if (!openRouterKey && !nvidiaKey) throw e
                }
            }

            // 2. Try OpenRouter (if Gemini failed or not set)
            if (!content && openRouterKey) {
                try {
                    const openai = new OpenAI({
                        baseURL: "https://openrouter.ai/api/v1",
                        apiKey: openRouterKey,
                        dangerouslyAllowBrowser: true
                    })
                    const completion = await openai.chat.completions.create({
                        model: "mistralai/mistral-small-3.1-24b-instruct:free", // Default to a good free model
                        messages: [{ role: "user", content: prompt }],
                    })
                    content = completion.choices[0]?.message?.content || ""
                } catch (e) {
                    console.error("OpenRouter failed", e)
                    if (!nvidiaKey) throw e
                }
            }

            // 3. Try NVIDIA (via Proxy to avoid CORS)
            if (!content && nvidiaKey) {
                try {
                    const response = await fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            apiKey: nvidiaKey,
                            baseUrl: "https://integrate.api.nvidia.com/v1",
                            model: "moonshotai/kimi-k2-instruct-0905",
                            messages: [{ role: "user", content: prompt }],
                            temperature: 0.2,
                            top_p: 0.7,
                            max_tokens: 1024,
                        }),
                    })

                    if (!response.ok) {
                        const errorData = await response.json()
                        throw new Error(errorData.error || "NVIDIA API request failed")
                    }

                    const data = await response.json()
                    content = data.choices?.[0]?.message?.content || ""
                } catch (e) {
                    console.error("NVIDIA failed", e)
                    throw e
                }
            }

            if (!content) throw new Error("Failed to generate content from any provider")

            // Parse and Set State
            if (tool === "summary") {
                setSummary(content)
            } else {
                // Clean JSON string if it contains markdown code blocks
                const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim()
                const data = JSON.parse(jsonStr)

                if (tool === "flashcards") {
                    setFlashCards(data)
                    setCurrentCardIndex(0)
                    setIsCardFlipped(false)
                } else if (tool === "quiz") {
                    setQuiz(data)
                    setCurrentQuizIndex(0)
                    setSelectedOption(null)
                    setQuizScore(0)
                    setShowQuizResult(false)
                }
            }

        } catch (err: any) {
            setError(err.message || "Something went wrong. Please check your API keys.")
            setActiveTool(null)
        } finally {
            setIsLoading(false)
        }
    }

    const handleQuizOptionSelect = (index: number) => {
        if (selectedOption !== null) return // Prevent changing answer
        setSelectedOption(index)
        if (index === quiz[currentQuizIndex].correctAnswer) {
            setQuizScore(prev => prev + 1)
        }
    }

    const nextQuizQuestion = () => {
        if (currentQuizIndex < quiz.length - 1) {
            setCurrentQuizIndex(prev => prev + 1)
            setSelectedOption(null)
        } else {
            setShowQuizResult(true)
        }
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
        >
            <div className="text-center mb-8">
                <h2 className="font-mono text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    Master This Topic
                </h2>
                <p className="font-mono text-sm text-zinc-400">AI-powered tools to help you learn faster</p>
            </div>

            {/* Tool Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <ToolButton
                    icon={<FileText className="w-5 h-5" />}
                    label="Smart Summary"
                    description="Get key takeaways and insights"
                    isActive={activeTool === "summary"}
                    onClick={() => generateContent("summary")}
                    disabled={isLoading && activeTool !== "summary"}
                />
                <ToolButton
                    icon={<RotateCw className="w-5 h-5" />}
                    label="Flash Cards"
                    description="Test your memory with flip cards"
                    isActive={activeTool === "flashcards"}
                    onClick={() => generateContent("flashcards")}
                    disabled={isLoading && activeTool !== "flashcards"}
                />
                <ToolButton
                    icon={<HelpCircle className="w-5 h-5" />}
                    label="Quiz Mode"
                    description="Verify your understanding"
                    isActive={activeTool === "quiz"}
                    onClick={() => generateContent("quiz")}
                    disabled={isLoading && activeTool !== "quiz"}
                />
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 mb-8 text-center"
                    >
                        <p className="font-mono text-sm text-red-400">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading State */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-12"
                    >
                        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                        <p className="font-mono text-sm text-purple-400 animate-pulse">Generating content with AI...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active Tool Content */}
            <AnimatePresence mode="wait">
                {!isLoading && activeTool === "summary" && summary && (
                    <motion.div
                        key="summary"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 md:p-8"
                    >
                        <div className="font-sans text-zinc-300 leading-relaxed">
                            <div dangerouslySetInnerHTML={{
                                __html: summary
                                    .replace(/\n/g, "<br/>")
                                    .replace(/# (.*)/g, "<h1 class='text-2xl font-bold mb-4 text-white'>$1</h1>")
                                    .replace(/## (.*)/g, "<h2 class='text-xl font-bold mt-6 mb-3 text-purple-300'>$1</h2>")
                                    .replace(/\*\*(.*?)\*\*/g, "<strong class='text-purple-400'>$1</strong>")
                            }} />
                        </div>
                    </motion.div>
                )}

                {!isLoading && activeTool === "flashcards" && flashCards.length > 0 && (
                    <motion.div
                        key="flashcards"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="relative h-64 md:h-80 perspective-1000 cursor-pointer group" onClick={() => setIsCardFlipped(!isCardFlipped)}>
                            <motion.div
                                className="w-full h-full relative preserve-3d transition-all duration-500"
                                animate={{ rotateY: isCardFlipped ? 180 : 0 }}
                            >
                                {/* Front */}
                                <div className="absolute inset-0 backface-hidden bg-zinc-900 border border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-2xl shadow-purple-500/5 group-hover:border-purple-500/50 transition-colors">
                                    <span className="font-mono text-xs text-purple-400 mb-4 uppercase tracking-wider">Question</span>
                                    <p className="text-xl md:text-2xl font-medium text-white">{flashCards[currentCardIndex].front}</p>
                                    <p className="absolute bottom-6 font-mono text-xs text-zinc-500">Click to flip</p>
                                </div>
                                {/* Back */}
                                <div className="absolute inset-0 backface-hidden bg-zinc-950 border border-purple-500/30 rounded-xl p-8 flex flex-col items-center justify-center text-center rotate-y-180 shadow-2xl shadow-purple-500/10">
                                    <span className="font-mono text-xs text-green-400 mb-4 uppercase tracking-wider">Answer</span>
                                    <p className="text-lg md:text-xl text-zinc-200">{flashCards[currentCardIndex].back}</p>
                                </div>
                            </motion.div>
                        </div>

                        <div className="flex items-center justify-between mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setCurrentCardIndex(prev => (prev - 1 + flashCards.length) % flashCards.length)
                                    setIsCardFlipped(false)
                                }}
                                className="font-mono text-xs border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                            </Button>
                            <span className="font-mono text-sm text-zinc-500">
                                {currentCardIndex + 1} / {flashCards.length}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setCurrentCardIndex(prev => (prev + 1) % flashCards.length)
                                    setIsCardFlipped(false)
                                }}
                                className="font-mono text-xs border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {!isLoading && activeTool === "quiz" && quiz.length > 0 && (
                    <motion.div
                        key="quiz"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-2xl mx-auto"
                    >
                        {!showQuizResult ? (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8 shadow-2xl shadow-purple-500/5">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="font-mono text-xs text-purple-400 uppercase tracking-wider">Question {currentQuizIndex + 1} of {quiz.length}</span>
                                    <span className="font-mono text-xs text-zinc-500">Score: {quizScore}</span>
                                </div>

                                <h3 className="text-xl font-medium text-white mb-8">{quiz[currentQuizIndex].question}</h3>

                                <div className="space-y-3">
                                    {quiz[currentQuizIndex].options.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleQuizOptionSelect(idx)}
                                            disabled={selectedOption !== null}
                                            className={`w-full p-4 rounded-lg text-left font-mono text-sm transition-all duration-200 border ${selectedOption === null
                                                ? "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-purple-500/50 hover:bg-zinc-900"
                                                : selectedOption === idx
                                                    ? idx === quiz[currentQuizIndex].correctAnswer
                                                        ? "bg-green-950/30 border-green-500/50 text-green-200"
                                                        : "bg-red-950/30 border-red-500/50 text-red-200"
                                                    : idx === quiz[currentQuizIndex].correctAnswer
                                                        ? "bg-green-950/30 border-green-500/50 text-green-200"
                                                        : "bg-zinc-950 border-zinc-800 text-zinc-500 opacity-50"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{option}</span>
                                                {selectedOption !== null && idx === quiz[currentQuizIndex].correctAnswer && (
                                                    <Check className="w-4 h-4 text-green-400" />
                                                )}
                                                {selectedOption === idx && idx !== quiz[currentQuizIndex].correctAnswer && (
                                                    <X className="w-4 h-4 text-red-400" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {selectedOption !== null && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="mt-6 pt-6 border-t border-zinc-800"
                                    >
                                        <p className="font-mono text-sm text-zinc-400 mb-4">
                                            <span className="font-bold text-white">Explanation:</span> {quiz[currentQuizIndex].explanation}
                                        </p>
                                        <Button
                                            onClick={nextQuizQuestion}
                                            className="w-full bg-white text-black hover:bg-zinc-200 font-mono text-sm"
                                        >
                                            {currentQuizIndex < quiz.length - 1 ? "Next Question" : "See Results"}
                                        </Button>
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center shadow-2xl shadow-purple-500/10">
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h3>
                                <p className="font-mono text-zinc-400 mb-8">
                                    You scored <span className="text-white font-bold">{quizScore}</span> out of <span className="text-white font-bold">{quiz.length}</span>
                                </p>
                                <Button
                                    onClick={() => generateContent("quiz")}
                                    className="bg-white text-black hover:bg-zinc-200 font-mono text-sm px-8"
                                >
                                    Try Another Quiz
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    )
}

function ToolButton({ icon, label, description, isActive, onClick, disabled }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`relative p-6 rounded-xl border text-left transition-all duration-300 group overflow-hidden ${isActive
                ? "bg-zinc-900 border-purple-500 shadow-[0_0_30px_-10px_rgba(168,85,247,0.3)]"
                : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 transition-opacity duration-300 ${isActive ? "opacity-100" : "group-hover:opacity-100"}`} />

            <div className="relative z-10">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 ${isActive ? "bg-purple-500 text-white" : "bg-zinc-900 text-zinc-400 group-hover:text-white group-hover:bg-zinc-800"
                    }`}>
                    {icon}
                </div>
                <h3 className={`font-mono text-sm font-bold mb-1 transition-colors duration-300 ${isActive ? "text-white" : "text-zinc-300 group-hover:text-white"}`}>
                    {label}
                </h3>
                <p className="font-mono text-xs text-zinc-500 leading-relaxed">
                    {description}
                </p>
            </div>
        </button>
    )
}
