import React from 'react';
import Link from 'next/link';
import { Logo } from '../components/common/Logo';
import { MessageSquare, Shield, Zap, Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20 max-w-5xl mx-auto gap-12">
        <div className="flex flex-col gap-4 items-center">
          <span className="px-3.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-full border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-1.5 w-fit">
            <Sparkles size={12} /> Next-Gen Chat Application
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Real-time chat meets <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500">
              Artificial Intelligence
            </span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mt-4">
            Experience ultra-fast real-time messaging, secure group collaboration, and integrated smart AI assistants built to accelerate your workflow.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-center">
          <Link
            href="/chat"
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer text-lg"
          >
            Launch Chat App <MessageSquare size={20} />
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-lg"
          >
            Learn More
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 text-left">
          {/* Card 1 */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col gap-4 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Instant Messaging</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Connect instantly with typing indicators, online status tracker, and smooth media transfers.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col gap-4 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">AI-Powered Assitance</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Chat with smart AI companions within group channels or privately to summarize text and answer queries.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col gap-4 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Secure & Relialbe</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Enterprise-grade security keeping your confidential chats and workspace documents private.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 py-6 text-center text-sm text-slate-500 dark:text-slate-400 shrink-0">
        <p>&copy; {new Date().getFullYear()} NovaMind AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

