'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/src/lib/api'
import type { Message } from '@/src/types'

const SUGGESTIONS = [
  'What are the 5 rights of medication administration?',
  'Describe early signs of sepsis',
  'What is normal blood pressure range?',
  'Explain wound assessment TIMES',
]

let msgId = 0
const uid = () => String(++msgId)

export default function ChatPanel({ onToast }: { onToast: (m: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(question?: string) {
    const q = (question ?? input).trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { id: uid(), role: 'user', content: q, timestamp: new Date() }])
    setLoading(true)
    try {
      const res = await api.ask(q)
      setMessages(prev => [...prev, {
        id: uid(), role: 'ai', content: res.answer,
        sources: res.sources, timestamp: new Date(),
      }])
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id: uid(), role: 'ai',
        content: `Error: ${e.message}. Is the backend running on port 8000?`,
        timestamp: new Date(),
      }])
    }
    setLoading(false)
  }

  async function clearChat() {
    await api.clearMemory().catch(() => {})
    setMessages([])
    onToast('Conversation cleared')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-[#161b24] border border-[#2a3244] rounded-xl flex flex-col h-[460px] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a3244] flex-shrink-0">
          <span className="text-[10px] font-sans font-bold tracking-widest uppercase text-[#7a8499]">
            Clinical Q&A
          </span>
          <button
            onClick={clearChat}
            title="Clear conversation"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#2a3244] text-[#7a8499] hover:text-[#e8edf5] hover:border-[#334060] transition-all text-sm"
          >
            ↺
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="m-auto text-center animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-[rgba(0,212,160,0.12)] border border-[rgba(0,212,160,0.2)] flex items-center justify-center text-2xl mx-auto mb-4">
                🩺
              </div>
              <h3 className="font-sans font-bold text-lg text-[#e8edf5] mb-2">Ask anything clinical</h3>
              <p className="text-sm text-[#7a8499] leading-relaxed max-w-xs">
                Upload nursing PDFs then ask questions. Every answer is grounded in your documents with source citations.
              </p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex flex-col gap-1.5 animate-fade-up ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#00d4a0] text-[#0a1010] font-medium rounded-[14px_14px_4px_14px]'
                    : 'bg-[#1e2533] border border-[#2a3244] text-[#e8edf5] rounded-[14px_14px_14px_4px]'
                }`}>
                  {msg.content}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-w-[80%]">
                    {msg.sources.map((s, i) => (
                      <span key={i} title={s.snippet}
                        className="text-[10px] font-sans font-semibold px-2.5 py-1 rounded-full bg-[rgba(0,212,160,0.12)] text-[#00d4a0] border border-[rgba(0,212,160,0.2)] cursor-help">
                        📄 {s.source} p.{s.page}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-start animate-fade-up">
              <div className="bg-[#1e2533] border border-[#2a3244] rounded-[14px_14px_14px_4px] px-4 py-3 flex gap-1.5">
                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-[#2a3244] flex-shrink-0">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="e.g. What is the normal SpO2 range?"
              className="flex-1 bg-[#1e2533] border border-[#2a3244] rounded-lg px-3 py-2.5 text-sm text-[#e8edf5] placeholder-[#4a5568] outline-none focus:border-[#00d4a0] transition-colors"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-[#00d4a0] hover:bg-[#00a87e] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-[#0a1010] font-bold text-lg flex items-center justify-center transition-colors flex-shrink-0"
            >
              ↑
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)}
              className="text-xs font-sans font-semibold px-3 py-1.5 rounded-full border border-[#334060] bg-[#1e2533] text-[#7a8499] hover:border-[#00d4a0] hover:text-[#00d4a0] transition-all">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}