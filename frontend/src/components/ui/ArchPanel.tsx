export default function ArchPanel() {
  const steps = [
    { n: '1', label: 'User uploads PDF', desc: 'Nursing textbooks, lecture notes, clinical guidelines', tech: 'FastAPI · python-multipart' },
    { n: '2', label: 'Document loading & chunking', desc: 'PDFs parsed page-by-page, split into 800-char overlapping chunks', tech: 'PyPDFLoader · RecursiveCharacterTextSplitter' },
    { n: '3', label: 'Semantic embeddings', desc: 'Each chunk converted to a 1536-dim vector capturing its clinical meaning', tech: 'OpenAI text-embedding-ada-002' },
    { n: '4', label: 'Vector database (FAISS)', desc: 'Vectors stored locally. Top-5 most similar chunks retrieved per query', tech: 'FAISS — Facebook AI Similarity Search' },
    { n: '5', label: 'LLM generates grounded answer', desc: 'Chunks + conversation history fed to GPT. Prompt forbids outside knowledge', tech: 'GPT-3.5-turbo · LangChain LCEL pipeline' },
    { n: '6', label: 'Answer + citations returned', desc: 'Response includes document name, page number, snippet. Memory keeps last 6 turns', tech: 'HumanMessage / AIMessage' },
  ]
  const stack = [
    { name: 'Next.js 14',   desc: 'React framework, App Router, TypeScript' },
    { name: 'Tailwind CSS', desc: 'Utility-first styling, dark theme' },
    { name: 'FastAPI',      desc: 'REST API, async, auto-generated docs' },
    { name: 'LangChain',    desc: 'RAG orchestration, LCEL pipelines' },
    { name: 'FAISS',        desc: 'Local vector similarity search' },
    { name: 'OpenAI API',   desc: 'Embeddings + GPT-3.5 LLM' },
    { name: 'PyPDF',        desc: 'PDF text extraction by page' },
    { name: 'Pydantic',     desc: 'Request / response validation' },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#161b24] border border-[#2a3244] rounded-xl p-5">
        <h2 className="font-sans font-bold text-base text-[#e8edf5] mb-5">🏗 How the RAG Pipeline Works</h2>
        <div className="flex flex-col gap-2">
          {steps.map((s, i) => (
            <div key={s.n}>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1e2533] border border-[#2a3244]">
                <div className="w-6 h-6 rounded-full bg-[rgba(0,212,160,0.12)] border border-[rgba(0,212,160,0.3)] flex items-center justify-center text-[11px] font-sans font-bold text-[#00d4a0] flex-shrink-0 mt-0.5">{s.n}</div>
                <div>
                  <div className="font-sans font-bold text-sm text-[#e8edf5]">{s.label}</div>
                  <div className="text-xs text-[#7a8499] mt-0.5 leading-relaxed">{s.desc}</div>
                  <div className="text-[10px] font-sans font-semibold text-[#00d4a0] opacity-70 mt-1">{s.tech}</div>
                </div>
              </div>
              {i < steps.length - 1 && <div className="text-center text-[#4a5568] text-base my-0.5">↓</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#161b24] border border-[#2a3244] rounded-xl p-5">
        <h2 className="font-sans font-bold text-base text-[#e8edf5] mb-4">🛠 Tech Stack</h2>
        <div className="grid grid-cols-2 gap-2">
          {stack.map(t => (
            <div key={t.name} className="p-3 bg-[#1e2533] border border-[#2a3244] rounded-lg">
              <div className="font-sans font-bold text-[11px] text-[#00d4a0] mb-1">{t.name}</div>
              <div className="text-xs text-[#7a8499]">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}