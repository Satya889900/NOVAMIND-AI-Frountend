'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../../../store/chatStore';
import { documentService } from '../../../services/document.service';
import { Document } from '../../../types/document';
import {
  Upload,
  FileText,
  FileType,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  File,
  X,
  MessageSquare,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(fileType: string) {
  if (fileType === 'application/pdf') return { icon: FileType, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' };
  if (fileType.includes('word')) return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' };
  return { icon: File, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' };
}

function getStatusBadge(status: Document['status']) {
  const styles: Record<Document['status'], { label: string; className: string; icon: React.ReactNode }> = {
    Uploaded: {
      label: 'Uploaded',
      className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
      icon: <Clock size={10} />,
    },
    Processing: {
      label: 'Processing',
      className: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
      icon: <Loader2 size={10} className="animate-spin" />,
    },
    Completed: {
      label: 'Completed',
      className: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
      icon: <CheckCircle size={10} />,
    },
    Ready: {
      label: 'Ready',
      className: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
      icon: <CheckCircle size={10} />,
    },
    Failed: {
      label: 'Failed',
      className: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
      icon: <AlertCircle size={10} />,
    },
  };
  return styles[status];
}

// ─── Upload Area Component ────────────────────────────────────────────────────

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `"${file.name}" is not supported. Only PDF, DOCX, and TXT files are allowed.`;
  }
  if (file.size > 10 * 1024 * 1024) {
    return `"${file.name}" exceeds the 10 MB size limit.`;
  }
  return null;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const router = useRouter();
  const { rooms, createRoom, selectRoom } = useChatStore();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleChatWithDocument = async (doc: Document) => {
    try {
      // Find if we already have a room with this documentId
      const existingRoom = rooms.find((r) => r.documentId === doc._id);
      if (existingRoom) {
        selectRoom(existingRoom);
        router.push('/chat');
        return;
      }

      // Create new room with documentId
      const room = await createRoom({
        name: `Chat: ${doc.originalName}`,
        isGroup: false,
        documentId: doc._id,
        participantIds: [], // backend adds user and AI bot automatically
      });
      selectRoom(room);
      router.push('/chat');
    } catch (err) {
      setGlobalError('Failed to start chat with document.');
    }
  };

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const result = await documentService.getDocuments();
      setDocuments(result.data || []);
    } catch (err) {
      setGlobalError('Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  };

  const processFiles = useCallback(async (files: File[]) => {
    const validFiles: UploadFile[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const err = validateFile(file);
      if (err) {
        errors.push(err);
      } else {
        validFiles.push({ file, progress: 0, status: 'pending' });
      }
    }

    if (errors.length > 0) {
      setGlobalError(errors.join(' '));
      return;
    }

    setGlobalError(null);
    setUploadQueue((prev) => [...prev, ...validFiles]);

    for (let i = 0; i < validFiles.length; i++) {
      const item = validFiles[i];
      const key = item.file.name + item.file.size;

      setUploadQueue((prev) =>
        prev.map((u) =>
          u.file.name + u.file.size === key ? { ...u, status: 'uploading' } : u
        )
      );

      try {
        const result = await documentService.uploadDocument(item.file, (evt) => {
          const progress = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0;
          setUploadQueue((prev) =>
            prev.map((u) =>
              u.file.name + u.file.size === key ? { ...u, progress } : u
            )
          );
        });

        setUploadQueue((prev) =>
          prev.map((u) =>
            u.file.name + u.file.size === key ? { ...u, status: 'done', progress: 100 } : u
          )
        );

        // Add to documents list
        setDocuments((prev) => [result.data, ...prev]);

        // Auto-remove completed item from queue after 2.5s
        setTimeout(() => {
          setUploadQueue((prev) =>
            prev.filter((u) => !(u.file.name + u.file.size === key && u.status === 'done'))
          );
        }, 2500);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Upload failed.';
        setUploadQueue((prev) =>
          prev.map((u) =>
            u.file.name + u.file.size === key ? { ...u, status: 'error', error: msg } : u
          )
        );
      }
    }
  }, []);

  // ─── Drag & Drop handlers ───────────────────────────────────────────────────
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) processFiles(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) processFiles(files);
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await documentService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      setGlobalError('Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const removeQueueItem = (key: string) => {
    setUploadQueue((prev) => prev.filter((u) => u.file.name + u.file.size !== key));
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Document Library
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Upload PDF, DOCX, or TXT files and chat with them using AI-powered Retrieval-Augmented Generation (RAG).
          </p>
        </div>

        {/* Global Error */}
        {globalError && (
          <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-sm text-rose-700 dark:text-rose-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="flex-1">{globalError}</span>
            <button onClick={() => setGlobalError(null)} className="cursor-pointer opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 group ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 bg-white dark:bg-slate-900/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            isDragging
              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 scale-110'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 group-hover:text-indigo-500'
          }`}>
            <Upload size={28} />
          </div>

          <div className="text-center">
            <p className={`text-base font-semibold transition-colors duration-200 ${
              isDragging ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
            }`}>
              {isDragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Supports PDF, DOCX, TXT · Max 10 MB per file
            </p>
          </div>
        </div>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Uploading
            </h2>
            <div className="space-y-2">
              {uploadQueue.map((item) => {
                const key = item.file.name + item.file.size;
                const { icon: Icon, color, bg } = getFileIcon(item.file.type);
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon size={16} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.file.name}
                      </p>
                      {item.status === 'uploading' && (
                        <div className="mt-1.5 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {item.status === 'done' && (
                        <p className="text-[10px] text-emerald-500 font-medium mt-0.5">Uploaded & processed ✓</p>
                      )}
                      {item.status === 'error' && (
                        <p className="text-[10px] text-rose-500 font-medium mt-0.5">{item.error}</p>
                      )}
                      {item.status === 'pending' && (
                        <p className="text-[10px] text-slate-400 mt-0.5">Queued…</p>
                      )}
                    </div>
                    {item.status !== 'uploading' && (
                      <button
                        onClick={() => removeQueueItem(key)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {item.status === 'uploading' && (
                      <Loader2 size={16} className="text-indigo-500 animate-spin shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Your Documents
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {documents.length} file{documents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="text-indigo-500 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4">
                <FileText size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No documents yet
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Upload your first document above to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const { icon: Icon, color, bg } = getFileIcon(doc.fileType);
                const badge = getStatusBadge(doc.status);
                return (
                  <div
                    key={doc._id}
                    onClick={() => doc.storagePath && window.open(doc.storagePath, '_blank')}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors group cursor-pointer"
                  >
                    {/* File Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon size={18} className={color} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {doc.originalName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {formatBytes(doc.fileSize)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(doc.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.className}`}>
                      {badge.icon}
                      {badge.label}
                    </span>

                    {/* Chat with Document Button */}
                    {doc.status === 'Ready' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChatWithDocument(doc);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Chat with Document (RAG)"
                      >
                        <MessageSquare size={14} />
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc._id);
                      }}
                      disabled={deletingId === doc._id}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer disabled:opacity-50"
                      title="Delete document"
                    >
                      {deletingId === doc._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notice Banner */}
        <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
          <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
            i
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Document RAG is Active!</p>
            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-0.5">
              Your documents are chunked and embedded. Click the chat icon on any "Ready" document to start a conversation and ask questions about its content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
