'use client'

interface HeaderProps {
  pdfCount: number
  isReady: boolean
}

export default function Header({ pdfCount, isReady }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#161b24] border-b border-[#2a3244] h-14 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#00d4a0] flex items-center justify-center text-[#0a1010] font-bold text-sm">
          ✚
        </div>
        <span className="font-sans font-bold text-lg tracking-tight">
          Nurse<span className="text-[#00d4a0]">AI</span>
        </span>
      </div>

      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-sans font-semibold tracking-wide uppercase transition-all duration-300 ${
        isReady
          ? 'bg-[rgba(0,212,160,0.12)] border-[rgba(0,212,160,0.3)] text-[#00d4a0]'
          : 'bg-[#1e2533] border-[#2a3244] text-[#7a8499]'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full transition-all ${
          isReady ? 'bg-[#00d4a0] shadow-[0_0_6px_#00d4a0]' : 'bg-[#4a5568]'
        }`} />
        {isReady ? `${pdfCount} doc${pdfCount !== 1 ? 's' : ''} ready` : 'No documents'}
      </div>
    </header>
  )
}