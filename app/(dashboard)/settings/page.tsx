'use client';

import React, { useState, useEffect } from 'react';
import { ThemeToggle } from '../../../components/common/ThemeToggle';
import { settingsService, UserSettings, ProviderStatus } from '../../../services/settings.service';
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
} from 'lucide-react';

/* ─── Provider brand colours ─────────────────────────────────────────────── */
const PROVIDER_STYLES: Record<string, {
  ring: string; bg: string; activeBg: string; badge: string; dot: string; title: string;
}> = {
  gemini: {
    ring:      'border-blue-500',
    bg:        'from-blue-50/60 to-indigo-50/30 dark:from-blue-950/20 dark:to-slate-900',
    activeBg:  'from-blue-50/60 to-indigo-50/30 dark:from-blue-950/20 dark:to-slate-900',
    badge:     'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    dot:       'bg-blue-500',
    title:     'text-blue-600 dark:text-blue-400',
  },
  groq: {
    ring:      'border-emerald-500',
    bg:        'from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/20 dark:to-slate-900',
    activeBg:  'from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/20 dark:to-slate-900',
    badge:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    dot:       'bg-emerald-500',
    title:     'text-emerald-600 dark:text-emerald-400',
  },
  huggingface: {
    ring:      'border-yellow-500 border-2',
    bg:        'from-yellow-50/60 to-amber-50/30 dark:from-yellow-950/20 dark:to-slate-900',
    activeBg:  'from-yellow-50/60 to-amber-50/30 dark:from-yellow-950/20 dark:to-slate-900',
    badge:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
    dot:       'bg-yellow-500',
    title:     'text-yellow-600 dark:text-yellow-400',
  },
  blackforest: {
    ring:      'border-amber-500 border-2',
    bg:        'from-amber-50/60 to-orange-50/30 dark:from-amber-950/20 dark:to-slate-900',
    activeBg:  'from-amber-50/60 to-orange-50/30 dark:from-amber-950/20 dark:to-slate-900',
    badge:     'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    dot:       'bg-amber-500',
    title:     'text-amber-600 dark:text-amber-400',
  },
};

export default function SettingsPage() {
  const [providers, setProviders]             = useState<ProviderStatus[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [isSaved, setIsSaved]                 = useState(false);
  const [errorMessage, setErrorMessage]       = useState<string | null>(null);

  // Which provider tab is expanded
  const [activeProvider, setActiveProvider]   = useState<string>('gemini');

  // Form states (synced with DB)
  const [defaultModel, setDefaultModel]       = useState('gemini-3.1-flash-lite');
  const [temperature, setTemperature]         = useState(0.8);
  const [maxTokens, setMaxTokens]             = useState(2048);
  const [notifications, setNotifications]     = useState(true);
  const [systemInstructions, setSystemInstructions] = useState('You are NovaMind AI, a helpful AI assistant.');

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

          // Expand the provider that owns the saved model
          const ownerProvider = provData.find(p => p.models.some(mo => mo.id === m));
          if (ownerProvider) setActiveProvider(ownerProvider.id);
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
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage(null);
      await settingsService.updateSettings({ defaultModel, temperature, maxTokens, notificationsEnabled: notifications, systemInstructions });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch {
      setErrorMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Helpers ──────────────────────────────────────────────────────────────*/
  const tempLabel = (v: number) => {
    if (v < 0.3) return 'Highly Precise & Analytical';
    if (v < 0.6) return 'Focused & Balanced';
    if (v < 0.9) return 'Default — Creative & Conversational';
    if (v < 1.3) return 'Highly Creative & Diverse';
    return 'Exploratory & Experimental';
  };

  const isModelSelected = (id: string) => defaultModel === id;

  /* ── Loading skeleton ─────────────────────────────────────────────────────*/
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
            Loading your workspace settings…
          </p>
        </div>
      </div>
    );
  }

  /* ── Page ──────────────────────────────────────────────────────────────────*/
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto flex flex-col gap-8 select-none">

      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-white dark:to-indigo-200 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Choose your AI provider, tune model parameters, and customise your workspace.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-8">

        {/* Toast — success */}
        {isSaved && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle size={18} className="text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="font-bold">Preferences saved!</p>
              <p className="text-xs opacity-80">Your AI assistant is now using <span className="font-semibold">{defaultModel}</span>.</p>
            </div>
          </div>
        )}

        {/* Toast — error */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl text-sm flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
              <Info size={18} className="text-rose-500" />
            </div>
            <p className="font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* ── SECTION 1: AI Provider & Model ─────────────────────────────── */}
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col gap-6 transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="text-indigo-600 dark:text-indigo-400" size={20} />
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">AI Provider &amp; Model</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Select your provider, then pick the exact model. API key status is shown in real time.
            </p>
          </div>

          {/* Provider tabs */}
          <div className="flex flex-col gap-3">
            {providers.map((provider) => {
              const styles   = PROVIDER_STYLES[provider.id] || PROVIDER_STYLES.gemini;
              const isActive = activeProvider === provider.id;
              const hasModel = provider.models.some(m => isModelSelected(m.id));

              return (
                <div key={provider.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 transition-all duration-300">

                  {/* Provider header / tab */}
                  <button
                    type="button"
                    onClick={() => setActiveProvider(isActive ? '' : provider.id)}
                    className={`flex items-center justify-between w-full px-5 py-4 transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-r ${styles.bg}`
                        : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Status dot */}
                      <div className="relative flex shrink-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          provider.configured
                            ? `bg-gradient-to-br ${styles.bg} ${isActive ? styles.ring : 'border border-slate-200 dark:border-slate-700'}`
                            : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {provider.id === 'gemini' && (
                            <svg viewBox="0 0 24 24" className={`w-5 h-5 ${provider.configured ? styles.title : 'text-slate-400'}`} fill="currentColor">
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {provider.id === 'groq' && (
                            <Zap className={`w-5 h-5 ${provider.configured ? styles.title : 'text-slate-400'}`} />
                          )}
                          {provider.id === 'huggingface' && (
                            <Bot className={`w-5 h-5 ${provider.configured ? styles.title : 'text-slate-400'}`} />
                          )}
                          {provider.id === 'blackforest' && (
                            <Image className={`w-5 h-5 ${provider.configured ? styles.title : 'text-slate-400'}`} />
                          )}
                        </div>
                        {/* configured dot */}
                        <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${provider.configured ? styles.dot : 'bg-slate-300 dark:bg-slate-600'}`} />
                      </div>

                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{provider.name}</span>
                          {provider.configured ? (
                            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
                              <ShieldCheck size={10} /> API Key Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <ShieldX size={10} /> Key Not Configured
                            </span>
                          )}
                          {hasModel && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                              <Check size={10} /> Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {provider.models.length} model{provider.models.length > 1 ? 's' : ''} available
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      size={18}
                      className={`text-slate-400 transition-transform duration-300 ${isActive ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {/* Model list — accordion body */}
                  {isActive && (
                    <div className="px-4 pb-4 pt-2 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                      {!provider.configured && (
                        <div className="mb-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                          <ShieldX size={14} className="shrink-0" />
                          <span>
                            <strong>API key not set.</strong> Add <code className="bg-amber-100 dark:bg-amber-800/40 px-1 rounded">
                              {provider.id === 'gemini' ? 'GEMINI_API_KEY' : 
                                provider.id === 'groq' ? 'GROQ_API_KEY' :
                                provider.id === 'huggingface' ? 'HUGGINGFACE_API_KEY' : 'BFL_API_KEY'}
                            </code> to your <code className="bg-amber-100 dark:bg-amber-800/40 px-1 rounded">backend/.env</code> file to activate this provider.
                          </span>
                        </div>
                      )}

                      {provider.models.map((model) => {
                        const selected  = isModelSelected(model.id);
                        const s         = styles;
                        return (
                          <div
                            key={model.id}
                            onClick={() => provider.configured && setDefaultModel(model.id)}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                              selected
                                ? `bg-gradient-to-r ${s.activeBg} ${s.ring} shadow-sm`
                                : provider.configured
                                  ? 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer'
                                  : 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {/* Radio */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              selected
                                ? `${s.ring} bg-white dark:bg-slate-900`
                                : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {selected && <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-bold text-sm ${selected ? styles.title : 'text-slate-900 dark:text-white'}`}>
                                  {model.name}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selected ? s.badge : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                  {model.badge}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {model.description}
                              </p>
                            </div>

                            {selected && (
                              <div className={`w-6 h-6 rounded-full ${s.dot} text-white flex items-center justify-center shrink-0`}>
                                <Check size={13} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 2: AI Hyperparameters ───────────────────────────────── */}
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col gap-6 transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sliders className="text-indigo-600 dark:text-indigo-400" size={20} />
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">AI Hyperparameters</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Fine-tune creativity, response length, and bot personality.
            </p>
          </div>

          <div className="flex flex-col gap-6">

            {/* Temperature */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  Temperature
                  <span className="text-slate-400" title="Higher = more creative, lower = more deterministic">
                    <HelpCircle size={13} />
                  </span>
                </span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg tabular-nums">
                  {temperature.toFixed(1)}
                </span>
              </div>

              {/* Custom track with coloured fill */}
              <div className="relative h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-100"
                  style={{ width: `${(temperature / 2) * 100}%` }}
                />
              </div>
              <input
                type="range" min="0.0" max="2.0" step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 opacity-0 absolute cursor-pointer"
                style={{ marginTop: '-8px' }}
              />

              {/* Visible slider on top */}
              <input
                type="range" min="0.0" max="2.0" step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer accent-indigo-600 -mt-4"
              />

              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Activity size={11} />
                Mode: <span className="font-semibold text-slate-500 dark:text-slate-300 ml-0.5">{tempLabel(temperature)}</span>
              </span>
            </div>

            {/* Max Tokens */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                Max Output Tokens
                <span className="text-slate-400" title="Limits the length of each AI reply.">
                  <HelpCircle size={13} />
                </span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="256" max="8192" step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white font-mono w-32"
                />
                <span className="text-xs text-slate-400">≈ {Math.round(maxTokens * 0.75)} words · typical range 1 024 – 4 096</span>
              </div>
            </div>

            {/* System Instructions */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                System Instructions
              </label>
              <textarea
                rows={3}
                value={systemInstructions}
                onChange={(e) => setSystemInstructions(e.target.value)}
                placeholder="Instruct the AI bot on how it should act…"
                className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white resize-y"
              />
              <p className="text-[10px] text-slate-400">
                Prepended to conversation context to direct personality, tone, and rules for the bot.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: Theme & Notifications ────────────────────────────── */}
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col gap-6 transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="text-indigo-600 dark:text-indigo-400" size={20} />
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Theme &amp; UI Preferences</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Visual styling and desktop notification settings.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Active Theme</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Light, dark, or follow system preference.</p>
              </div>
              <ThemeToggle />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Volume2 size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sound &amp; Desktop Notifications</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Play alerts when messages arrive.</p>
                </div>
              </div>
              <input
                type="checkbox" checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-5 w-5 cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className={`py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {saving ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <span>Saving Preferences…</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Save &amp; Apply Settings</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
