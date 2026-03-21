'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/src/lib/api'
import Header    from '@/src/components/layout/Header'
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
    toastTimer.current = setTimeout(
      () => setToast(t => ({ ...t, visible: false })),
      3000
    )
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
    const id = setInterval(refreshStatus, 15000)
    return () => clearInterval(id)
  }, [refreshStatus])

  return (
    <div className="min-h-screen flex flex-col bg-[#0e1117]">
      <Header pdfCount={pdfs.length} isReady={isReady} />

      <div className="flex flex-1 max-w-[1280px] w-full mx-auto p-5 gap-4 items-start">
        <Sidebar
          pdfs={pdfs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onUploadSuccess={refreshStatus}
          onToast={showToast}
        />

        <main className="flex-1 min-w-0">
          {activeTab === 'chat' && <ChatPanel onToast={showToast} />}
          {activeTab === 'quiz' && <QuizPanel onToast={showToast} />}
          {activeTab === 'arch' && <ArchPanel />}
        </main>
      </div>

      <Toast message={toast.msg} visible={toast.visible} />
    </div>
  )
}