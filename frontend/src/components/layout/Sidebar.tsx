'use client'

import { useRef, useState } from 'react'
import { api } from '@/src/lib/api'

interface Tab { id: string; label: string; icon: string }
interface Props {
  pdfs: string[]
  isReady: boolean
  activeTab: string
  onTabChange: (tab: string) => void
  onUploadSuccess: () => void
  onToast: (msg: string) => void
  tabs: Tab[]
}

export default function Sidebar({ pdfs, isReady, activeTab, onTabChange, onUploadSuccess, onToast, tabs }: Props) {
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'))
    if (!list.length) { onToast('Only PDF files are accepted'); return }
    setUploading(true)
    for (const file of list) {
      onToast(`Uploading ${file.name}…`)
      try {
        const res = await api.upload(file)
        onToast(`✓ ${file.name} — ${res.chunks} chunks indexed`)
        onUploadSuccess()
      } catch (e: any) {
        onToast(`✗ Failed: ${e.message}`)
      }
    }
    setUploading(false)
  }

  return (
    <aside style={{
      width: '260px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0a1020',
      borderRight: '1px solid #1a2540',
      overflow: 'hidden',
    }}>

      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #1a2540' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px',
            borderRadius: '12px',
            background: '#34d399',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 800,
            color: '#041a10',
            boxShadow: '0 0 16px rgba(52,211,153,0.3)',
            flexShrink: 0,
          }}>✚</div>
          <div>
            <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '19px', fontWeight: 500, color: '#dde2ed', letterSpacing: '-0.01em' }}>
              Nurse<span style={{ color: '#34d399' }}>AI</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#3a4a65', letterSpacing: '0.12em', marginTop: '1px' }}>
              CLINICAL ASSISTANT
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div>
          <div className="label" style={{ marginBottom: '10px' }}>Knowledge Base</div>
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
            style={{
              border: dragging ? '2px dashed #34d399' : '2px dashed #1a2540',
              borderRadius: '14px',
              padding: '24px 16px',
              textAlign: 'center',
              cursor: uploading ? 'wait' : 'pointer',
              background: dragging ? 'rgba(52,211,153,0.05)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <input ref={inputRef} type="file" accept=".pdf" multiple style={{ display: 'none' }}
              onChange={e => e.target.files && handleFiles(e.target.files)} />

            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                  <div className="dot" /><div className="dot" /><div className="dot" />
                </div>
                <span style={{ fontSize: '12px', color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>Indexing…</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '44px', height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(52,211,153,0.08)',
                  border: '1px solid rgba(52,211,153,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px',
                }}>📄</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#8899aa', marginBottom: '3px' }}>
                    Drop PDFs here
                  </div>
                  <div style={{ fontSize: '12px', color: '#3a4a65' }}>
                    or <span style={{ color: '#34d399', cursor: 'pointer' }}>click to browse</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {pdfs.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div className="label">Loaded Files</div>
              <span className="tag">{pdfs.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {pdfs.map((pdf, i) => (
                <div key={pdf} className="fade-up" style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px',
                  background: '#0d1525',
                  border: '1px solid #1a2540',
                  borderRadius: '10px',
                  animationDelay: `${i * 40}ms`,
                }}>
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>📄</span>
                  <span style={{ fontSize: '12px', color: '#8899aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pdf}>
                    {pdf}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="label" style={{ marginBottom: '10px' }}>Navigation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tabs.map(tab => {
              const active = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  width: '100%', padding: '11px 14px',
                  borderRadius: '12px',
                  border: active ? '1px solid rgba(52,211,153,0.25)' : '1px solid transparent',
                  background: active ? 'rgba(52,211,153,0.07)' : 'transparent',
                  color: active ? '#34d399' : '#64748b',
                  fontSize: '14px',
                  fontWeight: active ? 600 : 400,
                  fontFamily: 'Outfit, sans-serif',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}>
                  <span style={{
                    width: '32px', height: '32px',
                    borderRadius: '9px',
                    background: active ? 'rgba(52,211,153,0.12)' : '#0d1525',
                    border: `1px solid ${active ? 'rgba(52,211,153,0.2)' : '#1a2540'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {active && (
                    <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid #1a2540', flexShrink: 0 }}>
        <div style={{
          padding: '12px 14px',
          borderRadius: '12px',
          background: isReady ? 'rgba(52,211,153,0.05)' : '#0d1525',
          border: `1px solid ${isReady ? 'rgba(52,211,153,0.2)' : '#1a2540'}`,
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: isReady ? '#34d399' : '#334155',
            boxShadow: isReady ? '0 0 6px rgba(52,211,153,0.5)' : 'none',
          }} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: isReady ? '#34d399' : '#64748b' }}>
              {isReady ? 'Ready to answer' : 'Awaiting documents'}
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#3a4a65', marginTop: '2px' }}>
              {isReady ? `${pdfs.length} PDF${pdfs.length !== 1 ? 's' : ''} indexed` : 'Upload a PDF to begin'}
            </div>
          </div>
        </div>
      </div>

    </aside>
  )
}
