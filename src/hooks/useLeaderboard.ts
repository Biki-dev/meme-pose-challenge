// src/hooks/useLeaderboard.ts
import { useState, useEffect, useRef } from 'react';
import { fetchLeaderboard } from '../database/api';
import type { GameResult } from '../types/database';
import { GAME_CONFIG } from '../game/gameConfig';

export function useLeaderboard(limit: number = 10) {
  const [entries, setEntries] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<number | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await fetchLeaderboard(limit);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    timerRef.current = window.setInterval(load, GAME_CONFIG.LEADERBOARD_POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { entries, loading, refresh: load };
}