import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Sparkles, Clock, Hash } from 'lucide-react';

export default function DocumentManager({
  documents,
  onUpload,
  onDelete,
  onLoadSamples,
  loading,
}) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.markdown,.pdf,.json,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Upload className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Upload Documents to Knowledge Base
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-4">
            Drag and drop files here, or click to browse. Supports PDF, TXT, Markdown, CSV, and JSON files.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              PDF
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              Plain Text & Markdown
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              CSV & JSON
            </span>
          </div>
        </div>
      </div>

      {/* Header & Sample Document Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Indexed Documents</h3>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200 text-slate-800">
            {documents.length}
          </span>
        </div>
        <button
          onClick={onLoadSamples}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Load Pre-built Sample Documents</span>
        </button>
      </div>

      {/* Empty State */}
      {documents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900 mb-1">No documents indexed yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Upload your files above, or click below to load pre-built sample articles about Apollo 11 and Artificial Intelligence.
          </p>
          <button
            onClick={onLoadSamples}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
          >
            Load Sample Documents
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 truncate" title={doc.filename}>
                        {doc.filename}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{doc.created_at}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDelete(doc.id)}
                    title="Delete document"
                    aria-label={`Delete ${doc.filename}`}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content Preview */}
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 mb-3">
                  <p className="text-xs text-slate-600 font-mono line-clamp-2 italic">
                    "{doc.content_preview}"
                  </p>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100 text-slate-600">
                <div className="flex items-center gap-2 font-medium">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.chunk_count} Chunks</span>
                  </span>
                  <span>&middot;</span>
                  <span>{doc.char_count.toLocaleString()} chars</span>
                </div>
                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Indexed
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
