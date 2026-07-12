'use client';

import React from 'react';
import { useBackendHealth } from '../../hooks/useBackendHealth';

// ─────────────────────────────────────────────────────────
// Animated SVG Icons
// ─────────────────────────────────────────────────────────
function ServerOffIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20">
      <rect x="4" y="10" width="56" height="16" rx="4" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 2" opacity="0.4"/>
      <rect x="4" y="32" width="56" height="16" rx="4" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="52" cy="40" r="3" fill="#ef4444"/>
      <circle cx="44" cy="40" r="3" fill="#f97316" opacity="0.6"/>
      <line x1="10" y1="10" x2="54" y2="54" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// Offline Screen
// ─────────────────────────────────────────────────────────
function OfflineScreen({ retry, retryCount, lastChecked }: {
  retry: () => void;
  retryCount: number;
  lastChecked: Date | null;
}) {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    retry();
    setTimeout(() => setIsRetrying(false), 3000);
  };

  return (
    <div className="backend-offline-screen">
      {/* Animated background grid */}
      <div className="backend-offline-grid" aria-hidden="true" />

      {/* Glowing orb */}
      <div className="backend-offline-orb" aria-hidden="true" />

      <div className="backend-offline-card">
        {/* Icon */}
        <div className="backend-offline-icon-wrap">
          <ServerOffIcon />
        </div>

        {/* Title */}
        <h1 className="backend-offline-title">Backend Offline</h1>
        <p className="backend-offline-subtitle">
          Cannot connect to the NovaMind AI server.<br />
          Please make sure the backend is running on port&nbsp;
          <code className="backend-offline-code">5003</code>.
        </p>

        {/* Status details */}
        <div className="backend-offline-details">
          <div className="backend-offline-detail-row">
            <span className="backend-offline-dot offline" />
            <span>Server unreachable</span>
          </div>
          {retryCount > 0 && (
            <div className="backend-offline-detail-row">
              <span className="backend-offline-label">Attempts:</span>
              <span className="backend-offline-value">{retryCount}</span>
            </div>
          )}
          {lastChecked && (
            <div className="backend-offline-detail-row">
              <span className="backend-offline-label">Last checked:</span>
              <span className="backend-offline-value">
                {lastChecked.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Command hint */}
        <div className="backend-offline-cmd-box">
          <p className="backend-offline-cmd-label">Run in your backend terminal:</p>
          <code className="backend-offline-cmd">npm run dev</code>
        </div>

        {/* Retry button */}
        <button
          id="backend-retry-btn"
          onClick={handleRetry}
          disabled={isRetrying}
          className="backend-offline-retry-btn"
        >
          {isRetrying ? (
            <>
              <SpinnerIcon />
              <span>Checking...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              <span>Retry Connection</span>
            </>
          )}
        </button>

        <p className="backend-offline-auto-note">
          Auto-checking every 30 seconds
        </p>
      </div>

      <style>{`
        .backend-offline-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #030712;
          overflow: hidden;
        }
        .backend-offline-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(239,68,68,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239,68,68,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .backend-offline-orb {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: orbPulse 4s ease-in-out infinite;
        }
        @keyframes orbPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        }
        .backend-offline-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 1.5rem;
          padding: 2.5rem 2rem;
          max-width: 420px;
          width: 90%;
          backdrop-filter: blur(20px);
          box-shadow: 0 0 60px rgba(239, 68, 68, 0.08), 0 25px 50px rgba(0,0,0,0.5);
          animation: cardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .backend-offline-icon-wrap {
          color: #ef4444;
          margin-bottom: 0.5rem;
          animation: iconShake 0.6s ease 0.3s both;
        }
        @keyframes iconShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-6deg); }
          75% { transform: rotate(6deg); }
        }
        .backend-offline-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .backend-offline-subtitle {
          font-size: 0.9rem;
          color: #94a3b8;
          text-align: center;
          line-height: 1.6;
          margin: 0;
        }
        .backend-offline-code {
          background: rgba(239,68,68,0.12);
          color: #f87171;
          padding: 0.1em 0.4em;
          border-radius: 0.3em;
          font-family: monospace;
          font-size: 0.85em;
        }
        .backend-offline-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
          background: rgba(239,68,68,0.05);
          border: 1px solid rgba(239,68,68,0.1);
          border-radius: 0.75rem;
          padding: 0.875rem 1rem;
          font-size: 0.83rem;
        }
        .backend-offline-detail-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #94a3b8;
        }
        .backend-offline-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .backend-offline-dot.offline {
          background: #ef4444;
          box-shadow: 0 0 6px #ef4444;
          animation: dotBlink 1.5s ease-in-out infinite;
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .backend-offline-label { color: #64748b; }
        .backend-offline-value { color: #e2e8f0; font-weight: 500; }
        .backend-offline-cmd-box {
          width: 100%;
          background: #0f172a;
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 0.75rem;
          padding: 0.875rem 1rem;
        }
        .backend-offline-cmd-label {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0 0 0.4rem;
        }
        .backend-offline-cmd {
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          color: #a5f3fc;
          display: block;
        }
        .backend-offline-retry-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 2rem;
          border-radius: 0.75rem;
          font-size: 0.9rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(239,68,68,0.3);
          width: 100%;
          justify-content: center;
          margin-top: 0.25rem;
        }
        .backend-offline-retry-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(239,68,68,0.45);
        }
        .backend-offline-retry-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .backend-offline-retry-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .backend-offline-auto-note {
          font-size: 0.75rem;
          color: #475569;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Checking Screen
// ─────────────────────────────────────────────────────────
function CheckingScreen() {
  return (
    <div className="backend-checking-screen">
      <SpinnerIcon />
      <p className="backend-checking-text">Connecting to server...</p>
      <style>{`
        .backend-checking-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          background: #030712;
          color: #6366f1;
        }
        .backend-checking-text {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
          animation: fadePulse 1.5s ease-in-out infinite;
        }
        @keyframes fadePulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Guard Component
// ─────────────────────────────────────────────────────────
export function BackendGuard({ children }: { children: React.ReactNode }) {
  const { status, lastChecked, retryCount, retry } = useBackendHealth();

  if (status === 'checking') return <CheckingScreen />;
  if (status === 'offline') {
    return <OfflineScreen retry={retry} retryCount={retryCount} lastChecked={lastChecked} />;
  }

  return <>{children}</>;
}
