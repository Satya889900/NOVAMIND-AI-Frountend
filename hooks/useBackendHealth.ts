'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type BackendStatus = 'checking' | 'online' | 'offline';

const HEALTH_URL = `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5002'}/api/v1/health`;
const POLL_INTERVAL_MS = 30_000; // re-check every 30 seconds
const TIMEOUT_MS = 5_000;        // 5 second timeout per request

export function useBackendHealth() {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(HEALTH_URL, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeout);
      setLastChecked(new Date());

      if (res.ok) {
        setStatus('online');
        setRetryCount(0);
      } else {
        setStatus('offline');
        setRetryCount((c) => c + 1);
      }
    } catch {
      setLastChecked(new Date());
      setStatus('offline');
      setRetryCount((c) => c + 1);
    }
  }, []);

  const retry = useCallback(() => {
    setStatus('checking');
    checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    // Initial check on mount
    checkHealth();

    // Poll every 30 seconds
    intervalRef.current = setInterval(checkHealth, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkHealth]);

  return { status, lastChecked, retryCount, retry };
}
