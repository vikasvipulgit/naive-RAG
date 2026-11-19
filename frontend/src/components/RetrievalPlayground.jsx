import React, { useState } from 'react';
import { Search, Zap, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function RetrievalPlayground({ settings }) {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(settings?.top_k || 4);
  const [threshold, setThreshold] = useState(settings?.similarity_threshold || 0.0);
  const [results, setResults] = useState(null);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sampleQueries = [
    'Who was the commander of Apollo 11?',
    'What are the limitations of Large Language Models?',
    'What module landed on the lunar surface in Mare Tranquillitatis?',
    'How does Naive RAG solve hallucinations?',
  ];

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.retrieveChunks(searchQuery, topK, threshold);
      setResults(data.results);
      setLatency(data.latency_ms);
    } catch (err) {
      setError(err.message || 'Retrieval failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Search Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <span>Vector Similarity Search Playground</span>
          <span className="text-xs font-normal text-slate-500">(Cosine Metric: sim(q, d) = q &middot; d)</span>
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Test the vector retrieval stage independently. The query embedding is compared against all indexed chunk vectors to retrieve nearest passages.
        </p>

        {/* Search Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-2 mb-4"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter search query to retrieve nearest vector chunks..."
              aria-label="Query text for vector search"
              className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          {/* Primary Button */}
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{loading ? 'Searching...' : 'Retrieve Vectors'}</span>
          </button>
        </form>

        {/* Example Query Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 text-[11px] font-medium">Examples:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(q);
                handleSearch(q);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors text-[11px]"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Hyperparameter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div>
            <div className="flex justify-between text-slate-700 mb-1">
              <span className="font-medium">Top-K Chunks to Retrieve</span>
              <span className="font-mono font-semibold text-blue-700">{topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              aria-label="Top-K Chunks slider"
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-700 mb-1">
              <span className="font-medium">Min Similarity Score Threshold</span>
              <span className="font-mono font-semibold text-blue-700">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              aria-label="Similarity Threshold slider"
              className="w-full accent-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Latency & Result Count */}
      {results && (
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Retrieved <strong>{results.length}</strong> matching chunk(s)</span>
          </div>
          {latency !== null && (
            <div className="flex items-center gap-1 font-mono text-slate-600">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Latency: <strong>{latency} ms</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Empty State */}
      {results && results.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs shadow-sm">
          No chunks met the similarity threshold ({threshold}). Try lowering the threshold or asking about indexed topics.
        </div>
      )}

      {/* Results List */}
      {results && results.length > 0 && (
        <div className="space-y-4">
          {results.map((item) => {
            const scorePercent = Math.max(0, Math.min(100, Math.round(item.similarity_score * 100)));
            return (
              <div
                key={item.chunk.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-colors"
              >
                {/* Score bar & Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-xs flex items-center justify-center">
                      #{item.rank}
                    </span>
                    <span className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      {item.chunk.filename} (Chunk #{item.chunk.chunk_index + 1})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">Cosine Similarity:</span>
                      <span className="text-xs font-mono font-semibold text-slate-900">
                        {item.similarity_score.toFixed(4)}
                      </span>
                    </div>
                    {/* Visual Meter (High Contrast) */}
                    <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Chunk text */}
                <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {item.chunk.text}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
