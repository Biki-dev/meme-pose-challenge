// src/database/api.ts
import { supabase } from './supabase';
import type { GameResult } from '../types/database';

export async function saveResult(
  playerId: string,
  playerName: string,
  memeId: string,
  score: number
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('results')
    .insert({
      player_id: playerId,
      player_name: playerName,
      meme_id: memeId,
      score: Math.round(score),
    });
  return { error };
}

export async function fetchLeaderboard(limit: number = 10): Promise<GameResult[]> {
  const { data, error } = await supabase
    .from('results')
    .select('id, player_id, player_name, meme_id, score, played_at')
    .order('score', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('Leaderboard fetch error:', error);
    return [];
  }
  return data || [];
}