'use client'

import { useRef, useState } from 'react'
import { api } from '@/src/lib/api'

interface SidebarProps {
  pdfs: string[]
  activeTab: string
  onTabChange: (tab: string) => void
  onUploadSuccess: () => void
  onToast: (msg: string) => void
}

const TABS = [
  { id: 'chat', label: 'Ask AI',       icon: '💬' },
  { id: 'quiz', label: 'Quiz',         icon: '📝' },
  { id: 'arch', label: 'Architecture', icon: '🏗' },
]

export default function Sidebar({ pdfs, activeTab, onTabChange, onUploadSuccess, onToast }: SidebarProps) {
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | File[]) {
    const pdfsOnly = Array.from(files).filter(f => f.name.endsWith('.pdf'))
    if (!pdfsOnly.length) { onToast('Only PDF files please'); return }
    setUploading(true)
    for (const file of pdfsOnly) {
      onToast(`Uploading ${file.name}…`)
      try {
        const res = await api.upload(file)
        onToast(`✓ ${file.name} — ${res.chunks} chunks indexed`)
        onUploadSuccess()
      } catch (e: any) {
        onToast(`✗ ${e.message}`)
      }
    }
    setUploading(false)
  }

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col gap-3">

      {/* Upload */}
      <div className="bg-[#161b24] border border-[#2a3244] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#2a3244] text-[10px] font-sans font-bold tracking-widest uppercase text-[#7a8499]">
          📂 Upload PDFs
        </div>
        <div className="p-3">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
            className={`border-[1.5px] border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-200 ${
              dragging
                ? 'border-[#00d4a0] bg-[rgba(0,212,160,0.12)]'
                : 'border-[#334060] bg-[#1e2533] hover:border-[#00d4a0] hover:bg-[rgba(0,212,160,0.06)]'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
            <div className="text-2xl mb-2">📄</div>
            <p className="text-xs text-[#7a8499] leading-relaxed">
              <span className="text-[#00d4a0] font-semibold">Click or drag</span> PDFs here
              <br />Textbooks · Notes · Guidelines
            </p>
            {uploading && (
              <div className="mt-3 flex justify-center gap-1">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF list */}
      {pdfs.length > 0 && (
        <div className="bg-[#161b24] border border-[#2a3244] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#2a3244] flex items-center justify-between">
            <span className="text-[10px] font-sans font-bold tracking-widest uppercase text-[#7a8499]">
              📚 Knowledge Base
            </span>
            <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-[rgba(0,212,160,0.12)] text-[#00d4a0] border border-[rgba(0,212,160,0.2)]">
              {pdfs.length}
            </span>
          </div>
          <div className="p-3 flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {pdfs.map(pdf => (
              <div key={pdf} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1e2533] border border-[#2a3244]">
                <span className="text-[#00d4a0] text-sm flex-shrink-0">📄</span>
                <span className="text-xs text-[#e8edf5] truncate" title={pdf}>{pdf}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="bg-[#161b24] border border-[#2a3244] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#2a3244] text-[10px] font-sans font-bold tracking-widest uppercase text-[#7a8499]">
          ⚡ Navigate
        </div>
        <div className="p-2 flex flex-col gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all font-sans font-semibold text-sm ${
                activeTab === tab.id
                  ? 'text-[#00d4a0] bg-[rgba(0,212,160,0.08)]'
                  : 'text-[#7a8499] hover:text-[#e8edf5] hover:bg-[#1e2533]'
              }`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm border transition-all ${
                activeTab === tab.id
                  ? 'bg-[rgba(0,212,160,0.12)] border-[rgba(0,212,160,0.3)]'
                  : 'bg-[#1e2533] border-[#2a3244]'
              }`}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

    </aside>
  )
}