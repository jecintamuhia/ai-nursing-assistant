'use client'

import { useState } from 'react'
import { api } from '@/src/lib/api'
import type { GradeResponse, QuizQuestion, QuizResponse } from '@/src/types'

export default function QuizPanel({ onToast }: { onToast: (msg: string) => void }) {
  const [topic,      setTopic]      = useState('')
  const [qType,      setQType]      = useState('MCQ')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [numQ,       setNumQ]       = useState(5)
  const [loading,    setLoading]    = useState(false)
  const [quiz,       setQuiz]       = useState<QuizResponse | null>(null)
  const [answers,    setAnswers]    = useState<Record<number, string>>({})
  const [grades,     setGrades]     = useState<Record<number, GradeResponse>>({})
  const [revealed,   setRevealed]   = useState<Record<number, boolean>>({})
  const [done,       setDone]       = useState(false)

  async function generate() {
    if (!topic.trim()) { onToast('Enter a topic first'); return }
    setLoading(true)
    setQuiz(null); setAnswers({}); setGrades({}); setRevealed({}); setDone(false)
    try {
      const res = await api.generateQuiz({ topic, num_questions: numQ, difficulty, question_type: qType })
      setQuiz(res)
    } catch (e: any) { onToast(`Error: ${e.message}`) }
    setLoading(false)
  }

  function pickOption(qId: number, choice: string) {
    if (answers[qId] !== undefined) return
    const newAnswers = { ...answers, [qId]: choice }
    setAnswers(newAnswers)
    setRevealed(prev => ({ ...prev, [qId]: true }))
    if (Object.keys(newAnswers).length === quiz!.questions.length) setDone(true)
  }

  async function submitSA(q: QuizQuestion, answer: string) {
    if (!answer.trim()) { onToast('Write an answer first'); return }
    const newAnswers = { ...answers, [q.id]: answer }
    setAnswers(newAnswers)
    try {
      const grade = await api.gradeAnswer(q, answer)
      setGrades(prev => ({ ...prev, [q.id]: grade }))
    } catch {}
    setRevealed(prev => ({ ...prev, [q.id]: true }))
    if (Object.keys(newAnswers).length === quiz!.questions.length) setDone(true)
  }

  const answered = Object.keys(answers).length
  const total    = quiz?.questions.length ?? 0
  const progress = total ? Math.round((answered / total) * 100) : 0
  const mcqTf    = quiz?.questions.filter(q => q.type !== 'Short Answer') ?? []
  const correct  = mcqTf.filter(q => (answers[q.id] ?? '').toUpperCase() === q.correct_answer.toUpperCase()).length
  const scorePct = mcqTf.length ? Math.round((correct / mcqTf.length) * 100) : 0

  return (
    <div className="flex flex-col gap-4">

      {/* Config */}
      <div className="bg-[#161b24] border border-[#2a3244] rounded-xl p-5 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-[10px] font-sans font-bold tracking-widest uppercase text-[#7a8499] mb-1.5">Topic / Focus Area</label>
          <input value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Fluid balance, Pharmacology, ABCDE assessment"
            className="w-full bg-[#1e2533] border border-[#2a3244] rounded-lg px-3 py-2.5 text-sm text-[#e8edf5] placeholder-[#4a5568] outline-none focus:border-[#00d4a0] transition-colors" />
        </div>
        <div>
          <label className="block text-[10px] font-sans font-bold tracking-widest uppercase text-[#7a8499] mb-1.5">Question Type</label>
          <select value={qType} onChange={e => setQType(e.target.value)}
            className="w-full bg-[#1e2533] border border-[#2a3244] rounded-lg px-3 py-2.5 text-sm text-[#e8edf5] outline-none focus:border-[#00d4a0] transition-colors">
            <option value="MCQ">Multiple Choice (MCQ)</option>
            <option value="True/False">True / False</option>
            <option value="Short Answer">Short Answer</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-sans font-bold tracking-widest uppercase text-[#7a8499] mb-1.5">Difficulty</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
            className="w-full bg-[#1e2533] border border-[#2a3244] rounded-lg px-3 py-2.5 text-sm text-[#e8edf5] outline-none focus:border-[#00d4a0] transition-colors">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-sans font-bold tracking-widest uppercase text-[#7a8499] mb-1.5">Questions</label>
          <input type="number" value={numQ} min={1} max={15} onChange={e => setNumQ(Number(e.target.value))}
            className="w-full bg-[#1e2533] border border-[#2a3244] rounded-lg px-3 py-2.5 text-sm text-[#e8edf5] outline-none focus:border-[#00d4a0] transition-colors" />
        </div>
        <div className="flex items-end">
          <button onClick={generate} disabled={loading}
            className="w-full py-2.5 bg-[#00d4a0] hover:bg-[#00a87e] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[#0a1010] font-sans font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2">
            {loading ? (<><span className="w-4 h-4 border-2 border-[rgba(10,16,16,0.3)] border-t-[#0a1010] rounded-full animate-spin" />Generating…</>) : 'Generate Quiz ✦'}
          </button>
        </div>
      </div>

      {/* Progress */}
      {quiz && (
        <div>
          <div className="h-1.5 bg-[#1e2533] rounded-full overflow-hidden">
            <div className="h-full bg-[#00d4a0] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-right text-[11px] font-sans font-semibold text-[#7a8499] mt-1">{answered} / {total} answered</div>
        </div>
      )}

      {/* Score */}
      {done && mcqTf.length > 0 && (
        <div className="bg-[#161b24] border-2 border-[#00d4a0] rounded-xl p-6 text-center animate-fade-in">
          <div className="font-sans font-bold text-5xl text-[#00d4a0] mb-1">{scorePct}%</div>
          <div className="text-sm text-[#7a8499] mb-4">{correct}/{mcqTf.length} correct · {scorePct >= 70 ? '🎉 Great work!' : '📚 Keep studying!'}</div>
          <button onClick={generate}
            className="px-5 py-2 border border-[#00d4a0] rounded-lg bg-[rgba(0,212,160,0.12)] text-[#00d4a0] font-sans font-bold text-xs tracking-wide hover:bg-[#00d4a0] hover:text-[#0a1010] transition-all">
            Try again ↺
          </button>
        </div>
      )}

      {/* Questions */}
      <div className="flex flex-col gap-4">
        {quiz?.questions.map((q, i) => (
          <QuestionCard key={q.id} question={q} index={i} total={total}
            userAnswer={answers[q.id]} grade={grades[q.id]} revealed={!!revealed[q.id]}
            onPick={choice => pickOption(q.id, choice)}
            onSubmitSA={answer => submitSA(q, answer)} />
        ))}
      </div>
    </div>
  )
}

type OptionState = 'default' | 'correct' | 'wrong'

function OptionBtn({ letter, text, disabled, state, onClick }: {
  letter: string; text: string; disabled: boolean; state: OptionState; onClick: () => void
}) {
  const styles: Record<OptionState, string> = {
    default: 'border-[#2a3244] bg-[#1e2533] text-[#e8edf5] hover:border-[#00d4a0] hover:bg-[rgba(0,212,160,0.08)]',
    correct: 'border-[#00d4a0] bg-[rgba(0,212,160,0.12)] text-[#00d4a0]',
    wrong:   'border-[#ff5c7a] bg-[rgba(255,92,122,0.1)] text-[#ff5c7a]',
  }
  return (
    <button disabled={disabled} onClick={onClick}
      className={`flex items-start gap-3 w-full px-3 py-2.5 rounded-lg border text-sm text-left transition-all disabled:cursor-default ${styles[state]}`}>
      <span className="w-5 h-5 rounded-full bg-[#252d3d] border border-[#334060] text-[10px] font-sans font-bold text-[#7a8499] flex items-center justify-center flex-shrink-0 mt-0.5">
        {letter}
      </span>
      {text}
    </button>
  )
}

function QuestionCard({ question: q, index, total, userAnswer, grade, revealed, onPick, onSubmitSA }: {
  question: QuizQuestion; index: number; total: number; userAnswer?: string
  grade?: GradeResponse; revealed: boolean; onPick: (c: string) => void; onSubmitSA: (a: string) => void
}) {
  const [saInput, setSaInput] = useState('')
  return (
    <div className="bg-[#161b24] border border-[#2a3244] rounded-xl p-5 animate-fade-up">
      <div className="text-[10px] font-sans font-bold tracking-widest uppercase text-[#00d4a0] mb-2">Q{index + 1} of {total} · {q.difficulty}</div>
      <div className="text-[15px] font-medium leading-snug text-[#e8edf5] mb-4">{q.question}</div>

      {q.type === 'MCQ' && q.options && (
        <div className="flex flex-col gap-2">
          {Object.entries(q.options).map(([letter, text]) => (
            <OptionBtn key={letter} letter={letter} text={text} disabled={!!userAnswer}
              state={!revealed ? 'default' : letter === q.correct_answer ? 'correct' : letter === userAnswer ? 'wrong' : 'default'}
              onClick={() => onPick(letter)} />
          ))}
        </div>
      )}

      {q.type === 'True/False' && (
        <div className="flex flex-col gap-2">
          {['True', 'False'].map(val => (
            <OptionBtn key={val} letter={val[0]} text={val} disabled={!!userAnswer}
              state={!revealed ? 'default' : val === q.correct_answer ? 'correct' : val === userAnswer ? 'wrong' : 'default'}
              onClick={() => onPick(val)} />
          ))}
        </div>
      )}

      {q.type === 'Short Answer' && (
        <div className="flex flex-col gap-2">
          <textarea value={saInput} onChange={e => setSaInput(e.target.value)} disabled={!!userAnswer}
            placeholder="Write your answer here…" rows={3}
            className="w-full bg-[#1e2533] border border-[#2a3244] rounded-lg px-3 py-2.5 text-sm text-[#e8edf5] placeholder-[#4a5568] outline-none focus:border-[#00d4a0] transition-colors resize-none disabled:opacity-60" />
          {!userAnswer && (
            <button onClick={() => onSubmitSA(saInput)}
              className="self-start px-4 py-1.5 border border-[#334060] rounded-lg text-xs font-sans font-bold text-[#7a8499] hover:border-[#00d4a0] hover:text-[#00d4a0] transition-all">
              Submit answer →
            </button>
          )}
          {grade && (
            <div className="text-xs text-[#7a8499] leading-relaxed mt-1">
              <strong className="text-[#e8edf5]">Score: {grade.score}/10</strong> — {grade.feedback}
              {grade.key_points_missed?.length ? <div className="mt-1">Missed: {grade.key_points_missed.join(', ')}</div> : null}
            </div>
          )}
        </div>
      )}

      {revealed && q.explanation && (
        <div className="mt-3 p-3 bg-[rgba(255,184,77,0.07)] border border-[rgba(255,184,77,0.2)] rounded-lg text-xs text-[#ffb84d] leading-relaxed animate-fade-in">
          💡 {q.explanation}
        </div>
      )}
    </div>
  )
}