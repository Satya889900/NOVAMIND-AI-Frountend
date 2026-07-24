'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Room } from '../../types/chat';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { DocumentSummaryPanel } from './DocumentSummaryPanel';
import { VoiceConversationModal } from './VoiceConversationModal';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import { FileText } from 'lucide-react';

interface ChatWindowProps {
  room: Room;
}

export function ChatWindow({ room }: ChatWindowProps) {
  const { messages, sendMessage, emitTyping, typingUsers } = useChat();
  const { user } = useAuthStore();
  const roomMessages = messages[room.id] || [];
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const roomTyping = typingUsers[room.id] || [];

  const [showSummary, setShowSummary] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);

  useEffect(() => {
    setShowSummary(!!room.documentId);
  }, [room.id, room.documentId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages, roomTyping]);

  // Determine whether to show suggestions (when the last message is from the assistant/bot)
  const lastMessage = roomMessages[roomMessages.length - 1];
  const isLastMessageAssistant = lastMessage && (
    typeof lastMessage.senderId === 'object'
      ? (lastMessage.senderId as any)._id !== user?.id
      : lastMessage.senderId !== user?.id
  );

  const getSuggestions = () => {
    const lastMsgText = lastMessage?.content?.toLowerCase() || '';
    const userMessage = roomMessages[roomMessages.length - 2];
    const userMsgText = userMessage?.content?.toLowerCase() || '';
    const combinedText = `${lastMsgText} ${userMsgText} ${room.name?.toLowerCase() || ''}`;

    // Java Context
    if (combinedText.includes('java')) {
      if (combinedText.includes('oop') || combinedText.includes('object') || combinedText.includes('class') || combinedText.includes('polymorphism') || combinedText.includes('inheritance')) {
        return [
          'Explain Polymorphism in Java',
          'What is Inheritance in Java?',
          'Java OOP Code Examples',
          'Encapsulation vs Abstraction'
        ];
      }
      if (combinedText.includes('loop') || combinedText.includes('for') || combinedText.includes('while') || combinedText.includes('control')) {
        return [
          'For vs While Loops in Java',
          'Switch-Case in Java',
          'Break vs Continue in Java',
          'Nested Loop Examples'
        ];
      }
      if (combinedText.includes('variable') || combinedText.includes('type') || combinedText.includes('primitive')) {
        return [
          'Primitive vs Reference Types',
          'How to declare variables',
          'Scope of variables in Java',
          'What is the final keyword?'
        ];
      }
      return [
        'Explain OOP in Java',
        'Java vs Python',
        'Write a Hello World in Java',
        'Best IDE for Java'
      ];
    }

    // Python Context
    if (combinedText.includes('python')) {
      return [
        'Python vs JavaScript',
        'Write a loop in Python',
        'Python OOP basics',
        'Best libraries for AI'
      ];
    }

    // JS/React/NextJS Context
    if (combinedText.includes('javascript') || combinedText.includes('js') || combinedText.includes('react') || combinedText.includes('next.js') || combinedText.includes('nextjs')) {
      return [
        'React state hook guide',
        'NextJS App Router tips',
        'What is virtual DOM?',
        'JS Async/Await example'
      ];
    }

    // AI Image / Generation Context
    if (combinedText.includes('image') || combinedText.includes('art') || combinedText.includes('generation') || combinedText.includes('flux') || combinedText.includes('paint') || combinedText.includes('draw')) {
      return [
        'Generate a cartoon robot',
        'FLUX vs Midjourney',
        'Advanced prompt tips',
        'Resize generated image'
      ];
    }

    // Travel Context
    if (combinedText.includes('travel') || combinedText.includes('trip') || combinedText.includes('plan') || combinedText.includes('itinerary') || combinedText.includes('visit')) {
      return [
        'Suggest budget options',
        'Pack list for this trip',
        'Best time to visit',
        'Find local restaurants'
      ];
    }

    // Fitness / Nutrition Context
    if (combinedText.includes('fit') || combinedText.includes('nutrition') || combinedText.includes('diet') || combinedText.includes('workout') || combinedText.includes('health') || combinedText.includes('weight')) {
      return [
        'Calculate my macro intake',
        'Home workout plan',
        'Healthy snack options',
        'How to track progress'
      ];
    }

    // General Fallbacks
    return [
      'Can you elaborate on that?',
      'Give me a code example',
      'What are the pros and cons?',
      'Explain it to a beginner'
    ];
  };

  return (
    <div className="flex-1 flex h-full min-w-0 overflow-hidden relative">
      {/* Left side: Main Chat Window */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#ffffff] dark:bg-[#0c0a1b]">
        <ChatHeader room={room} onOpenVoiceMode={() => setIsVoiceModeOpen(true)} />

        {/* Floating Toggle Summary Panel Button */}
        {room.documentId && (
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="absolute top-[88px] right-6 z-20 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md text-slate-500 hover:text-[#794ef7] dark:hover:text-[#a78bfa] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
            title={showSummary ? "Hide Document Summary" : "Show Document Summary"}
          >
            <FileText size={14} />
            <span className="text-[11px] sm:text-xs font-bold">
              {showSummary ? "Hide Info" : "Show Info"}
            </span>
          </button>
        )}

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {roomMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
              No messages yet. Send a message to start the conversation!
            </div>
          ) : (
            roomMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}

          {/* Suggestion Pills underneath the last message */}
          {isLastMessageAssistant && (
            <div className="flex flex-wrap gap-2 mt-2 justify-start px-1 sm:pl-12 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {getSuggestions().map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(room.id, s)}
                  className="px-4 py-2.5 text-[11px] font-bold text-[#794ef7] dark:text-[#a78bfa] bg-[#f0edff] dark:bg-[#1a1636] hover:bg-[#e5e1ff] dark:hover:bg-[#231e4a] border border-[#dcd8f8]/60 dark:border-[#382b6b]/40 rounded-full transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={messageEndRef} />
        </div>

        <TypingIndicator typingUsers={roomTyping} />

        <ChatInput
          roomId={room.id}
          isNewRoom={roomMessages.length === 0}
          onSendMessage={(content, type, fileUrl, fileName, model) => sendMessage(room.id, content, type, fileUrl, fileName, model)}
          onTyping={(isTyping) => emitTyping(room.id, isTyping)}
          onOpenVoiceMode={() => setIsVoiceModeOpen(true)}
        />
      </div>

      {/* Right side: Summary panel */}
      {room.documentId && showSummary && (
        <DocumentSummaryPanel
          documentId={room.documentId}
          onAskQuestion={(question) => sendMessage(room.id, question)}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* ChatGPT-Style Interactive Voice Conversation Modal */}
      <VoiceConversationModal
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
        roomId={room.id}
      />
    </div>
  );
}
