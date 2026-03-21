export interface Citation {
  source: string
  page: number | string
  snippet: string
}

export interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  sources?: Citation[]
  timestamp: Date
}

export interface StatusResponse {
  pipeline_ready: boolean
  quiz_ready: boolean
  uploaded_pdfs: string[]
  pdf_count: number
}

export interface IngestResponse {
  status: string
  files: string[]
  chunks: number
  message?: string
}

export interface AskResponse {
  answer: string
  sources: Citation[]
  history_length: number
}

export interface QuizQuestion {
  id: number
  type: 'MCQ' | 'True/False' | 'Short Answer'
  difficulty: string
  question: string
  options?: Record<string, string> | null
  correct_answer: string
  explanation: string
  source_hint?: string
}

export interface QuizResponse {
  topic: string
  difficulty: string
  question_type: string
  total: number
  questions: QuizQuestion[]
}

export interface GradeResponse {
  correct?: boolean
  score?: number
  correct_answer: string
  feedback: string
  explanation?: string
  key_points_missed?: string[]
}