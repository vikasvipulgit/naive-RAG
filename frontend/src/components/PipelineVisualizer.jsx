import React from 'react';
import { FileText, Scissors, Binary, Database, Search, Sparkles, MessageSquare } from 'lucide-react';

export default function PipelineVisualizer({ settings }) {
  const steps = [
    {
      phase: 'Phase 1: Indexing',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
      items: [
        {
          title: '1. Document Extraction',
          icon: FileText,
          desc: 'Raw text extracted from PDF, TXT, Markdown, CSV, or JSON documents.',
          detail: 'Cleans null characters while preserving document structure and line breaks.',
        },
        {
          title: '2. Sliding-Window Chunking',
          icon: Scissors,
          desc: `Splits text into fixed windows of ${settings?.chunk_size || 500} characters with ${settings?.chunk_overlap || 100} characters overlap.`,
          detail: 'Maintains word boundaries to prevent truncation of keywords.',
        },
        {
          title: '3. Vector Embedding',
          icon: Binary,
          desc: `Converts chunk strings into dense mathematical vectors using ${settings?.embedding_provider || 'Local'} embeddings.`,
          detail: 'Normalized vectors ensure dot-product directly equals cosine similarity.',
        },
        {
          title: '4. Vector Store',
          icon: Database,
          desc: 'Stores vectors along with chunk text, document ID, and character offsets.',
          detail: 'Optimized for sub-millisecond similarity scans.',
        },
      ],
    },
    {
      phase: 'Phase 2: Retrieval',
      tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      items: [
        {
          title: '5. Query Embedding',
          icon: Search,
          desc: 'User question is converted into an embedding in the same metric vector space.',
          detail: 'Identical dimension and normalization as indexed chunks.',
        },
        {
          title: '6. Cosine Similarity Search',
          icon: Binary,
          desc: `Computes dot product against stored chunks and selects top ${settings?.top_k || 4} nearest passages.`,
          detail: 'Filters out irrelevant passages below the similarity threshold.',
        },
      ],
    },
    {
      phase: 'Phase 3: Generation',
      tagColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      items: [
        {
          title: '7. Prompt Augmentation',
          icon: Sparkles,
          desc: 'Injects retrieved passages into a strict system prompt instruction.',
          detail: 'Restricts the model to answer based strictly on verified context.',
        },
        {
          title: '8. Grounded LLM Response',
          icon: MessageSquare,
          desc: `Synthesizes the answer using ${settings?.llm_provider || 'Local'} generator with verifiable citations.`,
          detail: 'Eliminates hallucinations and explicitly notes when information is absent.',
        },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Naive RAG Pipeline Architecture
        </h2>
        <p className="text-sm text-slate-600 max-w-4xl leading-relaxed">
          <strong>Naive RAG</strong> represents the foundational pattern of Retrieval-Augmented Generation.
          Unlike complex modular or agentic RAG variants that introduce query rewriting or cross-encoder re-ranking,
          Naive RAG implements a direct, transparent pipeline: <strong>Index &rarr; Retrieve &rarr; Generate</strong>.
        </p>
      </div>

      {/* Pipeline Phases */}
      <div className="space-y-6">
        {steps.map((group, gIdx) => (
          <div key={gIdx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="mb-4">
              <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md border ${group.tagColor}`}>
                {group.phase}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {group.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700 mb-3 shadow-xs">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">{item.desc}</p>
                    </div>
                    <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                      {item.detail}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Naive RAG Core Characteristics */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Key Design Principles of Naive RAG</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <strong className="text-slate-900 block mb-1 font-semibold">1. Fixed Sliding Window</strong>
            <p className="text-slate-600 leading-relaxed">
              Splits text into chunks of predefined character count with a fixed overlap. Simple, predictable, and runs without heavy linguistic parsers.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <strong className="text-slate-900 block mb-1 font-semibold">2. Single-Vector Similarity</strong>
            <p className="text-slate-600 leading-relaxed">
              Directly computes cosine distance between the user query and chunk vectors, immediately returning the top-K matches.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <strong className="text-slate-900 block mb-1 font-semibold">3. Direct Prompt Injection</strong>
            <p className="text-slate-600 leading-relaxed">
              Passes retrieved passages directly to the generator in a system prompt instruction to ground factual generation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
