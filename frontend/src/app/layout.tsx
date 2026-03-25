import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NurseAI — Clinical Knowledge Assistant',
  description: 'RAG-powered nursing assistant. Upload docs, ask questions, generate quizzes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ height: '100%' }}>{children}</body>
    </html>
  )
}
