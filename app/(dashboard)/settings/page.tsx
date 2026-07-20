'use client';

import React, { useState, useEffect } from 'react';
import { settingsService, ProviderStatus } from '../../../services/settings.service';
import { useTheme } from '../../../hooks/useTheme';
import { useUiStore } from '../../../store/uiStore';
import { useAuth } from '../../../hooks/useAuth';
import {
  CheckCircle,
  Save,
  Cpu,
  Sliders,
  Sparkles,
  Activity,
  Check,
  Volume2,
  Info,
  Zap,
  ShieldCheck,
  ShieldX,
  ChevronRight,
  HelpCircle,
  Bot,
  Image,
  Loader2,
  Sun,
  Moon,
  Laptop,
  Paintbrush,
  Menu,
} from 'lucide-react';

export default function SettingsPage() {
  const { theme: currentTheme, setTheme } = useTheme();
  const {
    toggleSidebar,
    accentColor: storeAccentColor,
    fontSize: storeFontSize,
    messageStyle: storeMessageStyle,
    setAccentColor: setStoreAccentColor,
    setFontSize: setStoreFontSize,
    setMessageStyle: setStoreMessageStyle
  } = useUiStore();
  const { user } = useAuth();
  const [providers, setProviders]             = useState<ProviderStatus[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [isSaved, setIsSaved]                 = useState(false);
  const [errorMessage, setErrorMessage]       = useState<string | null>(null);

  // Form states (synced with DB)
  const [defaultModel, setDefaultModel]       = useState('gemini-3.1-flash-lite');
  const [temperature, setTemperature]         = useState(0.8);
  const [maxTokens, setMaxTokens]             = useState(2048);
  const [notifications, setNotifications]     = useState(true);
  const [systemInstructions, setSystemInstructions] = useState('You are NovaMind AI, a helpful AI assistant.');
  const [themeState, setThemeState]           = useState<'light' | 'dark' | 'system'>('system');

  // Interactive Appearance / mock settings to match screenshot design
  const [accentColor, setAccentColorState]    = useState(storeAccentColor);
  const [fontSize, setFontSizeState]          = useState<'small' | 'medium' | 'large'>(storeFontSize);
  const [messageStyle, setMessageStyleState]  = useState<'compact' | 'comfortable'>(storeMessageStyle);

  // Sync with store on mount/change
  useEffect(() => {
    setAccentColorState(storeAccentColor);
    setFontSizeState(storeFontSize);
    setMessageStyleState(storeMessageStyle);
  }, [storeAccentColor, storeFontSize, storeMessageStyle]);

  /* ── Load everything in parallel ────────────────────────────────────────── */
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [provData, settingsData] = await Promise.all([
          settingsService.getProviders(),
          settingsService.getSettings(),
        ]);

        setProviders(provData);

        if (settingsData) {
          const m = settingsData.defaultModel || 'gemini-3.1-flash-lite';
          setDefaultModel(m);
          setTemperature(settingsData.temperature ?? 0.8);
          setMaxTokens(settingsData.maxTokens ?? 2048);
          setNotifications(settingsData.notificationsEnabled ?? true);
          setSystemInstructions(settingsData.systemInstructions ?? 'You are NovaMind AI, a helpful AI assistant.');
          setThemeState((settingsData.theme as 'light' | 'dark' | 'system') || 'system');
        }
      } catch (err: any) {
        console.error(err);
        setErrorMessage('Failed to load settings. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── Save ─────────────────────────────────────────────────────────────────*/
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage(null);
      await settingsService.updateSettings({ 
        defaultModel, 
        temperature, 
        maxTokens, 
        notificationsEnabled: notifications, 
        systemInstructions,
        theme: themeState
      });
      
      // Update the active UI theme context
      setTheme(themeState);
      setStoreAccentColor(accentColor);
      setStoreFontSize(fontSize);
      setStoreMessageStyle(messageStyle);
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch {
      setErrorMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading skeleton ─────────────────────────────────────────────────────*/
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f8fafc] dark:bg-[#0b0a1a] min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-[#794ef7] animate-spin" />
          <p className="text-sm font-semibold text-slate-505 dark:text-slate-400 animate-pulse">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8fafc] dark:bg-[#0b0a1a] select-none w-full animate-in fade-in duration-300">
      
      {/* Unified Top Header Bar (h-20) */}
      <header className="h-20 border-b border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0a1b] px-4 sm:px-6 flex items-center justify-between shrink-0 relative z-30 transition-colors duration-300">
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger menu button on mobile */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 -ml-2 hover:bg-slate-50 dark:hover:bg-[#1a1738]/50 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer lg:hidden flex items-center justify-center shrink-0"
            title="Toggle Navigation Menu"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex flex-col text-left">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-850 dark:text-slate-100 leading-tight">
              Settings
            </h2>
            <span className="text-[10px] text-slate-400 mt-0.5 leading-none">
              Customize your AI assistant experience.
            </span>
          </div>
        </div>
        
        {/* Right side: Actions / theme / profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Save changes button */}
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#794ef7] hover:bg-[#683ee3] disabled:bg-[#794ef7]/60 text-white font-semibold text-xs rounded-xl shadow-md shadow-[#794ef7]/10 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <CheckCircle size={13} />
            )}
            <span>Save Changes</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setThemeState(themeState === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-[#1a1738]/50 transition-colors cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {themeState === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Status Profile Badge */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] dark:bg-[#15122b]/50 border border-slate-200/50 dark:border-slate-800/40 rounded-full select-none shrink-0">
              <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-tr from-[#5f3be3] to-[#794ef7] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#d2ceff]/30">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-left min-w-[40px]">
                <span className="text-[11px] font-bold text-slate-850 dark:text-white leading-none">
                  {user.name}
                </span>
                <span className="text-[8px] text-emerald-500 font-bold flex items-center gap-0.5 mt-0.5 leading-none">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Settings Form Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full">
        <form onSubmit={handleSave} className="flex flex-col gap-6 w-full pb-10 max-w-7xl mx-auto">
          
          {/* Toast Alerts inside Settings area */}
          {isSaved && (
            <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-450 rounded-xl text-sm flex items-center gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200">
              <CheckCircle size={18} className="text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold">Settings saved successfully!</span> Your AI model preferences are updated.
              </div>
            </div>
          )}
          {errorMessage && (
            <div className="p-4 bg-rose-50/90 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-455 rounded-xl text-sm flex items-center gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200">
              <Info size={18} className="text-rose-500 shrink-0" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* ── SECTION 1: AI Model Cards ───────────────────────────────── */}
          <div className="bg-white dark:bg-[#12112a] border border-[#e2e8f0] dark:border-[#201e3d] rounded-2xl p-5 sm:p-6 flex flex-col gap-6 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#f3f0ff] dark:bg-[#231d45] text-[#794ef7] dark:text-[#a78bfa] flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm sm:text-base">AI Model</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose the AI model that best fits your needs.
                </p>
              </div>
            </div>

            {/* Dynamic cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
              {providers.filter(p => p.configured).flatMap(provider => 
                provider.models.map((model) => {
                  const active = defaultModel === model.id;
                  
                  // Get provider icon
                  let modelIcon = (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-500" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  );
                  if (provider.id === 'gemini') {
                    modelIcon = (
                      <svg viewBox="0 0 24 24" className={`w-5.5 h-5.5 ${active ? 'text-[#794ef7] dark:text-[#a78bfa]' : 'text-blue-500'}`} fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    );
                  } else if (provider.id === 'groq') {
                    modelIcon = <Zap className={`w-5 h-5 ${active ? 'text-[#794ef7] dark:text-[#a78bfa]' : 'text-emerald-500'}`} />;
                  } else if (provider.id === 'huggingface') {
                    modelIcon = <Bot className={`w-5 h-5 ${active ? 'text-[#794ef7] dark:text-[#a78bfa]' : 'text-yellow-550'}`} />;
                  } else if (provider.id === 'cloudflare') {
                    modelIcon = <Zap className={`w-5 h-5 ${active ? 'text-[#794ef7] dark:text-[#a78bfa]' : 'text-orange-500'}`} />;
                  } else if (provider.id === 'blackforest') {
                    modelIcon = <Image className={`w-5 h-5 ${active ? 'text-[#794ef7] dark:text-[#a78bfa]' : 'text-amber-550'}`} />;
                  }

                  return (
                    <div
                      key={model.id}
                      onClick={() => provider.configured && setDefaultModel(model.id)}
                      className={`flex flex-col justify-between p-4 rounded-xl border-2 transition-all relative min-h-[145px] select-none ${
                        active
                          ? 'border-[#794ef7] bg-[#fbfaff] dark:bg-[#181535] shadow-[0_4px_12px_rgba(121,78,247,0.06)]'
                          : !provider.configured
                            ? 'border-slate-200 dark:border-slate-800 opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-900/10'
                            : 'border-[#e2e8f0] dark:border-[#201e3d] bg-white dark:bg-[#12112a] hover:border-slate-350 dark:hover:border-slate-700 cursor-pointer hover:scale-[1.005]'
                      }`}
                    >
                      {/* Card Top: Logo and Select Radio Button */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="p-1 rounded-lg">
                          {modelIcon}
                        </div>
                        
                        {active ? (
                          <div className="w-5 h-5 rounded-full border-2 border-[#794ef7] flex items-center justify-center bg-white dark:bg-[#12112a] shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#794ef7]" />
                          </div>
                        ) : !provider.configured ? (
                          <div className="text-[8px] font-black uppercase text-slate-450 dark:text-slate-500 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 shrink-0">
                            Locked
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-650 shrink-0" />
                        )}
                      </div>

                      {/* Card Bottom: Name, Badge, and Description */}
                      <div className="mt-4">
                        <div className="flex flex-col gap-1">
                          <span className={`font-bold text-xs sm:text-sm ${active ? 'text-[#794ef7] dark:text-[#a78bfa]' : 'text-slate-800 dark:text-slate-200'}`}>
                            {model.name}
                          </span>
                          
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              active
                                ? 'text-[#794ef7] bg-[#f3f0ff] dark:bg-[#231d45]'
                                : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                            }`}>
                              {model.badge}
                            </span>
                            
                            {model.id === 'gemini-3.1-flash-lite' && (
                              <span className="text-[8.5px] font-black text-[#794ef7] bg-[#f3f0ff] dark:bg-[#231d45] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                Recommended
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-[11px] text-slate-400 mt-2.5 leading-snug">
                          {model.description}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── SECTION 2: Appearance ───────────────────────────────────── */}
          <div className="bg-white dark:bg-[#12112a] border border-[#e2e8f0] dark:border-[#201e3d] rounded-2xl p-5 sm:p-6 flex flex-col gap-6 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#f3f0ff] dark:bg-[#231d45] text-[#794ef7] dark:text-[#a78bfa] flex items-center justify-center shrink-0">
                <Paintbrush size={16} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-105 text-sm sm:text-base">Appearance</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Personalize the look and feel.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full">
              
              {/* Theme (Col Span 4) */}
              <div className="lg:col-span-4 md:col-span-6 col-span-12 flex flex-col gap-3 w-full">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-355">Theme</span>
                <div className="flex bg-[#f8fafc] dark:bg-[#0b0a1a] border border-[#e2e8f0] dark:border-[#201e3d] rounded-xl p-1 gap-1 w-full">
                  {[
                    { id: 'light', name: 'Light', icon: <Sun size={13} /> },
                    { id: 'dark', name: 'Dark', icon: <Moon size={13} /> },
                    { id: 'system', name: 'System', icon: <Laptop size={13} /> }
                  ].map((t) => {
                    const active = themeState === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setThemeState(t.id as any)}
                        className={`flex-1 px-3 py-2 flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          active
                            ? 'bg-white dark:bg-[#12112a] border border-[#e2e8f0] dark:border-[#201e3d] text-[#794ef7] dark:text-[#a78bfa] shadow-sm'
                            : 'text-slate-500 dark:text-slate-455 hover:text-slate-750 dark:hover:text-slate-200'
                        }`}
                      >
                        {t.icon}
                        <span>{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color (Col Span 4) */}
              <div className="lg:col-span-4 md:col-span-6 col-span-12 flex flex-col gap-3 w-full">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-355">Accent Color</span>
                <div className="flex flex-wrap items-center gap-3 py-1 w-full">
                  {[
                    { id: 'purple', hex: '#794ef7', class: 'bg-[#794ef7]' },
                    { id: 'blue', hex: '#3b82f6', class: 'bg-[#3b82f6]' },
                    { id: 'teal', hex: '#14b8a6', class: 'bg-[#14b8a6]' },
                    { id: 'green', hex: '#22c55e', class: 'bg-[#22c55e]' },
                    { id: 'orange', hex: '#f97316', class: 'bg-[#f97316]' },
                    { id: 'pink', hex: '#ec4899', class: 'bg-[#ec4899]' }
                  ].map((color) => {
                    const active = accentColor === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setAccentColorState(color.id)}
                        className={`w-6.5 h-6.5 rounded-full cursor-pointer transition-all hover:scale-105 flex items-center justify-center ${color.class} ${
                          active
                            ? 'ring-2 ring-offset-2 ring-[#794ef7] dark:ring-offset-[#12112a]'
                            : ''
                        }`}
                      >
                        {active && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size & Message Style (Col Span 4) */}
              <div className="lg:col-span-4 md:col-span-12 col-span-12 flex flex-col gap-4 w-full">
                
                {/* Font Size */}
                <div className="flex flex-col gap-3 w-full">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-355">Font Size</span>
                  <div className="flex bg-[#f8fafc] dark:bg-[#0b0a1a] border border-[#e2e8f0] dark:border-[#201e3d] rounded-xl p-1 gap-1 w-full">
                    {[
                      { id: 'small', name: 'Small' },
                      { id: 'medium', name: 'Medium' },
                      { id: 'large', name: 'Large' }
                    ].map((size) => {
                      const active = fontSize === size.id;
                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => setFontSizeState(size.id as any)}
                          className={`flex-1 px-3 py-2 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-white dark:bg-[#12112a] border border-[#e2e8f0] dark:border-[#201e3d] text-[#794ef7] dark:text-[#a78bfa] shadow-sm'
                              : 'text-slate-500 dark:text-slate-455 hover:text-slate-750 dark:hover:text-slate-200'
                          }`}
                        >
                          {size.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message Style */}
                <div className="flex flex-col gap-3 w-full">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-355">Message Style</span>
                  <div className="flex bg-[#f8fafc] dark:bg-[#0b0a1a] border border-[#e2e8f0] dark:border-[#201e3d] rounded-xl p-1 gap-1 w-full">
                    {[
                      { id: 'compact', name: 'Compact' },
                      { id: 'comfortable', name: 'Comfortable' }
                    ].map((style) => {
                      const active = messageStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setMessageStyleState(style.id as any)}
                          className={`flex-1 px-3 py-2 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-white dark:bg-[#12112a] border border-[#e2e8f0] dark:border-[#201e3d] text-[#794ef7] dark:text-[#a78bfa] shadow-sm'
                              : 'text-slate-500 dark:text-slate-455 hover:text-slate-755 dark:hover:text-slate-200'
                          }`}
                        >
                          {style.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Secure Info Alert */}
          <div className="flex items-center justify-center gap-2 py-4 text-slate-400 select-none">
            <svg className="w-4 h-4 text-slate-450 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-[10px] sm:text-xs font-semibold text-center leading-normal">Your data and preferences are secure and encrypted.</span>
          </div>
        </form>
      </div>
    </div>
  );
}
