'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, RefreshCw, Sliders, Zap, Bot, Send, MessageSquare } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

interface VoiceConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export function VoiceConversationModal({ isOpen, onClose, roomId }: VoiceConversationModalProps) {
  const { sendMessage } = useChat();
  const { messages } = useChatStore();
  const currentUser = useAuthStore((state) => state.user);
  const roomMessages = messages[roomId] || [];

  // Voice States: 'idle' | 'listening' | 'processing' | 'speaking'
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isAutoSpeak, setIsAutoSpeak] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceRate, setVoiceRate] = useState<number>(1.1);
  const [typedInput, setTypedInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedMsgIdRef = useRef<string | null>(null);
  const latestMessageId = roomMessages[roomMessages.length - 1]?.id || null;

  // Track speech synthesis instance
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      if (voices.length > 0 && !selectedVoice) {
        // Prefer natural / English voices
        const preferred = voices.find(
          (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel') || v.name.includes('en-US')) && v.lang.startsWith('en')
        ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

        setSelectedVoice(preferred);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [selectedVoice]);

  const hasGreetedRef = useRef(false);

  // Stop synthesis when component closes
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      stopListening();
    }
  }, [isOpen]);

  // Initialize Web Speech Recognition
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      return;
    }

    if (isListeningRef.current) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isListeningRef.current = true;
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          currentTranscript += text;
        }

        setTranscript(currentTranscript);

        // Fast auto-send debounce after user stops speaking (900ms for fast human back-and-forth)
        if (autoSendTimerRef.current) {
          clearTimeout(autoSendTimerRef.current);
        }

        if (currentTranscript.trim()) {
          autoSendTimerRef.current = setTimeout(() => {
            handleSendSpokenText(currentTranscript);
          }, 900);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'no-speech' || event.error === 'network') {
          // Auto retry restart after brief pause for transient network or no-speech events
          setTimeout(() => {
            if (!isListeningRef.current && !isMuted && voiceState === 'listening') {
              try { recognition.start(); } catch(e) {}
            }
          }, 400);
        } else {
          isListeningRef.current = false;
          setVoiceState('idle');
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;

        // If there's an unsent transcript when recognition ends, send immediately
        if (transcript.trim() && voiceState === 'listening') {
          handleSendSpokenText(transcript);
          return;
        }

        // Auto restart if still in listening mode and not muted
        if (voiceState === 'listening' && !isMuted) {
          try {
            recognition.start();
            isListeningRef.current = true;
          } catch (e) {
            setVoiceState('idle');
          }
        } else if (voiceState !== 'processing' && voiceState !== 'speaking') {
          setVoiceState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setVoiceState('idle');
    }
  }, [voiceState, isMuted, transcript]);

  const stopListening = useCallback(() => {
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
  }, []);

  // Trigger speech synthesis to read aloud AI response
  const speakText = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || !isAutoSpeak) {
        setVoiceState('idle');
        return;
      }

      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        // Clean markdown tags & voice prefix for speech output
        const cleanText = text
          .replace(/🎤 \[Voice Call\]:/g, '')
          .replace(/🎤 \[Voice Message\]:/g, '')
          .replace(/\*\*\[Transcribed Voice\]:\*\*/g, '')
          .replace(/```[\s\S]*?```/g, 'Code block generated.')
          .replace(/[\*\_`#\-\[\]\(\)]/g, '')
          .trim();

        if (!cleanText) {
          setVoiceState('idle');
          return;
        }

        const voices = window.speechSynthesis.getVoices();
        const bestVoice =
          selectedVoice ||
          voices.find((v) => v.lang.startsWith('en') && v.localService) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          voices[0];

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
        utterance.rate = voiceRate || 1.1;

        utterance.onstart = () => {
          setVoiceState('speaking');
        };

        utterance.onend = () => {
          setVoiceState('idle');
          if (!isMuted) {
            setTimeout(() => {
              startListening();
            }, 100);
          }
        };

        utterance.onerror = (e) => {
          console.warn('Speech synthesis playback error:', e);
          setVoiceState('idle');
          if (!isMuted) {
            startListening();
          }
        };

        utteranceRef.current = utterance;
        setTimeout(() => {
          try {
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(utterance);
          } catch (e) {}
        }, 50);
      } catch (err) {
        console.error('Failed to trigger speakText:', err);
        setVoiceState('idle');
      }
    },
    [isAutoSpeak, selectedVoice, voiceRate, isMuted, startListening]
  );

  // Send spoken transcript to AI
  const handleSendSpokenText = (textToSend?: string) => {
    const text = (textToSend || transcript).trim();
    if (!text) return;

    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }

    stopListening();
    setVoiceState('processing');
    setTranscript('');

    sendMessage(roomId, `🎤 [Voice Call]: ${text}`, 'text');
  };

  // Send typed prompt in Voice Mode to get a spoken explanation
  const handleSendTypedInput = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = typedInput.trim();
    if (!text) return;

    setTypedInput('');
    handleSendSpokenText(text);
  };

  // Watch for incoming AI response completion after sending spoken prompt
  useEffect(() => {
    if (!isOpen || roomMessages.length === 0 || voiceState !== 'processing') return;

    const lastMsg = roomMessages[roomMessages.length - 1];
    if (!lastMsg) return;

    // Determine if last message is an AI message (not sent by current user)
    const isUserMsg =
      lastMsg.senderId === currentUser?.id ||
      lastMsg.sender?.id === currentUser?.id;

    const isAiMsg = !isUserMsg;
    const isStreamingMsg = lastMsg.id.startsWith('streaming-ai-msg');

    // Trigger TTS speech as soon as AI response is complete (or finalized) and content is non-empty
    if (isAiMsg && !isStreamingMsg && lastMsg.content && lastMsg.content.trim() && lastMsg.id !== lastProcessedMsgIdRef.current) {
      lastProcessedMsgIdRef.current = lastMsg.id;

      if (!lastMsg.content.includes('Generating image')) {
        speakText(lastMsg.content);
      } else {
        setVoiceState('idle');
        startListening();
      }
    }
  }, [roomMessages, isOpen, voiceState, currentUser?.id, speakText, startListening]);

  // Speak initial welcoming greeting when Voice Mode opens (ChatGPT style)
  const speakGreeting = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !isAutoSpeak) {
      startListening();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const voices = window.speechSynthesis.getVoices();
      const bestVoice =
        selectedVoice ||
        voices.find((v) => v.lang.startsWith('en') && v.localService) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];

      const greetingText = "Hey! I am here to help you. What's on your mind today?";
      const utterance = new SpeechSynthesisUtterance(greetingText);
      utterance.lang = 'en-US';
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      utterance.rate = voiceRate || 1.1;

      utterance.onstart = () => {
        setVoiceState('speaking');
      };

      utterance.onend = () => {
        setVoiceState('idle');
        if (!isMuted) {
          setTimeout(() => {
            startListening();
          }, 150);
        }
      };

      utterance.onerror = (e) => {
        console.warn('Greeting audio error, falling back to listening:', e);
        setVoiceState('idle');
        startListening();
      };

      utteranceRef.current = utterance;
      setTimeout(() => {
        try {
          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }, 50);
    } catch (e) {
      console.error('Failed to trigger speakGreeting:', e);
      setVoiceState('idle');
      startListening();
    }
  }, [selectedVoice, voiceRate, isMuted, isAutoSpeak, startListening]);

  // Handle modal open transition (guaranteed single trigger per modal open)
  useEffect(() => {
    if (isOpen) {
      if (!hasGreetedRef.current) {
        hasGreetedRef.current = true;
        setTranscript('');
        setVoiceState('idle');
        speakGreeting();
      }
    } else {
      hasGreetedRef.current = false;
      stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen, speakGreeting, stopListening]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 bg-[#000000] text-white select-none overflow-hidden animate-in fade-in duration-300">
      {/* Background Glowing Ambient Aura */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] transition-all duration-1000 ${
          voiceState === 'listening'
            ? 'w-[500px] h-[500px] bg-purple-600/30'
            : voiceState === 'speaking'
            ? 'w-[500px] h-[500px] bg-cyan-600/30'
            : voiceState === 'processing'
            ? 'w-[450px] h-[450px] bg-amber-500/25'
            : 'w-[400px] h-[400px] bg-indigo-900/20'
        }`} />
      </div>

      {/* Top Header Navigation */}
      <div className="w-full max-w-5xl flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#141419] border border-[#272732] rounded-full text-xs font-bold text-slate-200 shadow-md">
            <Sparkles size={14} className="text-[#a78bfa] animate-pulse" />
            <span>ChatGPT Voice</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-full border transition-all cursor-pointer ${
              showSettings
                ? 'bg-[#272738] text-white border-[#5844a8]'
                : 'bg-[#141419] text-slate-400 hover:text-white border-[#272732]'
            }`}
            title="Voice Settings"
          >
            <Sliders size={18} />
          </button>

          <button
            onClick={onClose}
            className="p-2.5 bg-[#141419] hover:bg-[#272732] text-slate-400 hover:text-white border border-[#272732] rounded-full transition-all cursor-pointer"
            title="Close Voice Assistant"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Voice Settings Overlay Panel */}
      {showSettings && (
        <div className="w-full max-w-md bg-[#12121a]/95 border border-[#2a2a3c] rounded-3xl p-5 text-left z-30 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-200">
          <p className="text-xs font-bold text-[#a78bfa] uppercase tracking-wider mb-4">Voice Customization</p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">AI Voice Model</label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = availableVoices.find((v) => v.name === e.target.value);
                  if (voice) setSelectedVoice(voice);
                }}
                className="w-full px-3 py-2 bg-[#09090e] border border-[#33334d] rounded-xl text-xs text-white outline-none focus:border-[#794ef7]"
              >
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-300">Speech Rate ({voiceRate}x)</span>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.1"
                value={voiceRate}
                onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                className="w-32 accent-[#794ef7] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#252538]">
              <span className="text-xs font-semibold text-slate-300">Auto-read AI Responses</span>
              <button
                onClick={() => setIsAutoSpeak(!isAutoSpeak)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  isAutoSpeak
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {isAutoSpeak ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Center Area: Large ChatGPT Fluid 3D Voice Sphere (Matching Screenshot 2) */}
      <div className="flex flex-col items-center justify-center flex-1 my-auto z-10">
        <div className="relative flex items-center justify-center">
          {/* Outer Fluid Pulsing Aura Rings */}
          <div
            className={`absolute rounded-full transition-all duration-700 ${
              voiceState === 'listening'
                ? 'w-72 h-72 sm:w-96 sm:h-96 bg-purple-600/20 animate-ping opacity-60'
                : voiceState === 'speaking'
                ? 'w-72 h-72 sm:w-96 sm:h-96 bg-cyan-500/20 animate-pulse opacity-75'
                : voiceState === 'processing'
                ? 'w-64 h-64 sm:w-80 sm:h-80 bg-amber-500/20 animate-spin opacity-50'
                : 'w-56 h-56 sm:w-72 sm:h-72 bg-indigo-950/30'
            }`}
          />

          {/* Central Fluid Glowing 3D Orb (Matching Official ChatGPT Voice Sphere) */}
          <button
            onClick={() => {
              if (voiceState === 'listening') {
                stopListening();
                setVoiceState('idle');
              } else if (voiceState === 'speaking') {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                startListening();
              } else {
                startListening();
              }
            }}
            className={`relative w-52 h-52 sm:w-64 sm:h-64 rounded-full flex items-center justify-center shadow-[0_0_90px_rgba(139,92,246,0.35)] transition-all duration-500 cursor-pointer active:scale-95 z-20 ${
              voiceState === 'listening'
                ? 'bg-gradient-to-tr from-[#6d28d9] via-[#8b5cf6] to-[#ec4899] shadow-[#8b5cf6]/50 scale-105 ring-4 ring-purple-400/40'
                : voiceState === 'speaking'
                ? 'bg-gradient-to-tr from-[#0284c7] via-[#38bdf8] to-[#6366f1] shadow-[#38bdf8]/50 scale-105 ring-4 ring-cyan-300/40 animate-pulse'
                : voiceState === 'processing'
                ? 'bg-gradient-to-tr from-[#d97706] via-[#f59e0b] to-[#10b981] shadow-[#f59e0b]/50 ring-4 ring-amber-400/40'
                : 'bg-gradient-to-tr from-[#2e2667] via-[#503bbf] to-[#794ef7] shadow-[#794ef7]/30 hover:scale-105'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              {voiceState === 'listening' && (
                <Mic size={56} className="text-white drop-shadow-lg animate-pulse" />
              )}
              {voiceState === 'speaking' && (
                <Volume2 size={56} className="text-white drop-shadow-lg animate-bounce" />
              )}
              {voiceState === 'processing' && (
                <RefreshCw size={52} className="text-white drop-shadow-lg animate-spin" />
              )}
              {voiceState === 'idle' && (
                <Mic size={56} className="text-white/80 hover:text-white transition-colors" />
              )}
            </div>
          </button>
        </div>

        {/* Voice State Title Text */}
        <div className="mt-8 text-center z-10">
          <p className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center justify-center gap-2.5">
            {voiceState === 'listening' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                Listening to your voice...
              </>
            )}
            {voiceState === 'speaking' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                NovaMind AI is speaking...
              </>
            )}
            {voiceState === 'processing' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                Thinking...
              </>
            )}
            {voiceState === 'idle' && 'Tap orb to start talking'}
          </p>
        </div>
      </div>

      {/* Floating Live Subtitles Transcript Bar (Middle-Bottom) */}
      <div className="w-full max-w-xl bg-[#12121c]/90 border border-[#262638] rounded-2xl p-3 min-h-[56px] max-h-28 overflow-y-auto mb-3 text-center z-20 backdrop-blur-md shadow-xl">
        {transcript ? (
          <p className="text-sm text-slate-100 font-medium leading-relaxed animate-in fade-in duration-150">
            "{transcript}"
          </p>
        ) : voiceState === 'listening' ? (
          <p className="text-xs text-slate-400 italic">Speak clearly into your microphone...</p>
        ) : voiceState === 'speaking' ? (
          <p className="text-xs text-cyan-300 font-medium">Listening to NovaMind AI answer...</p>
        ) : (
          <p className="text-xs text-slate-400 italic">Hands-free voice mode active. Say or type anything!</p>
        )}
      </div>

      {/* Type Text Field in Voice Mode */}
      <form
        onSubmit={handleSendTypedInput}
        className="w-full max-w-xl flex items-center gap-2 px-4 py-2 bg-[#141420]/95 border border-[#2a2a3c] focus-within:border-purple-500/70 focus-within:ring-2 focus-within:ring-purple-500/30 rounded-full mb-4 z-20 backdrop-blur-xl transition-all shadow-xl"
      >
        <MessageSquare size={16} className="text-[#a78bfa] shrink-0 ml-1" />
        <input
          type="text"
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          placeholder="Type any question to get a spoken voice answer..."
          className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none px-2"
        />
        <button
          type="submit"
          disabled={!typedInput.trim()}
          className="p-2 rounded-full bg-gradient-to-r from-[#794ef7] to-[#9365e6] hover:from-[#6b3ff5] hover:to-[#8253dd] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer shadow-md active:scale-95"
          title="Send text for voice explanation"
        >
          <Send size={14} />
        </button>
      </form>

      {/* Bottom Floating Control Bar (Matching Official ChatGPT Bottom Toolbar in Screenshot 2) */}
      <div className="w-full max-w-md flex items-center justify-between px-6 py-3.5 bg-[#14141d] border border-[#272738] rounded-full shadow-2xl z-20 backdrop-blur-xl">
        {/* Mute Mic Button */}
        <button
          onClick={() => {
            if (isMuted) {
              setIsMuted(false);
              startListening();
            } else {
              setIsMuted(true);
              stopListening();
              setVoiceState('idle');
            }
          }}
          className={`p-3 rounded-full transition-all cursor-pointer ${
            isMuted
              ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
              : 'bg-[#222230] text-slate-200 hover:text-white'
          }`}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Send Spoken Transcript Button if present */}
        {transcript.trim() ? (
          <button
            onClick={() => handleSendSpokenText()}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#4d3df2] to-[#794ef7] hover:opacity-95 text-white rounded-full font-bold text-xs shadow-lg shadow-[#4d3df2]/40 transition-all cursor-pointer active:scale-95 animate-in zoom-in-95 duration-100"
          >
            <Send size={15} />
            <span>Send</span>
          </button>
        ) : (
          <span className="text-xs font-semibold text-slate-400">NovaMind Voice</span>
        )}

        {/* End Call / Close Button */}
        <button
          onClick={onClose}
          className="p-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-full transition-all cursor-pointer"
          title="End Voice Call"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
