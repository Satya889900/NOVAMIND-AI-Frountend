import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../../types/chat';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { formatTime } from '../../lib/utils';
import { MoreVertical, Pencil, Trash2, X, Check } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useAuthStore();
  const { editMessage, deleteMessage } = useChatStore();
  const isMe = message.senderId === user?.id;
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
              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                isMe
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'
              }`}
            >
              {message.content}
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
        </div>
      </div>
    </div>
  );
}
