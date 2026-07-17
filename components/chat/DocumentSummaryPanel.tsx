'use client';

import React, { useState, useEffect } from 'react';
import { documentService } from '../../services/document.service';
import { Document } from '../../types/document';
import { X, FileText, Loader2, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';

interface DocumentSummaryPanelProps {
  documentId: string;
  onAskQuestion: (question: string) => void;
  onClose: () => void;
}

export function DocumentSummaryPanel({ documentId, onAskQuestion, onClose }: DocumentSummaryPanelProps) {
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await documentService.getDocumentById(documentId);
        if (res.success && res.data) {
          setDoc(res.data);
        } else {
          setError('Failed to load document details');
        }
      } catch (err: any) {
        console.error('Error fetching document details:', err);
        setError(err.response?.data?.message || 'Failed to fetch document summary');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDocDetails();
    }
  }, [documentId]);

  if (loading) {
    return (
      <div className="w-80 sm:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full flex flex-col items-center justify-center p-6 shrink-0 relative animate-in slide-in-from-right duration-200">
        <Loader2 size={24} className="text-indigo-500 animate-spin mb-2" />
        <span className="text-xs text-slate-400 dark:text-slate-500">Analyzing document summary...</span>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="w-80 sm:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full flex flex-col p-4 shrink-0 relative animate-in slide-in-from-right duration-200">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-350">Document Details</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <p className="text-xs text-rose-500 font-semibold mb-1">Could not load summary</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-[200px] leading-relaxed">{error || 'No document details found.'}</p>
        </div>
      </div>
    );
  }

  const isDocReady = doc.status === 'Ready';

  return (
    <div className="w-80 sm:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 backdrop-blur h-full flex flex-col shrink-0 relative animate-in slide-in-from-right duration-200 z-10 shadow-2xl shadow-slate-200/20 dark:shadow-none">
      {/* Panel Header */}
      <div className="px-4 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={18} className="text-indigo-500 shrink-0 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate pr-1" title={doc.originalName}>
            {doc.originalName}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
          title="Close summary"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-5 sm:gap-6 custom-scrollbar">
        {/* If document is still processing */}
        {!isDocReady ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <Loader2 size={24} className="text-indigo-500 animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-250">
              Document Status: {doc.status}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[220px] leading-relaxed">
              We are currently parsing and indexing the document content. The AI summary will display automatically when complete.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Section */}
            {doc.summary && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles size={11} className="shrink-0" />
                  AI Document Summary
                </span>
                <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                  {doc.summary}
                </div>
              </div>
            )}

            {/* Key Takeaways */}
            {doc.keyTakeaways && doc.keyTakeaways.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={11} className="shrink-0" />
                  Key Takeaways
                </span>
                <ul className="flex flex-col gap-2.5 pl-0.5">
                  {doc.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex gap-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-350">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-450 shrink-0 mt-1.5" />
                      <span className="font-medium">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Questions */}
            {doc.suggestedQuestions && doc.suggestedQuestions.length > 0 && (
              <div className="flex flex-col gap-3 mt-auto">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <HelpCircle size={11} className="shrink-0" />
                  Suggested Questions
                </span>
                <div className="flex flex-col gap-2 w-full">
                  {doc.suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAskQuestion(q)}
                      className="w-full text-left text-xs sm:text-sm font-semibold px-3.5 py-2.5 bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-800/60 dark:hover:bg-indigo-950/20 text-slate-650 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-800 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-[0.98] leading-snug"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
