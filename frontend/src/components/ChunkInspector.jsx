import React, { useState, useMemo } from 'react';
import { Scissors, Filter, Search, Copy, Check, FileText } from 'lucide-react';

export default function ChunkInspector({ chunks, documents, settings }) {
  const [selectedDoc, setSelectedDoc] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const filteredChunks = useMemo(() => {
    return chunks.filter((c) => {
      const matchDoc = selectedDoc === 'all' || c.doc_id === selectedDoc;
      const matchSearch =
        searchQuery === '' ||
        c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.filename.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDoc && matchSearch;
    });
  }, [chunks, selectedDoc, searchQuery]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Educational Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Fixed-Window Chunk Inspector</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Documents are sliced into windows of <strong className="text-slate-900">{settings?.chunk_size || 500}</strong> characters with a <strong className="text-slate-900">{settings?.chunk_overlap || 100}</strong> character sliding overlap.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium">
            Total Chunks: <strong className="text-slate-900 font-semibold">{chunks.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedDoc}
            onChange={(e) => setSelectedDoc(e.target.value)}
            aria-label="Filter chunks by document"
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 shadow-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Documents ({documents.length})</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.filename} ({d.chunk_count} chunks)
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search chunk content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Chunks List */}
      {filteredChunks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs shadow-sm">
          No chunks found matching the filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChunks.map((chunk) => {
            const isOverlap = chunk.chunk_index > 0 && settings?.chunk_overlap > 0;
            return (
              <div
                key={chunk.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors"
              >
                {/* Chunk Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Chunk #{chunk.chunk_index + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      {chunk.filename}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                    <span>
                      Offsets: <strong>{chunk.start_char}</strong> &rarr; <strong>{chunk.end_char}</strong> ({chunk.char_length} chars)
                    </span>
                    <span>&middot;</span>
                    <span>~{chunk.token_estimate} tokens</span>
                    <button
                      onClick={() => handleCopy(chunk.id, chunk.text)}
                      title="Copy chunk text"
                      aria-label="Copy chunk text"
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                    >
                      {copiedId === chunk.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Overlap Indicator */}
                {isOverlap && (
                  <div className="mb-2.5 text-[11px] text-blue-900 bg-blue-50/70 border border-blue-200 rounded px-2.5 py-1 flex items-center justify-between">
                    <span>Sliding window overlap with previous chunk: ~{settings?.chunk_overlap} characters</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">Context Preserved</span>
                  </div>
                )}

                {/* Chunk Text */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {chunk.text}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
