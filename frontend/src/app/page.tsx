'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/src/lib/api'
import Sidebar   from '@/src/components/layout/Sidebar'
import ChatPanel from '@/src/components/chat/ChatPanel'
import QuizPanel from '@/src/components/quiz/QuizPanel'
import ArchPanel from '@/src/components/ui/ArchPanel'
import Toast     from '@/src/components/ui/Toast'

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat')
  const [pdfs,      setPdfs]      = useState<string[]>([])
  const [isReady,   setIsReady]   = useState(false)
  const [toast,     setToast]     = useState({ msg: '', visible: false })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const showToast = useCallback((msg: string) => {
    setToast({ msg, visible: true })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3200)
  }, [])

  const refreshStatus = useCallback(async () => {
    try {
      const s = await api.status()
      setPdfs(s.uploaded_pdfs)
      setIsReady(s.pipeline_ready)
    } catch {}
  }, [])

  useEffect(() => {
    refreshStatus()
    const id = setInterval(refreshStatus, 12000)
    return () => clearInterval(id)
  }, [refreshStatus])

  const tabs = [
    { id: 'chat', label: 'Ask AI',       icon: '💬' },
    { id: 'quiz', label: 'Quiz',         icon: '📝' },
    { id: 'arch', label: 'Architecture', icon: '🏗️' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#070b14', overflow: 'hidden' }}>

     
      <Sidebar
        pdfs={pdfs}
        isReady={isReady}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUploadSuccess={refreshStatus}
        onToast={showToast}
        tabs={tabs}
      />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>

        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          height: '60px',
          borderBottom: '1px solid #1a2540',
          background: '#0d1525',
          flexShrink: 0,
        }}>
         
          <div style={{ display: 'flex', gap: '6px' }}>
            {tabs.map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: active ? '1px solid rgba(52,211,153,0.3)' : '1px solid transparent',
                    background: active ? 'rgba(52,211,153,0.08)' : 'transparent',
                    color: active ? '#34d399' : '#64748b',
                    fontSize: '14px',
                    fontWeight: active ? 600 : 400,
                    fontFamily: 'Outfit, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                  {tab.label}
                </button>
              )
            })}
          </div>

          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px', height: '8px',
              borderRadius: '50%',
              background: isReady ? '#34d399' : '#334155',
              boxShadow: isReady ? '0 0 8px rgba(52,211,153,0.6)' : 'none',
              animation: isReady ? 'pulse-glow 2s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>
              {isReady
                ? `${pdfs.length} document${pdfs.length !== 1 ? 's' : ''} ready`
                : 'No documents loaded'}
            </span>
          </div>
        </div>

      
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'chat' && <ChatPanel onToast={showToast} />}
          {activeTab === 'quiz' && <QuizPanel onToast={showToast} />}
          {activeTab === 'arch' && <ArchPanel />}
        </div>
      </div>

      <Toast message={toast.msg} visible={toast.visible} />
    </div>
  )
}
