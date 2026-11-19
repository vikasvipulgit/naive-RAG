import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
  Zap,
  Code2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';

export default function ChatInterface({ settings, documentsCount }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const [expandedPrompts, setExpandedPrompts] = useState({});
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    'Who was the commander of Apollo 11 and who stepped on the moon?',
    'What are the limitations of Large Language Models?',
    'What are the three stages of Naive RAG?',
    'How much lunar rock and soil did Armstrong and Aldrin collect?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (userQuestion = input) => {
    if (!userQuestion.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: userQuestion,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.queryRag(
        userQuestion,
        settings?.top_k || 4,
        settings?.similarity_threshold || 0.0,
        compareMode
      );

      const botMsg = {
        role: 'assistant',
        content: response.answer,
        contentWithoutRag: response.answer_without_rag,
        retrievedChunks: response.retrieved_chunks,
        augmentedPrompt: response.augmented_prompt,
        latencyMs: response.latency_ms,
        embeddingProvider: response.embedding_provider,
        llmProvider: response.llm_provider,
        llmModel: response.llm_model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: err.message || 'An error occurred while generating the answer.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = (idx) => {
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const togglePrompt = (idx) => {
    setExpandedPrompts((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopy = (idx, text) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Top Banner & Compare Toggle */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-800">Grounded Q&A Generation</span>
          {documentsCount === 0 && (
            <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              No documents indexed yet
            </span>
          )}
        </div>

        {/* Compare Toggle (Accessible & Clean) */}
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-8 h-4 rounded-full transition-colors relative ${
                compareMode ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                  compareMode ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-slate-700 font-medium">Compare with Blind LLM (No Context)</span>
          </label>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Naive RAG Knowledge Assistant</h3>
            <p className="text-xs text-slate-600 max-w-md mb-6 leading-relaxed">
              Ask questions about any uploaded documents. The Naive RAG pipeline retrieves the most relevant passages and grounds the generated answer with verified citations.
            </p>

            {/* Suggested Prompts */}
            <div className="w-full max-w-lg space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Suggested Questions
              </span>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 transition-colors flex items-center justify-between group"
                >
                  <span>{q}</span>
                  <span className="text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            if (msg.role === 'user') {
              return (
                <div key={idx} className="flex justify-end">
                  <div className="max-w-2xl bg-blue-600 text-white rounded-xl rounded-tr-xs px-4 py-3 shadow-xs">
                    <div className="flex items-center justify-between gap-4 mb-1 text-[11px] text-blue-100">
                      <span className="font-semibold flex items-center gap-1">
                        <User className="w-3 h-3" /> You
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            }

            if (msg.role === 'error') {
              return (
                <div key={idx} className="flex justify-start">
                  <div className="max-w-2xl bg-rose-50 border border-rose-200 text-rose-900 rounded-xl px-4 py-3 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold mb-1 text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Error Processing Request</span>
                    </div>
                    <p>{msg.content}</p>
                  </div>
                </div>
              );
            }

            // Assistant Response
            return (
              <div key={idx} className="flex justify-start">
                <div className="max-w-3xl w-full bg-slate-50 border border-slate-200 rounded-xl rounded-tl-xs p-5 shadow-xs">
                  {/* Message Meta Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-slate-900">Grounded Answer</span>
                      <span className="text-[11px] text-slate-500">&middot; {msg.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>{msg.latencyMs}ms</span>
                      </div>
                      <button
                        onClick={() => handleCopy(idx, msg.content)}
                        className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-200 transition-colors"
                        title="Copy answer"
                        aria-label="Copy answer"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Comparison View */}
                  {msg.contentWithoutRag ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Left: Naive RAG Grounded Answer */}
                      <div className="bg-white border border-blue-200 rounded-lg p-3.5 shadow-xs">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-2">
                          <Check className="w-3.5 h-3.5" />
                          <span>Naive RAG (With Retrieved Context)</span>
                        </div>
                        <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>

                      {/* Right: Direct LLM Without Context */}
                      <div className="bg-white border border-amber-200 rounded-lg p-3.5 shadow-xs">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Blind LLM (Zero Context)</span>
                        </div>
                        <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {msg.contentWithoutRag}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Standard Single Grounded Answer */
                    <div className="text-xs sm:text-sm text-slate-900 leading-relaxed whitespace-pre-wrap mb-4 font-normal">
                      {msg.content}
                    </div>
                  )}

                  {/* Retrieved Chunks Accordion */}
                  {msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
                    <div className="mt-3 border-t border-slate-200 pt-2">
                      <button
                        onClick={() => toggleSource(idx)}
                        className="flex items-center justify-between w-full text-xs text-slate-700 hover:text-slate-900 py-1 transition-colors font-medium"
                      >
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Retrieved Context ({msg.retrievedChunks.length} Chunks Used)</span>
                        </span>
                        {expandedSources[idx] ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>

                      {expandedSources[idx] && (
                        <div className="space-y-2 mt-2 pt-1">
                          {msg.retrievedChunks.map((item, cIdx) => (
                            <div
                              key={cIdx}
                              className="bg-white rounded-lg p-3 border border-slate-200 text-xs shadow-xs"
                            >
                              <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-600 font-mono">
                                <span className="font-semibold text-slate-900">
                                  #{item.rank} {item.chunk.filename} (Chunk #{item.chunk.chunk_index + 1})
                                </span>
                                <span className="text-blue-700 font-semibold">
                                  Sim: {item.similarity_score.toFixed(4)}
                                </span>
                              </div>
                              <p className="text-slate-700 font-mono text-[11px] leading-relaxed whitespace-pre-wrap bg-slate-50 p-2 rounded border border-slate-100">
                                {item.chunk.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raw Augmented Prompt Inspector */}
                  {msg.augmentedPrompt && (
                    <div className="mt-2 border-t border-slate-200 pt-2">
                      <button
                        onClick={() => togglePrompt(idx)}
                        className="flex items-center justify-between w-full text-xs text-slate-600 hover:text-slate-800 py-1 transition-colors"
                      >
                        <span className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Code2 className="w-3 h-3 text-slate-500" />
                          <span>Inspect Raw Augmented Prompt (Injected Context + System Instructions)</span>
                        </span>
                        {expandedPrompts[idx] ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>

                      {expandedPrompts[idx] && (
                        <div className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                          {msg.augmentedPrompt}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Spinner Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 border border-slate-200 rounded-xl rounded-tl-xs p-3.5 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-600">
                Retrieving nearest vector passages & synthesizing answer...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <div className="bg-slate-50 border-t border-slate-200 p-3.5 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            aria-label="Ask a question grounded in your documents"
            placeholder={
              documentsCount === 0
                ? 'Tip: Click "Load Samples" or upload documents first...'
                : 'Ask a question grounded in your documents...'
            }
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm disabled:opacity-50"
          />
          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="flex items-center justify-center p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
