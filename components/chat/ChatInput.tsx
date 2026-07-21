'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Paperclip, Loader2, FileText, X, ChevronDown, Sparkles, Zap, Bot, Mic, Square } from 'lucide-react';
import { chatService } from '../../services/chat.service';
import { settingsService, ProviderStatus } from '../../services/settings.service';

interface ChatInputProps {
  roomId: string;
  isNewRoom?: boolean;
  onSendMessage: (
    content: string,
    type?: 'text' | 'image' | 'file',
    fileUrl?: string,
    fileName?: string,
    model?: string
  ) => void;
  onTyping: (isTyping: boolean) => void;
}

interface AttachedFile {
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface ModelItem {
  id: string;
  name: string;
  badge: string;
  description: string;
  providerId: string;
  providerName: string;
  configured: boolean;
}

// Map provider ids to icons & colors
const PROVIDER_STYLE: Record<string, { icon: React.ReactNode; gradient: string; badgeColor: string }> = {
  gemini: {
    icon: <Sparkles size={11} />,
    gradient: 'from-blue-500 to-violet-500',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  groq: {
    icon: <Zap size={11} />,
    gradient: 'from-orange-500 to-red-500',
    badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  huggingface: {
    icon: <Bot size={11} />,
    gradient: 'from-yellow-500 to-amber-500',
    badgeColor: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  },
  deepseek: {
    icon: <Bot size={11} />,
    gradient: 'from-teal-500 to-emerald-500',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  },

  cloudflare: {
    icon: <Zap size={11} />,
    gradient: 'from-orange-500 to-amber-500',
    badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  blackforest: {
    icon: <Image size={11} />,
    gradient: 'from-amber-500 to-orange-500',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  pollinations: {
    icon: <Sparkles size={11} />,
    gradient: 'from-pink-500 to-rose-500',
    badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  },
};

const DEFAULT_STYLE = {
  icon: <Bot size={11} />,
  gradient: 'from-slate-500 to-slate-600',
  badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
};

const formatTimeMinutes = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export function ChatInput({ roomId, isNewRoom, onSendMessage, onTyping }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Model selector state
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [defaultModelSetting, setDefaultModelSetting] = useState<string>('gemini-3.1-flash-lite');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch available models on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const [providers, settings] = await Promise.all([
          settingsService.getProviders(),
          settingsService.getSettings().catch(() => ({ defaultModel: 'gemini-3.1-flash-lite' })),
        ]);

        const allModels: ModelItem[] = [];
        providers.forEach((provider: ProviderStatus) => {
          if (provider.configured) {
            provider.models.forEach((m) => {
              allModels.push({
                id: m.id,
                name: m.name,
                badge: m.badge,
                description: m.description,
                providerId: provider.id,
                providerName: provider.name,
                configured: provider.configured,
              });
            });
          }
        });

        setModels(allModels);
        const dfModel = settings.defaultModel || 'gemini-3.1-flash-lite';
        setDefaultModelSetting(dfModel);
        setSelectedModel(dfModel);
      } catch (err) {
        console.error('Failed to load AI models:', err);
      }
    };

    fetchModels();
  }, []);

  // Reset selected model to default settings model for new rooms
  useEffect(() => {
    if (isNewRoom) {
      setSelectedModel(defaultModelSetting);
    }
  }, [roomId, isNewRoom, defaultModelSetting]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    if (showModelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModelDropdown]);

  const handleInputChange = (val: string) => {
    setContent(val);

    // Emit typing start
    onTyping(true);

    // Reset debounce timer for typing end
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  // Start recording voice
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_message_${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Stop all stream tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        // Upload and send directly
        try {
          setIsUploading(true);
          const data = await chatService.uploadChatFile(audioFile);
          
          onSendMessage(
            '🎤 Voice Message',
            'file',
            data.url,
            data.fileName,
            selectedModel || undefined
          );
        } catch (err: any) {
          console.error(err);
          alert('Failed to send voice message: ' + (err.response?.data?.message || err.message));
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop recording voice
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // Cancel recording voice
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      audioChunksRef.current = [];
      setRecordingTime(0);
    }
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10 MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      const data = await chatService.uploadChatFile(file);
      setAttachedFile({
        url: data.url,
        publicId: data.publicId,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
      });
    } catch (err: any) {
      console.error(err);
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const clearAttachment = () => {
    setAttachedFile(null);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !attachedFile) return;

    const msgContent = content.trim() || (attachedFile ? attachedFile.fileName : '');
    const msgType = attachedFile
      ? attachedFile.fileType.startsWith('image/')
        ? 'image'
        : 'file'
      : 'text';

    const modelOverride = selectedModel || undefined;

    onSendMessage(
      msgContent,
      msgType,
      attachedFile?.url,
      attachedFile?.fileName,
      modelOverride
    );

    setContent('');
    setAttachedFile(null);
    onTyping(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const currentModel = models.find((m) => m.id === selectedModel);
  const currentStyle = currentModel
    ? PROVIDER_STYLE[currentModel.providerId] || DEFAULT_STYLE
    : DEFAULT_STYLE;

  return (
    <div className="p-4 flex flex-col gap-2 shrink-0 bg-[#ffffff] dark:bg-[#0c0a1b] w-full border-t border-slate-100 dark:border-slate-800/40">
      
      {/* Attached File Preview */}
      {attachedFile && (
        <div className="px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-850/40 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-150 relative mb-1 max-w-md">
          {attachedFile.fileType.startsWith('image/') ? (
            <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
              <img
                src={attachedFile.url}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shrink-0">
              <FileText size={18} />
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {attachedFile.fileName}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
              {(attachedFile.fileSize / 1024).toFixed(1)} KB · Ready to send
            </p>
          </div>
          <button
            type="button"
            onClick={clearAttachment}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Uploading State indicator */}
      {isUploading && (
        <div className="px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-850/40 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-150 mb-1 max-w-md">
          <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Loader2 size={16} className="animate-spin" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Uploading attachment...
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
              Sending file to server
            </p>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
      />

      {/* Input box card */}
      <form onSubmit={handleSend} className="w-full flex flex-col border border-slate-200/80 dark:border-[#2a2455]/40 rounded-[22px] bg-white dark:bg-[#121025] p-3 gap-2 relative shadow-sm">
        {/* Top: Writing Area */}
        {isRecording ? (
          <div className="flex-1 flex items-center justify-between px-3 py-2 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-450">
              <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-500 animate-ping shrink-0" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide">
                Recording: {formatTimeMinutes(recordingTime)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 hover:text-rose-650 rounded-lg cursor-pointer transition-colors"
                title="Cancel Recording"
              >
                <X size={15} />
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="p-1.5 bg-rose-650 hover:bg-rose-700 text-white rounded-lg cursor-pointer transition-colors"
                title="Stop & Send Voice"
              >
                <Square size={11} className="fill-current" />
              </button>
            </div>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={attachedFile ? "Add a message..." : "Ask me anything..."}
            className="w-full bg-transparent border-0 focus:ring-0 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none resize-none min-h-[36px] max-h-[140px] px-1 py-1"
          />
        )}

        {/* Bottom Row: Actions Bar */}
        <div className="flex items-center justify-between mt-1 shrink-0 px-1">
          {/* Left Side toolbar options */}
          <div className="flex items-center gap-2">
            {/* Model switcher ("Use Tools" / selected model name) */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#f0edff] dark:bg-[#1a1636] hover:bg-[#e5e1ff] dark:hover:bg-[#231e4a] border border-[#dcd8f8]/60 dark:border-[#382b6b]/40 rounded-full text-[11px] font-bold text-[#794ef7] dark:text-[#a78bfa] transition-all cursor-pointer`}
                title="Switch AI Model"
              >
                <span className="shrink-0">
                  {currentStyle.icon}
                </span>
                <span>{currentModel?.name || 'Use Tools'}</span>
                <ChevronDown
                  size={11}
                  className={`transition-transform duration-200 ${showModelDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Model selection dropdown panel */}
              {showModelDropdown && (
                <div className="absolute bottom-full left-0 mb-2.5 w-64 sm:w-72 bg-white dark:bg-[#121025] border border-slate-200 dark:border-[#2f275e]/60 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-[#221d45]/40">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Select AI Model
                    </p>
                  </div>
                  <div className="max-h-[240px] overflow-y-auto py-1.5">
                    {models.map((model) => {
                      const style = PROVIDER_STYLE[model.providerId] || DEFAULT_STYLE;
                      const isSelected = model.id === selectedModel;
                      const isDisabled = !model.configured;
                      const isImageCapable = model.badge.includes('Image') || model.id.includes('flux') || model.id.includes('image') || model.providerId === 'gemini';

                      return (
                        <button
                          key={model.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full flex items-start gap-3 px-3.5 py-2 sm:py-2.5 text-left transition-all cursor-pointer ${
                            isDisabled
                              ? 'opacity-40 cursor-not-allowed'
                              : isSelected
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/20'
                              : 'hover:bg-slate-50 dark:hover:bg-[#201c45]/45'
                          }`}
                        >
                          <div className={`mt-0.5 flex items-center justify-center w-6.5 h-6.5 rounded-lg bg-gradient-to-br ${style.gradient} text-white shrink-0 shadow-sm`}>
                            {style.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[12.5px] font-bold truncate ${isSelected ? 'text-[#794ef7] dark:text-[#a78bfa]' : 'text-slate-800 dark:text-slate-200'}`}>
                                {model.name}
                              </span>
                              <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-0.5 ${
                                isImageCapable
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20'
                                  : style.badgeColor
                              }`}>
                                {isImageCapable && <Image size={9} className="shrink-0" />}
                                {model.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight truncate">
                              {isDisabled ? `Requires ${model.providerId.toUpperCase()}_API_KEY` : model.description || model.providerName}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#794ef7] shrink-0 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Media Attachment buttons */}
            <div className="flex items-center gap-0.5 text-slate-400 shrink-0">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploading}
                className="p-1.5 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Attach Image"
              >
                <Image size={16} />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-1.5 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Attach File"
              >
                <Paperclip size={16} />
              </button>
            </div>
          </div>

          {/* Right Side: Action send trigger */}
          <div className="flex items-center">
            {!isRecording && (
              content.trim() || attachedFile ? (
                <button
                  type="submit"
                  className="w-8 h-8 bg-gradient-to-r from-[#4d3df2] to-[#794ef7] hover:opacity-95 text-white rounded-full shadow-md shadow-[#4d3df2]/15 transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 animate-in zoom-in-75 duration-100"
                  title="Send Message"
                >
                  <Send size={12} className="text-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isUploading}
                  className="w-8 h-8 bg-[#f0edff] hover:bg-[#e5e1ff] dark:bg-[#1a1636] dark:hover:bg-[#231e4a] text-[#794ef7] dark:text-[#a78bfa] rounded-full border border-[#dcd8f8]/60 dark:border-[#382b6b]/40 transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 disabled:opacity-50"
                  title="Record Voice Note"
                >
                  <Mic size={12} />
                </button>
              )
            )}
          </div>
        </div>
      </form>

      {/* Footer copyright warning notice */}
      <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center select-none mt-1 leading-normal">
        NovaMind can make mistakes. Consider checking important information.
      </div>
    </div>
  );
}
