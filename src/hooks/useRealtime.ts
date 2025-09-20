import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export function useRealtimeActiveUsers(intervalMs = 10000) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    let timer: any;
    let mounted = true;
    async function tick() {
      try {
        const res = await fetch(`${API_BASE}/api/ga4-rt`);
        const data = await res.json();
        if (mounted) setActive(typeof data.activeUsers === 'number' ? data.activeUsers : null);
      } catch {
        if (mounted) setActive(null);
      } finally {
        timer = setTimeout(tick, intervalMs);
      }
    }
    tick();
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [intervalMs]);

  return active;
}