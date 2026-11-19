import React from 'react';
import { Layers, Database, Sliders, RefreshCw, Trash2, Cpu, Sparkles, BookOpen } from 'lucide-react';

export default function Header({
  settings,
  documentsCount,
  chunksCount,
  onOpenSettings,
  onLoadSamples,
  onReset,
  loading,
  activeTab,
  setActiveTab,
}) {
  const tabs = [
    { id: 'chat', label: 'Chat & Generation' },
    { id: 'retrieve', label: 'Vector Retrieval' },
    { id: 'chunks', label: 'Chunk Inspector' },
    { id: 'docs', label: 'Documents' },
    { id: 'architecture', label: 'Architecture' },
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-slate-900 tracking-tight">Naive RAG Studio</h1>
                <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded-md">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500">Fixed-window chunking &middot; Vector retrieval &middot; Prompt augmentation</p>
            </div>
          </div>

          {/* Quick Metrics Bar (High Contrast, Accessible) */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Docs:</span>
              <strong className="text-slate-900 font-semibold">{documentsCount}</strong>
            </div>
            <div className="w-[1px] h-3.5 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Chunks:</span>
              <strong className="text-slate-900 font-semibold">{chunksCount}</strong>
            </div>
            <div className="w-[1px] h-3.5 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span>Embed:</span>
              <span className="font-semibold text-slate-800 capitalize">{settings?.embedding_provider || 'Local'}</span>
            </div>
            <div className="w-[1px] h-3.5 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>LLM:</span>
              <span className="font-semibold text-slate-800 capitalize">{settings?.llm_provider || 'Local'}</span>
            </div>
          </div>

          {/* Primary & Secondary Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Secondary Button */}
            <button
              onClick={onLoadSamples}
              disabled={loading}
              title="Load sample articles about AI and Apollo 11"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Load Samples</span>
            </button>

            {/* Danger / Reset Button */}
            <button
              onClick={onReset}
              disabled={loading || (documentsCount === 0 && chunksCount === 0)}
              title="Clear all documents and vectors"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-700 bg-white hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            {/* Primary Button */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation (Modern Segmented Style) */}
        <div className="flex space-x-1 border-t border-slate-100 py-2 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
