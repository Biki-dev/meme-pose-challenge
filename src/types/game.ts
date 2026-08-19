// src/types/game.ts
import type { Meme } from './meme';

export type GameState =
  | 'IDLE'
  | 'WHEEL'  
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'FINISHED'
  | 'RESULT'
  | 'ERROR';

export interface GameContext {
  state: GameState;
  playerId: string | null;
  playerName: string;
  currentMeme: Meme | null;
  countdownValue: number | 'GO' | null;
  timeLeftMs: number;
  finalScore: number | null;
  liveScore: number;
  errorMessage: string | null;
  _startTime: number | null;
}