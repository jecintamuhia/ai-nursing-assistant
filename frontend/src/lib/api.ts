import type {
  AskResponse,
  GradeResponse,
  IngestResponse,
  QuizResponse,
  StatusResponse,
} from '@/src/types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  status: () =>
    request<StatusResponse>('/status'),

  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return fetch(`${BASE}/documents/upload`, { method: 'POST', body: form })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
          throw new Error(err.detail || `HTTP ${res.status}`)
        }
        return res.json() as Promise<IngestResponse>
      })
  },

  ingest: () =>
    request<IngestResponse>('/documents/ingest', { method: 'POST' }),

  listPdfs: () =>
    request<{ pdfs: string[]; count: number }>('/documents/'),

  ask: (question: string) =>
    request<AskResponse>('/chat/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  clearMemory: () =>
    request('/chat/memory', { method: 'DELETE' }),

  generateQuiz: (params: {
    topic: string
    num_questions: number
    difficulty: string
    question_type: string
  }) =>
    request<QuizResponse>('/quiz/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  gradeAnswer: (question: object, user_answer: string) =>
    request<GradeResponse>('/quiz/grade', {
      method: 'POST',
      body: JSON.stringify({ question, user_answer }),
    }),
}