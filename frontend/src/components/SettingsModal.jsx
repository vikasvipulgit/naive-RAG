import React, { useState, useEffect } from 'react';
import { X, Sliders, Key, Check, RefreshCw } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, onSave, loading }) {
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(100);
  const [topK, setTopK] = useState(4);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.0);
  const [embeddingProvider, setEmbeddingProvider] = useState('local');
  const [llmProvider, setLlmProvider] = useState('local');
  const [llmModel, setLlmModel] = useState('gemini-2.5-flash');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setChunkSize(settings.chunk_size || 500);
      setChunkOverlap(settings.chunk_overlap || 100);
      setTopK(settings.top_k || 4);
      setSimilarityThreshold(settings.similarity_threshold || 0.0);
      setEmbeddingProvider(settings.embedding_provider || 'local');
      setLlmProvider(settings.llm_provider || 'local');
      setLlmModel(settings.llm_model || 'gemini-2.5-flash');
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatePayload = {
      chunk_size: chunkSize,
      chunk_overlap: chunkOverlap,
      top_k: topK,
      similarity_threshold: similarityThreshold,
      embedding_provider: embeddingProvider,
      llm_provider: llmProvider,
      llmModel: llmModel,
    };
    if (geminiApiKey.trim()) {
      updatePayload.gemini_api_key = geminiApiKey.trim();
    }
    if (openaiApiKey.trim()) {
      updatePayload.openai_api_key = openaiApiKey.trim();
    }

    await onSave(updatePayload);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-900">Pipeline Settings</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings dialog"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs text-slate-700">
          {/* Section 1: Chunking Hyperparameters */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              1. Sliding-Window Chunking Parameters
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex justify-between mb-1.5">
                  <span className="font-medium text-slate-900">Chunk Size (chars)</span>
                  <span className="font-mono text-blue-700 font-semibold">{chunkSize}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(parseInt(e.target.value))}
                  aria-label="Chunk size slider"
                  className="w-full accent-blue-600"
                />
                <span className="text-[11px] text-slate-500 block mt-1">Character length of each chunk window.</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex justify-between mb-1.5">
                  <span className="font-medium text-slate-900">Chunk Overlap (chars)</span>
                  <span className="font-mono text-blue-700 font-semibold">{chunkOverlap}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.min(chunkSize - 50, 500)}
                  step="25"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                  aria-label="Chunk overlap slider"
                  className="w-full accent-blue-600"
                />
                <span className="text-[11px] text-slate-500 block mt-1">Overlapping characters between adjacent chunks.</span>
              </div>
            </div>
          </div>

          {/* Section 2: Retrieval Hyperparameters */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              2. Vector Retrieval Parameters
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex justify-between mb-1.5">
                  <span className="font-medium text-slate-900">Top-K Chunks</span>
                  <span className="font-mono text-blue-700 font-semibold">{topK}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  aria-label="Top-K slider"
                  className="w-full accent-blue-600"
                />
                <span className="text-[11px] text-slate-500 block mt-1">Number of nearest passages passed to generator.</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex justify-between mb-1.5">
                  <span className="font-medium text-slate-900">Min Similarity</span>
                  <span className="font-mono text-blue-700 font-semibold">{similarityThreshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.8"
                  step="0.05"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                  aria-label="Minimum similarity slider"
                  className="w-full accent-blue-600"
                />
                <span className="text-[11px] text-slate-500 block mt-1">Cosine cutoff threshold for chunk matches.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Providers & API Keys */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              3. Models & Provider Setup
            </h4>

            {/* Embedding Provider */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
              <label className="font-medium text-slate-900 block">Embedding Provider</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'local', label: 'Local (Offline)', desc: 'Zero API keys required' },
                  { id: 'gemini', label: 'Google Gemini', desc: 'text-embedding-004' },
                  { id: 'openai', label: 'OpenAI', desc: 'text-embedding-3-small' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setEmbeddingProvider(p.id)}
                    className={`p-2.5 rounded-md border text-left transition-colors ${
                      embeddingProvider === p.id
                        ? 'border-blue-600 bg-white ring-1 ring-blue-600 text-blue-900 font-medium'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs">{p.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* LLM Provider */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
              <label className="font-medium text-slate-900 block">LLM Synthesis Provider</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'local', label: 'Local Extractive', desc: 'Runs offline' },
                  { id: 'gemini', label: 'Google Gemini', desc: 'gemini-2.5-flash' },
                  { id: 'openai', label: 'OpenAI', desc: 'gpt-4o-mini' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setLlmProvider(p.id)}
                    className={`p-2.5 rounded-md border text-left transition-colors ${
                      llmProvider === p.id
                        ? 'border-blue-600 bg-white ring-1 ring-blue-600 text-blue-900 font-medium'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs">{p.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* API Keys */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="flex items-center justify-between text-xs text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    <span>Gemini API Key</span>
                  </span>
                  {settings?.has_gemini_key && (
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      Active Key Configured
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder={settings?.has_gemini_key ? '••••••••••••••••••••' : 'AIzaSy...'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  aria-label="Gemini API Key"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 shadow-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-xs text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    <span>OpenAI API Key</span>
                  </span>
                  {settings?.has_openai_key && (
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      Active Key Configured
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder={settings?.has_openai_key ? '••••••••••••••••••••' : 'sk-...'}
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  aria-label="OpenAI API Key"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 shadow-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons: Primary & Secondary */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            {/* Secondary Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-colors"
            >
              Cancel
            </button>
            {/* Primary Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved & Re-indexed!</span>
                </>
              ) : loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Re-indexing...</span>
                </>
              ) : (
                <span>Save & Re-index</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
