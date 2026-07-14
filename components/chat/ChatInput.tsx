'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Paperclip, Loader2, FileText, X } from 'lucide-react';
import { chatService } from '../../services/chat.service';

interface ChatInputProps {
  onSendMessage: (
    content: string,
    type?: 'text' | 'image' | 'file',
    fileUrl?: string,
    fileName?: string
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

export function ChatInput({ onSendMessage, onTyping }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    onSendMessage(
      msgContent,
      msgType,
      attachedFile?.url,
      attachedFile?.fileName
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

  return (
    <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      {/* Attached File Preview */}
      {attachedFile && (
        <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-150 relative">
          {attachedFile.fileType.startsWith('image/') ? (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
              <img
                src={attachedFile.url}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shrink-0">
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
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Uploading State indicator */}
      {isUploading && (
        <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-150">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Loader2 size={18} className="animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Uploading attachment...
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Sending file to Cloudinary
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

      <form onSubmit={handleSend} className="p-4 flex items-center gap-3">
        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Attach Image"
          >
            <Image size={20} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Attach File"
          >
            <Paperclip size={20} />
          </button>
        </div>

        <input
          type="text"
          value={content}
          onChange={handleInputChange}
          placeholder={attachedFile ? "Add a message..." : "Type a message..."}
          className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />

        <button
          type="submit"
          disabled={!content.trim() && !attachedFile}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/10 transition-all cursor-pointer flex items-center justify-center"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
