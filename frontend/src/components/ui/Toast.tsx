'use client'

export default function Toast({ message, visible }: { message: string; visible: boolean }) {
  const isSuccess = message.startsWith('✓')
  const isError   = message.startsWith('✗')
  const dotColor  = isSuccess ? '#34d399' : isError ? '#f87171' : '#fbbf24'

  return (
    <div style={{
      position: 'fixed', bottom: '28px', left: '50%',
      transform: `translateX(-50%) translateY(${visible ? '0' : '20px'})`,
      opacity: visible ? 1 : 0,
      zIndex: 9999,
      pointerEvents: 'none',
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 20px',
        background: '#0d1525',
        border: '1px solid #1a2540',
        borderRadius: '14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        whiteSpace: 'nowrap',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12.5px',
        color: '#c8d0e0',
      }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotColor, flexShrink: 0, boxShadow: `0 0 6px ${dotColor}` }} />
        {message}
      </div>
    </div>
  )
}
