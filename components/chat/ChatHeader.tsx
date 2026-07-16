import React, { useState, useEffect } from 'react';
import { Room } from '../../types/chat';
import { useAuthStore } from '../../store/authStore';
import { useChat } from '../../hooks/useChat';
import { Users, MoreVertical, Hash, Edit2, Trash2, Check, X, ArrowLeft } from 'lucide-react';

interface ChatHeaderProps {
  room: Room;
}

export function ChatHeader({ room }: ChatHeaderProps) {
  const { user } = useAuthStore();
  const { renameRoom, deleteRoom, selectRoom } = useChat();

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(room.name || '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setNewName(room.name || '');
    setIsEditing(false);
    setIsMenuOpen(false);
    setIsDeleting(false);
  }, [room.id, room.name]);

  // Find private chat recipient
  const recipient = !room.isGroup
    ? room.participants.find((p) => p.id !== user?.id)
    : null;

  const title = room.name && room.name !== 'New Chat'
    ? room.name
    : room.isGroup
      ? room.name
      : (recipient?.name || 'Direct Chat');

  const avatarUrl = room.isGroup ? room.avatarUrl : recipient?.avatarUrl;
  const initial = title.charAt(0).toUpperCase();

  const isOnline = !room.isGroup && recipient?.status === 'online';

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await renameRoom(room.id, newName.trim());
      setIsEditing(false);
      setIsMenuOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRoom(room.id);
      setIsDeleting(false);
      setIsMenuOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 flex items-center justify-between shrink-0 relative">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Back button on mobile */}
        <button
          onClick={() => selectRoom(null)}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer lg:hidden flex items-center justify-center shrink-0"
          title="Back to conversations"
        >
          <ArrowLeft size={20} />
        </button>

        {room.isGroup ? (
          avatarUrl ? (
            <img
              src={avatarUrl}
              alt={title}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Hash size={18} />
            </div>
          )
        ) : (
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={title}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                {initial}
              </div>
            )}
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleRename} className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="Conversation name..."
                autoFocus
              />
              <button
                type="submit"
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                title="Save Name"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setNewName(room.name || '');
                }}
                className="p-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </form>
          ) : (
            <>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {title}
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                {room.isGroup ? (
                  <>
                    <Users size={12} />
                    {room.participants.length} members
                  </>
                ) : (
                  isOnline ? 'Online' : 'Offline'
                )}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <MoreVertical size={18} />
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute right-0 top-11 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-40 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Edit2 size={14} />
                Rename Conversation
              </button>
              <button
                onClick={() => {
                  setIsDeleting(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 size={14} />
                Delete Conversation
              </button>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleting && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Delete Conversation?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete this conversation? This will permanently delete the conversation and all of its messages. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleting(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
