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
    if (!topic.trim()) { onToast('Please enter a topic first'); return }
    setLoading(true)
    setQuiz(null); setAnswers({}); setGrades({}); setRevealed({}); setDone(false)
    try {
      const res = await api.generateQuiz({ topic, num_questions: numQ, difficulty, question_type: qType })
      setQuiz(res)
    } catch (e: any) { onToast(`Error: ${e.message}`) }
    setLoading(false)
  }

  function pick(qId: number, choice: string) {
    if (answers[qId]) return
    const next = { ...answers, [qId]: choice }
    setAnswers(next)
    setRevealed(p => ({ ...p, [qId]: true }))
    if (Object.keys(next).length === quiz!.questions.length) setDone(true)
  }

  async function submitSA(q: QuizQuestion, ans: string) {
    if (!ans.trim()) { onToast('Write an answer first'); return }
    const next = { ...answers, [q.id]: ans }
    setAnswers(next)
    try { setGrades(p => ({ ...p, [q.id]: { correct_answer: q.correct_answer, feedback: 'Grading…' } }))
      const g = await api.gradeAnswer(q, ans)
      setGrades(p => ({ ...p, [q.id]: g }))
    } catch {}
    setRevealed(p => ({ ...p, [q.id]: true }))
    if (Object.keys(next).length === quiz!.questions.length) setDone(true)
  }

  const answered = Object.keys(answers).length
  const total    = quiz?.questions.length ?? 0
  const pct      = total ? (answered / total) * 100 : 0
  const mcqTf    = quiz?.questions.filter(q => q.type !== 'Short Answer') ?? []
  const correct  = mcqTf.filter(q => (answers[q.id] ?? '').toUpperCase() === q.correct_answer.toUpperCase()).length
  const score    = mcqTf.length ? Math.round(correct / mcqTf.length * 100) : 0

  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#3a4a65', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px' }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#070b14' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '36px 40px' }}>

        <div style={{ background: '#0d1525', border: '1px solid #1a2540', borderRadius: '20px', padding: '28px 28px 24px', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '20px', fontWeight: 500, color: '#dde2ed', marginBottom: '24px' }}>
            Generate a Quiz
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Topic / Focus Area</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generate()}
                placeholder="e.g. Fluid balance, Pharmacology, ABCDE assessment, Wound care…"
                className="inp" />
            </div>

            <div>
              <label style={labelStyle}>Question Type</label>
              <select value={qType} onChange={e => setQType(e.target.value)} className="inp" style={{ cursor: 'pointer' }}>
                <option value="MCQ">Multiple Choice (MCQ)</option>
                <option value="True/False">True / False</option>
                <option value="Short Answer">Short Answer</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="inp" style={{ cursor: 'pointer' }}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Number of Questions</label>
              <input type="number" value={numQ} min={1} max={15}
                onChange={e => setNumQ(Number(e.target.value))} className="inp" />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={generate} disabled={loading} className="btn-primary" style={{ width: '100%', height: '44px' }}>
                {loading
                  ? <><div className="spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(4,26,16,0.3)', borderTopColor: '#041a10', borderRadius: '50%' }} /> Generating…</>
                  : 'Generate Quiz ✦'}
              </button>
            </div>
          </div>
        </div>

        {quiz && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>Progress</span>
              <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>{answered} / {total}</span>
            </div>
            <div style={{ height: '4px', background: '#0d1525', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#34d399', borderRadius: '99px', width: `${pct}%`, transition: 'width 0.6s ease', boxShadow: pct > 0 ? '0 0 8px rgba(52,211,153,0.4)' : 'none' }} />
            </div>
          </div>
        )}

        {done && mcqTf.length > 0 && (
          <div className="fade-up" style={{
            background: '#0d1525', borderRadius: '20px',
            border: `2px solid ${score >= 70 ? 'rgba(52,211,153,0.3)' : '#1a2540'}`,
            padding: '36px', textAlign: 'center', marginBottom: '24px',
            boxShadow: score >= 70 ? '0 0 40px rgba(52,211,153,0.06)' : 'none',
          }}>
            <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '56px', fontWeight: 500, color: score >= 70 ? '#34d399' : '#dde2ed', lineHeight: 1, marginBottom: '8px' }}>
              {score}%
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              {correct} of {mcqTf.length} correct · {score >= 70 ? '🎉 Excellent work!' : '📚 Review and try again'}
            </div>
            <button onClick={generate} className="btn-ghost">Regenerate ↺</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {quiz?.questions.map((q, i) => (
            <QCard key={q.id} q={q} index={i} total={total}
              userAnswer={answers[q.id]} grade={grades[q.id]}
              revealed={!!revealed[q.id]}
              onPick={c => pick(q.id, c)} onSA={a => submitSA(q, a)} />
          ))}
        </div>

      </div>
    </div>
  )
}

function QCard({ q, index, total, userAnswer, grade, revealed, onPick, onSA }: {
  q: QuizQuestion; index: number; total: number; userAnswer?: string
  grade?: GradeResponse; revealed: boolean; onPick: (c: string) => void; onSA: (a: string) => void
}) {
  const [sa, setSa] = useState('')

  return (
    <div className="fade-up" style={{
      background: '#0d1525', border: '1px solid #1a2540', borderRadius: '18px', padding: '24px',
      animationDelay: `${index * 50}ms`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '9px',
          background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700, color: '#34d399',
          flexShrink: 0,
        }}>{index + 1}</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="tag" style={{ fontSize: '9px' }}>{q.type}</span>
          <span className="tag" style={{ fontSize: '9px', background: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid #1a2540' }}>{q.difficulty}</span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#3a4a65' }}>{index + 1}/{total}</span>
      </div>

      <p style={{ fontSize: '15.5px', color: '#c8d0e0', lineHeight: 1.7, marginBottom: '18px', fontWeight: 400 }}>
        {q.question}
      </p>

      {q.type === 'MCQ' && q.options && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(q.options).map(([letter, text]) => {
            const isCorrect = letter === q.correct_answer
            const isChosen  = letter === userAnswer
            const s = !revealed ? 'idle' : isCorrect ? 'correct' : isChosen ? 'wrong' : 'idle'
            return (
              <button key={letter} disabled={!!userAnswer} onClick={() => onPick(letter)} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                width: '100%', padding: '12px 16px',
                borderRadius: '12px', textAlign: 'left',
                background: s === 'correct' ? 'rgba(52,211,153,0.08)' : s === 'wrong' ? 'rgba(248,113,113,0.08)' : '#0a1020',
                border: `1px solid ${s === 'correct' ? '#34d399' : s === 'wrong' ? '#f87171' : '#1a2540'}`,
                color: s === 'correct' ? '#34d399' : s === 'wrong' ? '#f87171' : '#8899aa',
                cursor: userAnswer ? 'default' : 'pointer',
                fontSize: '14px', lineHeight: 1.55,
                transition: 'all 0.15s',
              }}>
                <span style={{
                  width: '24px', height: '24px', borderRadius: '8px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  background: s === 'correct' ? '#34d399' : s === 'wrong' ? '#f87171' : '#0d1525',
                  color: s !== 'idle' ? '#fff' : '#3a4a65',
                  border: s === 'idle' ? '1px solid #1a2540' : 'none',
                }}>
                  {s === 'correct' ? '✓' : s === 'wrong' ? '✗' : letter}
                </span>
                {text}
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'True/False' && (
        <div style={{ display: 'flex', gap: '10px' }}>
          {['True', 'False'].map(val => {
            const isCorrect = val === q.correct_answer
            const isChosen  = val === userAnswer
            const s = !revealed ? 'idle' : isCorrect ? 'correct' : isChosen ? 'wrong' : 'idle'
            return (
              <button key={val} disabled={!!userAnswer} onClick={() => onPick(val)} style={{
                flex: 1, padding: '14px',
                borderRadius: '12px',
                background: s === 'correct' ? 'rgba(52,211,153,0.08)' : s === 'wrong' ? 'rgba(248,113,113,0.08)' : '#0a1020',
                border: `1px solid ${s === 'correct' ? '#34d399' : s === 'wrong' ? '#f87171' : '#1a2540'}`,
                color: s === 'correct' ? '#34d399' : s === 'wrong' ? '#f87171' : '#8899aa',
                fontSize: '14px', fontWeight: 600, fontFamily: 'Outfit, sans-serif',
                cursor: userAnswer ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}>{val}</button>
            )
          })}
        </div>
      )}

      {q.type === 'Short Answer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea value={sa} onChange={e => setSa(e.target.value)} disabled={!!userAnswer}
            placeholder="Write your clinical answer here…" rows={3}
            style={{
              width: '100%', padding: '12px 16px',
              background: '#0a1020', border: '1px solid #1a2540', borderRadius: '12px',
              fontSize: '14px', fontFamily: 'Outfit, sans-serif', color: '#c8d0e0',
              outline: 'none', resize: 'vertical', lineHeight: 1.65,
              opacity: userAnswer ? 0.6 : 1,
            }} />
          {!userAnswer && (
            <button onClick={() => onSA(sa)} className="btn-ghost" style={{ alignSelf: 'flex-start' }}>
              Submit Answer →
            </button>
          )}
          {grade && grade.feedback !== 'Grading…' && (
            <div style={{ padding: '14px 16px', background: '#0a1020', border: '1px solid #1a2540', borderRadius: '12px' }}>
              {grade.score !== undefined && (
                <div className="tag" style={{ marginBottom: '8px' }}>Score: {grade.score}/10</div>
              )}
              <div style={{ fontSize: '13.5px', color: '#8899aa', lineHeight: 1.65 }}>{grade.feedback}</div>
              {grade.key_points_missed?.length ? (
                <div style={{ fontSize: '12px', color: '#3a4a65', marginTop: '6px' }}>Missed: {grade.key_points_missed.join(' · ')}</div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {revealed && q.explanation && (
        <div className="fade-in" style={{
          marginTop: '16px', padding: '14px 16px',
          background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '12px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Explanation
          </div>
          <div style={{ fontSize: '13.5px', color: '#b8a070', lineHeight: 1.65 }}>{q.explanation}</div>
        </div>
      )}
    </div>
  )
}
