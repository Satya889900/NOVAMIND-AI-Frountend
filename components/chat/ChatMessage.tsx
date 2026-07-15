import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../../types/chat';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { formatTime } from '../../lib/utils';
import { MoreVertical, Pencil, Trash2, X, Check, FileText, Sparkles, Zap, Bot, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: Message;
}

// Friendly display names and styles for AI models
const MODEL_DISPLAY: Record<string, { label: string; bg: string; border: string; text: string; icon: 'sparkles' | 'zap' | 'bot' | 'image' }> = {
  'gemini-3.1-flash-lite': { label: 'Gemini 2.5 Flash', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200/50 dark:border-blue-800/30', text: 'text-blue-600 dark:text-blue-400', icon: 'sparkles' },
  'gemini-3.5-flash':      { label: 'Gemini 2.5 Pro',   bg: 'bg-violet-50 dark:bg-violet-950/20', border: 'border-violet-200/50 dark:border-violet-800/30', text: 'text-violet-600 dark:text-violet-400', icon: 'sparkles' },
  'llama-3.3-70b-versatile': { label: 'Llama 3.3 · 70B', bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200/50 dark:border-orange-800/30', text: 'text-orange-600 dark:text-orange-400', icon: 'zap' },
  'Qwen/Qwen2.5-7B-Instruct': { label: 'Qwen 2.5 · 7B', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200/50 dark:border-emerald-800/30', text: 'text-emerald-600 dark:text-emerald-400', icon: 'bot' },
  'deepseek-ai/DeepSeek-R1': { label: 'DeepSeek R1', bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200/50 dark:border-green-800/30', text: 'text-green-600 dark:text-green-400', icon: 'bot' },
  'deepseek-ai/DeepSeek-V3': { label: 'DeepSeek V3', bg: 'bg-teal-50 dark:bg-teal-950/20', border: 'border-teal-200/50 dark:border-teal-800/30', text: 'text-teal-600 dark:text-teal-400', icon: 'bot' },
  'flux-schnell': { label: 'FLUX.1 Schnell', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200/50 dark:border-amber-800/30', text: 'text-amber-600 dark:text-amber-400', icon: 'image' },
};

export function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useAuthStore();
  const { editMessage, deleteMessage } = useChatStore();
  const senderStrId = typeof message.senderId === 'object' && message.senderId
    ? (message.senderId as any)._id || (message.senderId as any).id
    : message.senderId;
  const isMe = senderStrId === user?.id;
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = async () => {
    if (!editContent.trim() || editContent.trim() === message.content) {
      setIsEditing(false);
      setEditContent(message.content);
      return;
    }
    await editMessage(message.roomId, message.id, editContent.trim());
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this message?')) {
      await deleteMessage(message.roomId, message.id);
    }
    setShowMenu(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEdit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  return (
    <div className={`group flex gap-3 w-full max-w-[85%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
      {!isMe && (
        message.sender.avatarUrl ? (
          <img
            src={message.sender.avatarUrl}
            alt={message.sender.name}
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold shrink-0 text-sm">
            {message.sender.name.charAt(0).toUpperCase()}
          </div>
        )
      )}

      <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-1">
            {message.sender.name}
          </span>
        )}

        <div className="relative flex items-center gap-1">
          {/* Reorder items based on sender */}
          {isMe && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all cursor-pointer"
                title="Message actions"
              >
                <MoreVertical size={14} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    <Pencil size={14} className="text-indigo-500" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}

          {isEditing ? (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-2xl px-3 py-2 shadow-md">
              <input
                ref={editInputRef}
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white outline-none min-w-[200px]"
              />
              <button
                onClick={handleEdit}
                className="p-1 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 rounded transition-colors cursor-pointer"
                title="Save edit"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditContent(message.content); }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="Cancel edit"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isMe
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 text-white rounded-tr-none shadow-md shadow-indigo-500/10'
                  : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-sm'
              }`}
            >
              {message.type === 'image' && message.fileUrl ? (
                <div className="flex flex-col gap-3 py-1">
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block max-w-sm w-full aspect-square overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/5 group/img"
                  >
                    <img
                      src={message.fileUrl}
                      alt={message.content || 'Image attachment'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-[1.02]"
                    />
                  </a>
                  {message.content && message.content !== message.fileName && (
                    <p className={`mt-1 font-medium leading-relaxed ${isMe ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{message.content}</p>
                  )}
                </div>
              ) : message.type === 'file' && message.fileUrl ? (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-w-xs">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">
                      {message.fileName || 'Attachment'}
                    </p>
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-0.5 block"
                    >
                      Download File
                    </a>
                  </div>
                </div>
              ) : (
                isMe ? (
                  message.content
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-a:text-indigo-500 hover:prose-a:text-indigo-600">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-1 mt-0.5">
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            {formatTime(message.createdAt)}
          </span>
          {message.isEdited && (
            <span className="text-[10px] italic text-slate-400 dark:text-slate-500">
              (edited)
            </span>
          )}
          {/* AI Model Badge */}
          {!isMe && message.model && (() => {
            const display = MODEL_DISPLAY[message.model];
            if (!display) return null;
            const IconComponent = display.icon === 'zap' ? Zap : display.icon === 'bot' ? Bot : display.icon === 'image' ? ImageIcon : Sparkles;
            return (
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border shadow-sm/5 leading-none transition-all ${display.bg} ${display.border} ${display.text}`}>
                <IconComponent size={9} />
                {display.label}
              </span>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
