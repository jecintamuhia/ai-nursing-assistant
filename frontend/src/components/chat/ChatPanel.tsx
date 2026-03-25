'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/src/lib/api'
import type { Message } from '@/src/types'

const SUGGESTIONS = [
  { label: 'Medication rights',  q: 'What are the 5 rights of medication administration?' },
  { label: 'Sepsis recognition', q: 'Describe the early clinical signs of sepsis' },
  { label: 'Normal vitals',      q: 'What are normal ranges for all vital signs in adults?' },
  { label: 'Wound assessment',   q: 'Explain the TIMES framework for wound assessment' },
  { label: 'IV fluid types',     q: 'When are isotonic vs hypotonic IV fluids indicated?' },
  { label: 'Pain assessment',    q: 'How is the FACES pain scale used in clinical practice?' },
]

let _n = 0
const uid = () => `m${++_n}`

export default function ChatPanel({ onToast }: { onToast: (m: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const endRef   = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(q?: string) {
    const text = (q ?? input).trim()
    if (!text || loading) return
    setInput('')
    setMessages(p => [...p, { id: uid(), role: 'user', content: text, timestamp: new Date() }])
    setLoading(true)
    try {
      const res = await api.ask(text)
      setMessages(p => [...p, { id: uid(), role: 'ai', content: res.answer, sources: res.sources, timestamp: new Date() }])
    } catch {
      setMessages(p => [...p, { id: uid(), role: 'ai', content: 'Could not reach backend. Is the server running on port 8000?', timestamp: new Date() }])
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  async function clear() {
    await api.clearMemory().catch(() => {})
    setMessages([])
    onToast('Conversation cleared')
  }

  const empty = messages.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#070b14' }}>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {empty ? (
          <div className="fade-in" style={{ margin: 'auto', textAlign: 'center', maxWidth: '520px' }}>
            <div style={{
              width: '64px', height: '64px',
              borderRadius: '20px',
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 24px',
            }}>🩺</div>

            <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '26px', fontWeight: 500, color: '#dde2ed', letterSpacing: '-0.01em', marginBottom: '12px' }}>
              Clinical Knowledge Assistant
            </h1>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.75, marginBottom: '36px' }}>
              Upload your nursing PDFs, then ask any clinical question. Every answer is grounded in your documents with page-level citations.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={s.label} onClick={() => send(s.q)}
                  className={`fade-up d${i + 1}`}
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: '#0d1525',
                    border: '1px solid #1a2540',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(52,211,153,0.3)'
                    el.style.background  = 'rgba(52,211,153,0.05)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = '#1a2540'
                    el.style.background  = '#0d1525'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '5px', textTransform: 'uppercase' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.55 }}>
                    {s.q}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id}
                className="fade-up"
                style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '68%' }}>

                  <div style={{
                    fontSize: '10px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: msg.role === 'user' ? '#34d399' : '#64748b',
                    marginBottom: '6px',
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                  }}>
                    {msg.role === 'user' ? 'You' : 'NurseAI'}
                  </div>

                  <div style={{
                    padding: '14px 18px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user' ? '#34d399' : '#0d1525',
                    border:     msg.role === 'user' ? 'none' : '1px solid #1a2540',
                    color:      msg.role === 'user' ? '#041a10' : '#c8d0e0',
                    fontSize: '14.5px',
                    lineHeight: 1.75,
                    fontWeight: msg.role === 'user' ? 500 : 400,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {msg.sources.map((s, i) => (
                        <div key={i} title={s.snippet} className="tag" style={{ cursor: 'help' }}>
                          📄 {s.source} · p.{s.page}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="fade-in" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, letterSpacing: '0.08em', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>NurseAI</div>
                  <div style={{
                    display: 'inline-flex', gap: '5px', alignItems: 'center',
                    padding: '14px 18px',
                    background: '#0d1525',
                    border: '1px solid #1a2540',
                    borderRadius: '18px 18px 18px 4px',
                  }}>
                    <div className="dot" /><div className="dot" /><div className="dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </>
        )}
      </div>

      <div style={{ padding: '20px 40px 28px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 12px 10px 20px',
          background: '#0d1525',
          border: '1px solid #1a2540',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          transition: 'border-color 0.2s',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask a clinical question…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14.5px',
              color: '#dde2ed',
              fontFamily: 'Outfit, sans-serif',
            }}
          />

          {messages.length > 0 && (
            <button onClick={clear} title="Clear conversation"
              style={{
                width: '34px', height: '34px',
                borderRadius: '9px',
                border: '1px solid #1a2540',
                background: 'transparent',
                color: '#3a4a65',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.borderColor = '#f87171' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3a4a65'; (e.currentTarget as HTMLElement).style.borderColor = '#1a2540' }}
            >🗑</button>
          )}

          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width: '40px', height: '40px',
              borderRadius: '11px',
              border: 'none',
              background: input.trim() && !loading ? '#34d399' : '#0f1c30',
              color:      input.trim() && !loading ? '#041a10' : '#334155',
              cursor:     input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.2s',
              flexShrink: 0,
              boxShadow: input.trim() && !loading ? '0 0 14px rgba(52,211,153,0.25)' : 'none',
            }}
          >
            {loading
              ? <div className="spin" style={{ width: '16px', height: '16px', border: '2px solid #334155', borderTopColor: '#34d399', borderRadius: '50%' }} />
              : '↑'
            }
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11.5px', fontFamily: 'JetBrains Mono, monospace', color: '#1e2d45' }}>
          Enter to send · answers grounded in your documents only
        </div>
      </div>
    </div>
  )
}
