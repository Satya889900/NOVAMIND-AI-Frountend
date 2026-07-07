'use client';

import React, { useState } from 'react';
import { ChatSidebar } from '../../../components/chat/ChatSidebar';
import { ChatWindow } from '../../../components/chat/ChatWindow';
import { EmptyState } from '../../../components/chat/EmptyState';
import { useChat } from '../../../hooks/useChat';
import { useUiStore } from '../../../store/uiStore';
import { X, Plus, Users } from 'lucide-react';

export default function ChatPage() {
  const { activeRoom, createRoom } = useChat();
  const { activeModal, openModal } = useUiStore();
  
  // Modal state fields
  const [newRoomName, setNewRoomName] = useState('');
  const [participants, setParticipants] = useState<string>('');
  const [isGroup, setIsGroup] = useState(true);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const list = participants
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    try {
      await createRoom({
        name: newRoomName.trim(),
        isGroup,
        participantIds: list,
      });
      setNewRoomName('');
      setParticipants('');
      openModal(null);
    } catch (err) {
      alert('Failed to create room. Please ensure participant IDs are valid.');
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)] relative">
      <ChatSidebar onCreateChat={() => openModal('create_room')} />

      {activeRoom ? (
        <ChatWindow room={activeRoom} />
      ) : (
        <EmptyState onCreateChat={() => openModal('create_room')} />
      )}

      {/* Create Room Modal */}
      {activeModal === 'create_room' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                Create Conversation
              </h2>
              <button
                onClick={() => openModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Conversation Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Project Alpha"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Participant IDs (comma-separated)
                </label>
                <input
                  type="text"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="e.g. user_id_1, user_id_2"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="isGroup"
                  checked={isGroup}
                  onChange={(e) => setIsGroup(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="isGroup" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  This is a group conversation
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={16} /> Create
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
