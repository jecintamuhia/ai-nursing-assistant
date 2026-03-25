const steps = [
  { n: '01', label: 'PDF Upload',          desc: 'Nursing textbooks, lecture notes, and clinical guidelines uploaded through the interface.',              tech: 'FastAPI · python-multipart' },
  { n: '02', label: 'Document Processing', desc: 'PDFs parsed page by page and split into 800-character overlapping chunks to preserve full context.',     tech: 'PyPDFLoader · RecursiveCharacterTextSplitter' },
  { n: '03', label: 'Semantic Embedding',  desc: 'Each chunk transformed into a 1536-dimensional vector capturing its clinical meaning.',                  tech: 'OpenAI text-embedding-ada-002' },
  { n: '04', label: 'Vector Storage',      desc: 'Vectors stored in a local FAISS index. At query time, the top-5 most similar chunks are retrieved.',     tech: 'FAISS — Facebook AI Similarity Search' },
  { n: '05', label: 'LLM Reasoning',       desc: 'Retrieved chunks and conversation history sent to GPT. System prompt strictly forbids outside knowledge.', tech: 'GPT-3.5-turbo · LangChain LCEL pipeline' },
  { n: '06', label: 'Cited Answer',        desc: 'Response includes document name, page number, and source snippet for every factual claim made.',          tech: 'ConversationBufferWindowMemory' },
]

const stack = [
  { name: 'Next.js 14',   desc: 'App Router, TypeScript, SSR' },
  { name: 'Tailwind CSS', desc: 'Utility-first styling' },
  { name: 'FastAPI',      desc: 'Async REST, auto docs' },
  { name: 'LangChain',    desc: 'LCEL pipelines, RAG' },
  { name: 'FAISS',        desc: 'Local vector similarity search' },
  { name: 'OpenAI',       desc: 'Embeddings + GPT-3.5' },
  { name: 'PyPDF',        desc: 'PDF text extraction' },
  { name: 'Pydantic',     desc: 'Schema validation' },
]

const endpoints = [
  { method: 'POST', path: '/api/documents/upload', desc: 'Upload PDF & ingest' },
  { method: 'POST', path: '/api/documents/ingest', desc: 'Re-index all PDFs' },
  { method: 'GET',  path: '/api/documents/',       desc: 'List uploaded PDFs' },
  { method: 'POST', path: '/api/chat/ask',         desc: 'Ask a question (RAG)' },
  { method: 'DEL',  path: '/api/chat/memory',      desc: 'Clear conversation' },
  { method: 'POST', path: '/api/quiz/generate',    desc: 'Generate quiz' },
  { method: 'POST', path: '/api/quiz/grade',       desc: 'Grade short answer' },
  { method: 'GET',  path: '/api/status',           desc: 'System status' },
]

export default function ArchPanel() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#070b14' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        <div>
          <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '24px', fontWeight: 500, color: '#dde2ed', letterSpacing: '-0.01em', marginBottom: '10px' }}>
            System Architecture
          </h1>
          <p style={{ fontSize: '14.5px', color: '#64748b', lineHeight: 1.7 }}>
            A Retrieval-Augmented Generation (RAG) pipeline where every answer is grounded exclusively in your uploaded nursing documents.
          </p>
        </div>

        <div>
          <div className="label" style={{ marginBottom: '14px' }}>RAG Pipeline</div>
          <div style={{ background: '#0d1525', border: '1px solid #1a2540', borderRadius: '18px', overflow: 'hidden' }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{
                display: 'flex', alignItems: 'flex-start', gap: '18px',
                padding: '18px 22px',
                background: i % 2 === 0 ? '#0d1525' : '#0a1020',
                borderBottom: i < steps.length - 1 ? '1px solid #1a2540' : 'none',
              }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
                  background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, color: '#34d399',
                }}>{s.n}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#dde2ed' }}>{s.label}</span>
                    <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#34d399', opacity: 0.6 }}>{s.tech}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="label" style={{ marginBottom: '14px' }}>Technology Stack</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
            {stack.map((t, i) => (
              <div key={t.name} className="fade-up" style={{
                padding: '14px 16px',
                background: '#0d1525', border: '1px solid #1a2540', borderRadius: '14px',
                animationDelay: `${i * 40}ms`,
              }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>{t.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="label" style={{ marginBottom: '14px' }}>API Reference</div>
          <div style={{ background: '#0d1525', border: '1px solid #1a2540', borderRadius: '18px', overflow: 'hidden', fontFamily: 'JetBrains Mono, monospace' }}>
            {endpoints.map((e, i) => {
              const color = e.method === 'GET' ? '#34d399' : e.method === 'DEL' ? '#f87171' : '#fbbf24'
              const bg    = e.method === 'GET' ? 'rgba(52,211,153,0.08)' : e.method === 'DEL' ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)'
              return (
                <div key={e.path} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '12px 20px',
                  background: i % 2 === 0 ? '#0d1525' : '#0a1020',
                  borderBottom: i < endpoints.length - 1 ? '1px solid #1a2540' : 'none',
                }}>
                  <span style={{ minWidth: '44px', padding: '3px 0', borderRadius: '6px', textAlign: 'center', fontSize: '10px', fontWeight: 700, background: bg, color, flexShrink: 0 }}>
                    {e.method}
                  </span>
                  <span style={{ fontSize: '12px', color: '#c8d0e0', flex: 1 }}>{e.path}</span>
                  <span style={{ fontSize: '11.5px', color: '#3a4a65', whiteSpace: 'nowrap' }}>{e.desc}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
