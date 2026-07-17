'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Paperclip, Loader2, FileText, X, ChevronDown, Sparkles, Zap, Bot, Mic, Square } from 'lucide-react';
import { chatService } from '../../services/chat.service';
import { settingsService, ProviderStatus } from '../../services/settings.service';

interface ChatInputProps {
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
    icon: <Sparkles size={14} />,
    gradient: 'from-blue-500 to-violet-500',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  groq: {
    icon: <Zap size={14} />,
    gradient: 'from-orange-500 to-red-500',
    badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  huggingface: {
    icon: <Bot size={14} />,
    gradient: 'from-yellow-500 to-amber-500',
    badgeColor: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  },
  blackforest: {
    icon: <Image size={14} />,
    gradient: 'from-amber-500 to-orange-500',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
};

const DEFAULT_STYLE = {
  icon: <Bot size={14} />,
  gradient: 'from-slate-500 to-slate-600',
  badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
};

const formatTimeMinutes = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export function ChatInput({ onSendMessage, onTyping }: ChatInputProps) {
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
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);

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
          settingsService.getSettings(),
        ]);

        const allModels: ModelItem[] = [];
        providers.forEach((provider: ProviderStatus) => {
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
        });

        setModels(allModels);
        setDefaultModel(settings.defaultModel);
        setSelectedModel(settings.defaultModel);
      } catch (err) {
        console.error('Failed to load AI models:', err);
      }
    };

    fetchModels();
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
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
          
          // Trigger message send immediately!
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

      // Start timer
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

    // Validate size (10MB limit)
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

    // Always send the selected model
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
    <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 relative w-full">
      {/* Attached File Preview */}
      {attachedFile && (
        <div className="px-3 sm:px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-150 relative">
          {attachedFile.fileType.startsWith('image/') ? (
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
              <img
                src={attachedFile.url}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shrink-0">
              <FileText size={18} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {attachedFile.fileName}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {(attachedFile.fileSize / 1024).toFixed(1)} KB · Ready to send
            </p>
          </div>
          <button
            type="button"
            onClick={clearAttachment}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Uploading State indicator */}
      {isUploading && (
        <div className="px-3 sm:px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-150">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Loader2 size={18} className="animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Uploading attachment...
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
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

      <form onSubmit={handleSend} className="p-2 sm:p-4 flex items-center gap-1.5 sm:gap-3 w-full max-w-full">

        {/* Left side: attachment buttons + model selector */}
        <div className="flex items-center gap-0.5 sm:gap-1 text-slate-400 shrink-0">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploading}
            className="p-1.5 sm:p-2 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Attach Image"
          >
            <Image size={18} className="sm:w-5 sm:h-5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-1.5 sm:p-2 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 hidden sm:block"
            title="Attach File"
          >
            <Paperclip size={20} />
          </button>

          {/* ═══════════════════ MODEL SELECTOR ═══════════════════ */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                showModelDropdown
                  ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title="Switch AI Model"
            >
              <span className={`flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br ${currentStyle.gradient} text-white rounded-[3px]`}>
                {currentStyle.icon}
              </span>
              <span className="hidden md:inline max-w-[80px] sm:max-w-[100px] truncate text-[11px] sm:text-xs">
                {currentModel?.name || 'Model'}
              </span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${showModelDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {/* ── Dropdown Panel ── */}
            {showModelDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-64 sm:w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl shadow-slate-200/50 dark:shadow-black/30 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
                {/* Header */}
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Select AI Model
                  </p>
                </div>

                {/* Model List */}
                <div className="max-h-[200px] sm:max-h-[240px] overflow-y-auto py-1.5">
                  {models.map((model) => {
                    const style = PROVIDER_STYLE[model.providerId] || DEFAULT_STYLE;
                    const isSelected = model.id === selectedModel;
                    const isDisabled = !model.configured;

                    return (
                      <button
                        key={model.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setShowModelDropdown(false);
                        }}
                        className={`w-full flex items-start gap-2.5 sm:gap-3 px-3 py-2 sm:py-2.5 text-left transition-all cursor-pointer ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed'
                            : isSelected
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                        }`}
                        title={isDisabled ? `Set ${model.providerId.toUpperCase()}_API_KEY in .env to enable` : model.description}
                      >
                        {/* Provider icon */}
                        <div className={`mt-0.5 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br ${style.gradient} text-white shrink-0 shadow-sm`}>
                          {style.icon}
                        </div>

                        {/* Model info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className={`text-[13px] sm:text-sm font-semibold truncate ${
                              isSelected
                                ? 'text-indigo-700 dark:text-indigo-300'
                                : 'text-slate-800 dark:text-slate-100'
                            }`}>
                              {model.name}
                            </span>
                            <span className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full whitespace-nowrap ${style.badgeColor}`}>
                              {model.badge}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight truncate">
                            {isDisabled
                              ? `Requires ${model.providerId.toUpperCase()}_API_KEY`
                              : model.providerName}
                          </p>
                        </div>

                        {/* Selected indicator */}
                        {isSelected && (
                          <div className="mt-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500 shrink-0 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

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
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg cursor-pointer transition-colors"
                title="Cancel Recording"
              >
                <X size={15} />
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="p-1 sm:p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer transition-colors"
                title="Stop & Send Voice"
              >
                <Square size={12} className="fill-current" />
              </button>
            </div>
          </div>
        ) : (
          <input
            type="text"
            value={content}
            onChange={handleInputChange}
            placeholder={attachedFile ? "Add message..." : "Type a message..."}
            className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner/5"
          />
        )}

        {!isRecording && (
          content.trim() || attachedFile ? (
            <button
              type="submit"
              className="p-2 sm:p-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white rounded-xl shadow-md shadow-indigo-500/15 transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
              title="Send Message"
            >
              <Send size={16} className="sm:w-4 sm:h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={isUploading}
              className="p-2 sm:p-2.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 border border-slate-250 dark:border-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 disabled:opacity-50"
              title="Record Voice Note"
            >
              <Mic size={16} className="sm:w-4 sm:h-4" />
            </button>
          )
        )}
      </form>
    </div>
  );
}
