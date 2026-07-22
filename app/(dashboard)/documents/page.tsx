'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../../../store/chatStore';
import { useUiStore } from '../../../store/uiStore';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../hooks/useAuth';
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
  Star,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function isImage(fileType: string) {
  return fileType.startsWith('image/');
}

function isPdf(fileType: string) {
  return fileType === 'application/pdf';
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

// ─── Upload File Interface ────────────────────────────────────────────────────

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

// ─── PDF Placeholder Card ─────────────────────────────────────────────────────

function PdfCard({ doc, onStar, onDelete, onChat, isDeleting }: {
  doc: Document;
  onStar: (doc: Document, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onChat?: (doc: Document, e: React.MouseEvent) => void;
  isDeleting: boolean;
}) {
  const badge = getStatusBadge(doc.status);

  return (
    <div
      onClick={() => doc.storagePath && window.open(doc.storagePath, '_blank')}
      className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-rose-300 dark:hover:border-rose-700/50 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-200 cursor-pointer"
    >
      {/* PDF Preview area */}
      <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20 h-40 gap-2">
        {/* Large PDF icon */}
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center shadow-md">
          <FileType size={26} className="text-rose-500" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 dark:text-rose-500">PDF</span>

        {/* Open icon overlay on hover */}
        <div className="absolute inset-0 bg-rose-900/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 rounded-t-2xl">
          <ExternalLink size={22} className="text-white drop-shadow" />
        </div>

        {/* Star button */}
        <button
          onClick={(e) => onStar(doc, e)}
          className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all ${
            doc.isStarred
              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
              : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 bg-white/80 dark:bg-slate-800/80'
          }`}
          title={doc.isStarred ? 'Unstar (document will be protected from auto-delete)' : 'Star to protect from auto-delete'}
        >
          <Star size={13} className={doc.isStarred ? 'fill-current' : ''} />
        </button>

        {/* Starred badge */}
        {doc.isStarred && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 rounded-full px-1.5 py-0.5">
            <Star size={9} className="fill-current" />
            <span className="text-[9px] font-bold">Protected</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate" title={doc.originalName}>
          {doc.originalName}
        </p>
        <div className="flex items-center justify-between gap-1">
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${badge.className}`}>
            {badge.icon}
            {badge.label}
          </span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500">{formatBytes(doc.fileSize)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-0.5">
          {doc.status === 'Ready' && onChat && (
            <button
              onClick={(e) => onChat(doc, e)}
              className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
              title="Chat with document (RAG)"
            >
              <MessageSquare size={11} />
              Chat
            </button>
          )}
          <button
            onClick={(e) => onDelete(doc._id, e)}
            disabled={isDeleting}
            className="flex items-center justify-center p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors disabled:opacity-50"
            title="Delete document"
          >
            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── YouTube Card ──────────────────────────────────────────────────────────────

function YouTubeCard({ doc, onStar, onDelete, onChat, isDeleting }: {
  doc: Document;
  onStar: (doc: Document, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onChat?: (doc: Document, e: React.MouseEvent) => void;
  isDeleting: boolean;
}) {
  const badge = getStatusBadge(doc.status);

  return (
    <div
      onClick={() => doc.storagePath && window.open(doc.storagePath, '_blank')}
      className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-red-400 dark:hover:border-red-700/50 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-200 cursor-pointer"
    >
      <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 h-40 gap-2">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/40 flex items-center justify-center shadow-md text-red-500 font-extrabold text-xl">
          ▶
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">YOUTUBE</span>

        <div className="absolute inset-0 bg-red-900/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 rounded-t-2xl">
          <ExternalLink size={22} className="text-white drop-shadow" />
        </div>

        <button
          onClick={(e) => onStar(doc, e)}
          className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all ${
            doc.isStarred
              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
              : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 bg-white/80 dark:bg-slate-800/80'
          }`}
          title={doc.isStarred ? 'Unstar' : 'Star to protect'}
        >
          <Star size={13} className={doc.isStarred ? 'fill-current' : ''} />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate" title={doc.originalName}>
          {doc.originalName}
        </p>
        <div className="flex items-center justify-between gap-1">
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${badge.className}`}>
            {badge.icon}
            {badge.label}
          </span>
          <span className="text-[9px] text-red-500 font-bold">Transcript</span>
        </div>

        <div className="flex items-center gap-1 mt-0.5">
          {doc.status === 'Ready' && onChat && (
            <button
              onClick={(e) => onChat(doc, e)}
              className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
              title="Chat with YouTube Transcript"
            >
              <MessageSquare size={11} />
              Chat
            </button>
          )}
          <button
            onClick={(e) => onDelete(doc._id, e)}
            disabled={isDeleting}
            className="flex items-center justify-center p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors disabled:opacity-50"
            title="Delete document"
          >
            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Image Card ────────────────────────────────────────────────────────────────

function ImageCard({ doc, onStar, onDelete }: {
  doc: Document;
  onStar: (doc: Document, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isDeleting: boolean;
}) {
  return (
    <div
      onClick={() => doc.storagePath && window.open(doc.storagePath, '_blank')}
      className="group relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer"
    >
      <img
        src={doc.storagePath}
        alt={doc.originalName}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5">
        <p className="text-[10px] font-semibold text-white truncate">{doc.originalName}</p>
        <p className="text-[9px] text-slate-300">{formatBytes(doc.fileSize)}</p>
      </div>

      {/* Star button */}
      <button
        onClick={(e) => onStar(doc, e)}
        className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all ${
          doc.isStarred
            ? 'text-amber-500 bg-amber-50/90 dark:bg-amber-950/60'
            : 'text-white opacity-0 group-hover:opacity-100 hover:bg-black/30'
        }`}
        title={doc.isStarred ? 'Unstar' : 'Star to protect'}
      >
        <Star size={12} className={doc.isStarred ? 'fill-current' : ''} />
      </button>

      {/* Protected badge */}
      {doc.isStarred && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500/90 text-white rounded-full px-1.5 py-0.5">
          <Star size={9} className="fill-current" />
          <span className="text-[9px] font-bold">Protected</span>
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={(e) => onDelete(doc._id, e)}
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all"
        title="Delete"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

// ─── Generic File Card ─────────────────────────────────────────────────────────

function FileCard({ doc, onStar, onDelete, onChat, isDeleting }: {
  doc: Document;
  onStar: (doc: Document, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onChat?: (doc: Document, e: React.MouseEvent) => void;
  isDeleting: boolean;
}) {
  const badge = getStatusBadge(doc.status);
  return (
    <div
      onClick={() => doc.storagePath && window.open(doc.storagePath, '_blank')}
      className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800">
        <File size={18} className="text-slate-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{doc.originalName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatBytes(doc.fileSize)}</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.className}`}>
        {badge.icon}{badge.label}
      </span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => onStar(doc, e)}
          className={`p-1.5 rounded-lg transition-colors ${
            doc.isStarred
              ? 'text-amber-500 opacity-100 !opacity-100'
              : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20'
          }`}
          title={doc.isStarred ? 'Unstar' : 'Star to protect'}
          style={{ opacity: doc.isStarred ? 1 : undefined }}
        >
          <Star size={13} className={doc.isStarred ? 'fill-current' : ''} />
        </button>
        {doc.status === 'Ready' && onChat && (
          <button
            onClick={(e) => onChat(doc, e)}
            className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition-colors"
            title="Chat with Document (RAG)"
          >
            <MessageSquare size={13} />
          </button>
        )}
        <button
          onClick={(e) => onDelete(doc._id, e)}
          disabled={isDeleting}
          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors disabled:opacity-50"
          title="Delete document"
        >
          {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
      {doc.isStarred && (
        <Star size={12} className="text-amber-500 fill-current shrink-0 ml-1" style={{ opacity: 1 }} />
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const router = useRouter();
  const { rooms, createRoom, selectRoom } = useChatStore();
  const { toggleSidebar } = useUiStore();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [urlInput, setUrlInput] = useState('');
  const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput || !urlInput.trim()) return;
    setIsSubmittingUrl(true);
    setGlobalError(null);
    try {
      const res = await documentService.processUrl(urlInput.trim());
      setDocuments((prev) => [res.data, ...prev]);
      setUrlInput('');
    } catch (err: any) {
      setGlobalError(err?.response?.data?.message || 'Failed to process URL.');
    } finally {
      setIsSubmittingUrl(false);
    }
  };

  const handleChatWithDocument = async (doc: Document, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const existingRoom = rooms.find((r) => r.documentId === doc._id);
      if (existingRoom) {
        selectRoom(existingRoom);
        router.push('/chat');
        return;
      }
      const room = await createRoom({
        name: `Chat: ${doc.originalName}`,
        isGroup: false,
        documentId: doc._id,
        participantIds: [],
      });
      selectRoom(room);
      router.push('/chat');
    } catch {
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
    } catch {
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
        prev.map((u) => u.file.name + u.file.size === key ? { ...u, status: 'uploading' } : u)
      );

      try {
        const result = await documentService.uploadDocument(item.file, (evt) => {
          const progress = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0;
          setUploadQueue((prev) =>
            prev.map((u) => u.file.name + u.file.size === key ? { ...u, progress } : u)
          );
        });

        setUploadQueue((prev) =>
          prev.map((u) => u.file.name + u.file.size === key ? { ...u, status: 'done', progress: 100 } : u)
        );
        setDocuments((prev) => [result.data, ...prev]);

        setTimeout(() => {
          setUploadQueue((prev) =>
            prev.filter((u) => !(u.file.name + u.file.size === key && u.status === 'done'))
          );
        }, 2500);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Upload failed.';
        setUploadQueue((prev) =>
          prev.map((u) => u.file.name + u.file.size === key ? { ...u, status: 'error', error: msg } : u)
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
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
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

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    try {
      await documentService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch {
      setGlobalError('Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStar = async (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await documentService.starDocument(doc._id);
      setDocuments((prev) =>
        prev.map((d) => d._id === doc._id ? { ...d, isStarred: result.data.isStarred } : d)
      );
    } catch {
      setGlobalError('Failed to update star status.');
    }
  };

  const removeQueueItem = (key: string) => {
    setUploadQueue((prev) => prev.filter((u) => u.file.name + u.file.size !== key));
  };

  // ─── Pagination logic ────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(documents.length / PAGE_SIZE));
  const paginatedDocs = documents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Split by type for current page
  const youtubeDocs = paginatedDocs.filter((d) => d.sourceType === 'youtube' || d.fileType === 'youtube');
  const imageDocs = paginatedDocs.filter((d) => isImage(d.fileType));
  const pdfDocs = paginatedDocs.filter((d) => isPdf(d.fileType));
  const otherDocs = paginatedDocs.filter((d) => !isImage(d.fileType) && !isPdf(d.fileType) && d.sourceType !== 'youtube' && d.fileType !== 'youtube');

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-955 select-none w-full animate-in fade-in duration-300">
      
      {/* Unified Top Header Bar (h-20) */}
      <header className="h-20 border-b border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0a1b] px-4 sm:px-6 flex items-center justify-between shrink-0 relative z-30 transition-colors duration-300">
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger menu button on mobile */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 -ml-2 hover:bg-slate-50 dark:hover:bg-[#1a1738]/50 text-slate-505 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer lg:hidden flex items-center justify-center shrink-0"
            title="Toggle Navigation Menu"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex flex-col text-left">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-850 dark:text-slate-100 leading-tight">
              Document Library
            </h2>
            <span className="text-[10px] text-slate-400 mt-0.5 leading-none">
              Upload files and chat with them using AI-powered RAG.
            </span>
          </div>
        </div>
        
        {/* Right side: Actions / theme / profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-450 hover:text-slate-650 dark:hover:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-[#1a1738]/50 transition-colors cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Status Profile Badge */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] dark:bg-[#15122b]/50 border border-slate-200/50 dark:border-slate-800/40 rounded-full select-none shrink-0">
              <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-tr from-[#5f3be3] to-[#794ef7] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#d2ceff]/30">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-left min-w-[40px]">
                <span className="text-[11px] font-bold text-slate-850 dark:text-white leading-none">
                  {user.name}
                </span>
                <span className="text-[8px] text-emerald-500 font-bold flex items-center gap-0.5 mt-0.5 leading-none">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full">
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
          {/* Description Banner */}
          <div className="p-4 bg-white dark:bg-[#12112a] border border-[#e2e8f0] dark:border-[#201e3d] rounded-2xl shadow-sm text-xs text-slate-500 dark:text-slate-400">
            Upload PDF, DOCX, or TXT files to train your assistant.
            <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <Star size={12} className="fill-current animate-pulse" />
              Star a document to protect it from being deleted when you remove a chat room.
            </span>
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

        {/* YouTube & Web URL Input Bar */}
        <div className="p-4 bg-white dark:bg-[#12112a] border border-[#e2e8f0] dark:border-[#201e3d] rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <span className="text-red-500 font-extrabold text-sm">▶</span> Import YouTube Video or Web Page
            </span>
            <span className="text-[10px] text-slate-400">Extracts transcripts & articles automatically</span>
          </div>
          <form onSubmit={handleUrlSubmit} className="flex items-center gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste YouTube URL (e.g. https://www.youtube.com/watch?v=...) or Web link..."
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
            />
            <button
              type="submit"
              disabled={isSubmittingUrl || !urlInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isSubmittingUrl ? <Loader2 size={13} className="animate-spin" /> : 'Import URL'}
            </button>
          </form>
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
                return (
                  <div key={key} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-rose-50 dark:bg-rose-950/30">
                      <FileType size={16} className="text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.file.name}</p>
                      {item.status === 'uploading' && (
                        <div className="mt-1.5 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                        </div>
                      )}
                      {item.status === 'done' && <p className="text-[10px] text-emerald-500 font-medium mt-0.5">Uploaded & processed ✓</p>}
                      {item.status === 'error' && <p className="text-[10px] text-rose-500 font-medium mt-0.5">{item.error}</p>}
                      {item.status === 'pending' && <p className="text-[10px] text-slate-400 mt-0.5">Queued…</p>}
                    </div>
                    {item.status !== 'uploading' && (
                      <button onClick={() => removeQueueItem(key)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
                        <X size={14} />
                      </button>
                    )}
                    {item.status === 'uploading' && <Loader2 size={16} className="text-indigo-500 animate-spin shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Your Documents
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {documents.length} file{documents.length !== 1 ? 's' : ''}
              {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
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
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No documents yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Upload your first document above to get started.</p>
            </div>
          ) : (
            <>
              {/* ── Images Grid (4 per row) ── */}
              {imageDocs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <span className="w-4 h-px bg-slate-300 dark:bg-slate-700 rounded" />
                    Images
                    <span className="text-[10px] font-normal normal-case">({imageDocs.length})</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {imageDocs.map((doc) => (
                      <ImageCard
                        key={doc._id}
                        doc={doc}
                        onStar={handleStar}
                        onDelete={handleDelete}
                        isDeleting={deletingId === doc._id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── YouTube Videos Grid (4 per row) ── */}
              {youtubeDocs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400 flex items-center gap-1.5">
                    <span className="w-4 h-px bg-red-400 dark:bg-red-700 rounded" />
                    YouTube Videos & Captions
                    <span className="text-[10px] font-normal normal-case">({youtubeDocs.length})</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {youtubeDocs.map((doc) => (
                      <YouTubeCard
                        key={doc._id}
                        doc={doc}
                        onStar={handleStar}
                        onDelete={handleDelete}
                        onChat={handleChatWithDocument}
                        isDeleting={deletingId === doc._id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── PDFs Grid (4 per row) ── */}
              {pdfDocs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <span className="w-4 h-px bg-slate-300 dark:bg-slate-700 rounded" />
                    PDFs
                    <span className="text-[10px] font-normal normal-case">({pdfDocs.length})</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {pdfDocs.map((doc) => (
                      <PdfCard
                        key={doc._id}
                        doc={doc}
                        onStar={handleStar}
                        onDelete={handleDelete}
                        onChat={handleChatWithDocument}
                        isDeleting={deletingId === doc._id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Other Files (list view) ── */}
              {otherDocs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <span className="w-4 h-px bg-slate-300 dark:bg-slate-700 rounded" />
                    Other Files
                    <span className="text-[10px] font-normal normal-case">({otherDocs.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {otherDocs.map((doc) => (
                      <FileCard
                        key={doc._id}
                        doc={doc}
                        onStar={handleStar}
                        onDelete={handleDelete}
                        onChat={handleChatWithDocument}
                        isDeleting={deletingId === doc._id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-700"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                          p === page
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-700"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
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
              Star <Star size={10} className="inline fill-amber-500 text-amber-500 mx-0.5" /> a document to protect it — starred documents are never auto-deleted when you remove a chat room.
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
);
}
