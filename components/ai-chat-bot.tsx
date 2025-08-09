"use client"

import type React from "react"

import { useState } from "react"
import { Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIChatBotProps {
  onClose: () => void
}

export default function AIChatBot({ onClose }: AIChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI tutor. I can help you understand topics, explain concepts, summarize content, or answer questions about your studies. What would you like to learn about today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Simulate AI response - in a real app, you'd call your AI API here
      const response = await simulateAIResponse(input)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error getting AI response:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const simulateAIResponse = async (userInput: string): Promise<string> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const input = userInput.toLowerCase()

    if (input.includes("math") || input.includes("calculus") || input.includes("algebra")) {
      return "Mathematics is a fascinating subject! Whether you're working with algebra, calculus, or other areas, I can help break down complex concepts into manageable steps. What specific math topic would you like me to explain?"
    }

    if (input.includes("physics")) {
      return "Physics helps us understand how the universe works! From mechanics to thermodynamics, quantum physics to relativity - I can help explain concepts, solve problems, or clarify any physics topics you're studying."
    }

    if (input.includes("chemistry")) {
      return "Chemistry is the study of matter and its interactions! I can help with chemical equations, molecular structures, reaction mechanisms, or any other chemistry concepts you need assistance with."
    }

    if (input.includes("biology")) {
      return "Biology is the study of life and living organisms! Whether you're learning about cells, genetics, evolution, or ecology, I'm here to help explain biological concepts and processes."
    }

    if (input.includes("history")) {
      return "History helps us understand the past and its impact on the present! I can help explain historical events, analyze causes and effects, or discuss the significance of different time periods and civilizations."
    }

    if (input.includes("english") || input.includes("literature")) {
      return "English and literature open up worlds of communication and creativity! I can help with grammar, writing techniques, literary analysis, or understanding different authors and their works."
    }

    if (input.includes("help") || input.includes("explain") || input.includes("what")) {
      return "I'm here to help you learn! I can:\n\n• Explain complex topics in simple terms\n• Break down problems step by step\n• Provide examples and analogies\n• Help with homework and assignments\n• Summarize content\n• Answer questions about any subject\n\nJust tell me what you'd like to learn about!"
    }

    return "That's an interesting question! I'd be happy to help you understand this topic better. Could you provide a bit more context or let me know which specific aspect you'd like me to focus on? The more details you give me, the better I can tailor my explanation to your needs."
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col" aria-describedby="ai-chat-description">
        <div id="ai-chat-description" className="sr-only">
          AI tutor chat interface for getting help with study topics and academic questions
        </div>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            AI Tutor - Study Assistant
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user" ? "bg-blue-600" : "bg-gray-600"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <Card className={`p-3 ${message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-50"}`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </Card>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <Card className="p-3 bg-gray-50">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your studies..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center pt-2">
          💡 Try asking: "Explain photosynthesis", "Help with calculus", "Summarize the Civil War"
        </div>
      </DialogContent>
    </Dialog>
  )
}
