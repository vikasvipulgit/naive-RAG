import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import RetrievalPlayground from './components/RetrievalPlayground';
import ChunkInspector from './components/ChunkInspector';
import DocumentManager from './components/DocumentManager';
import PipelineVisualizer from './components/PipelineVisualizer';
import SettingsModal from './components/SettingsModal';
import { api } from './services/api';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [documents, setDocuments] = useState([]);
  const [chunks, setChunks] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    try {
      const [sData, dData, cData] = await Promise.all([
        api.getSettings(),
        api.getDocuments(),
        api.getAllChunks(),
      ]);
      setSettings(sData);
      setDocuments(dData);
      setChunks(cData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (files) => {
    setLoading(true);
    try {
      const uploaded = await api.uploadDocuments(files);
      await fetchData();
      showToast(`Successfully indexed ${uploaded.length} document(s)!`, 'success');
    } catch (err) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSamples = async () => {
    setLoading(true);
    try {
      const loaded = await api.loadSampleDocuments();
      await fetchData();
      if (loaded.length === 0) {
        showToast('Sample documents are already loaded in the knowledge base.', 'info');
      } else {
        showToast(`Loaded ${loaded.length} sample document(s)!`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to load samples', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    try {
      await api.deleteDocument(docId);
      await fetchData();
      showToast('Document removed and vector index updated.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete document', 'error');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to clear all documents and chunk vectors?')) {
      return;
    }
    setLoading(true);
    try {
      await api.clearAllDocuments();
      await fetchData();
      showToast('Knowledge base reset successfully.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to reset', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    setLoading(true);
    try {
      const updated = await api.updateSettings(newSettings);
      setSettings(updated);
      await fetchData();
      showToast('Settings saved & pipeline re-indexed.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification with Accessible Light Styling */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-xs font-medium shadow-lg border flex items-center gap-2.5 transition-all ${
            toast.type === 'success'
              ? 'bg-white text-emerald-900 border-emerald-300 ring-1 ring-emerald-400/20'
              : toast.type === 'error'
              ? 'bg-white text-rose-900 border-rose-300 ring-1 ring-rose-400/20'
              : 'bg-white text-slate-800 border-slate-300 ring-1 ring-slate-400/20'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        settings={settings}
        documentsCount={documents.length}
        chunksCount={chunks.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLoadSamples={handleLoadSamples}
        onReset={handleReset}
        loading={loading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'chat' && (
          <div className="pt-4 pb-6 px-4">
            <ChatInterface settings={settings} documentsCount={documents.length} />
          </div>
        )}

        {activeTab === 'retrieve' && (
          <RetrievalPlayground settings={settings} />
        )}

        {activeTab === 'chunks' && (
          <ChunkInspector
            chunks={chunks}
            documents={documents}
            settings={settings}
          />
        )}

        {activeTab === 'docs' && (
          <DocumentManager
            documents={documents}
            onUpload={handleUpload}
            onDelete={handleDeleteDoc}
            onLoadSamples={handleLoadSamples}
            loading={loading}
          />
        )}

        {activeTab === 'architecture' && (
          <PipelineVisualizer settings={settings} />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        loading={loading}
      />
    </div>
  );
}
