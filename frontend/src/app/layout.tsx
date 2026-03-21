import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NurseAI — Knowledge Assistant',
  description: 'RAG-powered nursing knowledge assistant with quiz generation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0e1117] text-[#e8edf5]">
        {children}
      </body>
    </html>
  )
}