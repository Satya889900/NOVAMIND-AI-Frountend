import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../../types/chat';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { formatTime } from '../../lib/utils';
import { MoreVertical, Pencil, Trash2, X, Check, FileText, Sparkles, Zap, Bot, Image as ImageIcon, Copy } from 'lucide-react';
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

// Utility to format raw JSON tool blocks that might leak from backend
const formatContent = (content: any) => {
  if (!content || typeof content !== 'string') return String(content || '');
  try {
    const jsonRegex = /\{[\s\S]*"action"[\s\S]*\}/g;
    return content.replace(jsonRegex, (match) => {
      try {
        const parsed = JSON.parse(match);
        if (parsed.action) {
          return `\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\`\n`;
        }
      } catch (e) {
        // Not valid JSON, return as is
      }
      return match;
    });
  } catch(e) {
    return content;
  }
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
  const [editContent, setEditContent] = useState(message.content || '');
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    const text = message.content || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = async () => {
    if (!editContent.trim() || editContent.trim() === message.content) {
      setIsEditing(false);
      setEditContent(message.content || '');
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content || '');
    }
  };

  // Safe access for sender properties
  const senderName = message.sender?.name || 'Unknown User';
  const senderInitial = senderName.charAt(0).toUpperCase();  return (
    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-3 px-1`}>
      <div className={`group flex gap-2 sm:gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : ''}`}>
        {!isMe && (
          message.sender?.avatarUrl ? (
            <img
              src={message.sender.avatarUrl}
              alt={senderName}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-sm shadow-sm">
              {senderInitial}
            </div>
          )
        )}

        <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'} min-w-0 max-w-full`}>
          {!isMe && (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-1">
              {senderName}
            </span>
          )}

          <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
            {isEditing ? (
              <div className="flex flex-col gap-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-3 shadow-lg w-full min-w-[250px] max-w-sm">
                <textarea
                  ref={editInputRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-[14px] sm:text-[15px] text-slate-900 dark:text-white outline-none resize-none min-h-[80px]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setIsEditing(false); setEditContent(message.content || ''); }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-[14px] sm:text-[15px] leading-relaxed shadow-sm min-w-[40px] max-w-full overflow-hidden break-words ${
                  isMe
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-none shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-slate-200/40 dark:shadow-none'
                }`}
              >
                {message.type === 'image' && message.fileUrl ? (
                  <div className="flex flex-col gap-3 py-1">
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block max-w-sm w-full aspect-square overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/10 group/img"
                    >
                      <img
                        src={message.fileUrl}
                        alt={message.content || 'Image attachment'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-[1.03]"
                      />
                    </a>
                    {message.content && message.content !== message.fileName && (
                      <p className={`mt-1 font-medium leading-relaxed ${isMe ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>{message.content}</p>
                    )}
                  </div>
                ) : message.type === 'file' && message.fileUrl ? (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 max-w-xs">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold truncate text-slate-800 dark:text-slate-200">
                        {message.fileName || 'Attachment'}
                      </p>
                      <a
                        href={message.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-0.5 block"
                      >
                        Download File
                      </a>
                    </div>
                  </div>
                ) : (
                  isMe ? (
                    <div className="whitespace-pre-wrap font-medium">{message.content}</div>
                  ) : (
                    <div className="prose prose-slate dark:prose-invert max-w-full overflow-hidden prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-xl prose-a:text-indigo-500 hover:prose-a:text-indigo-600 prose-sm prose-headings:font-semibold prose-strong:text-slate-900 dark:prose-strong:text-slate-100">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {formatContent(message.content)}
                      </ReactMarkdown>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Action Menu (Visible on Hover) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
              <button
                onClick={handleCopy}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-250 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={copied ? 'Copied!' : 'Copy message'}
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>

              {isMe && (
                <div ref={menuRef} className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-250 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Message actions"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 bottom-full mb-1.5 z-20 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1">
                      <button
                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                      >
                        <Pencil size={12} className="text-indigo-500" />
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 px-1 mt-0.5 opacity-70 text-[10px] sm:text-[11px]">
            <span>{formatTime(message.createdAt)}</span>
            {message.isEdited && <span className="italic text-slate-400">(edited)</span>}
            {!isMe && message.model && (() => {
              const display = MODEL_DISPLAY[message.model];
              if (!display) return null;
              return (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full border text-[8px] font-bold leading-none ${display.bg} ${display.border} ${display.text}`}>
                  {display.label}
                </span>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}



