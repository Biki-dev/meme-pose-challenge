// src/game/gameMachine.ts
import type { GameContext } from '../types/game';
import type { Meme } from '../types/meme';
import { GAME_CONFIG } from './gameConfig';

export type GameAction =
  | { type: 'START_GAME'; playerId: string; playerName: string; meme: Meme }
  | { type: 'COUNTDOWN_TICK'; value: number | 'GO' }
  | { type: 'TIME_TICK'; timeLeftMs: number }
  | { type: 'SCORE_UPDATE'; liveScore: number }
  | { type: 'SHOW_RESULT'; finalScore: number }
  | { type: 'SAVE_COMPLETE' }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' };

export const initialGameState: GameContext = {
  state: 'IDLE',
  playerId: null,
  playerName: '',
  currentMeme: null,
  countdownValue: null,
  timeLeftMs: GAME_CONFIG.ROUND_DURATION_MS,
  finalScore: null,
  liveScore: 0,
  errorMessage: null,
  _startTime: null,
};

export function gameReducer(state: GameContext, action: GameAction): GameContext {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        state: 'COUNTDOWN',
        playerId: action.playerId,
        playerName: action.playerName,
        currentMeme: action.meme,
        countdownValue: 3,
        timeLeftMs: GAME_CONFIG.ROUND_DURATION_MS,
        finalScore: null,
        liveScore: 0,
        errorMessage: null,
        _startTime: null,
      };

    case 'COUNTDOWN_TICK':
      return {
        ...state,
        state: action.value === 'GO' ? 'PLAYING' : 'COUNTDOWN',
        countdownValue: action.value,
        _startTime: action.value === 'GO' ? performance.now() : state._startTime,
      };

    case 'TIME_TICK':
      if (state.state !== 'PLAYING') return state;
      return { ...state, timeLeftMs: action.timeLeftMs };

    case 'SCORE_UPDATE':
      if (state.state !== 'PLAYING') return state;
      return { ...state, liveScore: action.liveScore };

    case 'SHOW_RESULT':
      return {
        ...state,
        state: 'RESULT',
        finalScore: action.finalScore,
      };

    case 'SAVE_COMPLETE':
      return { ...initialGameState };

    case 'ERROR':
      return {
        ...state,
        state: 'ERROR',
        errorMessage: action.message,
      };

    case 'RESET':
      return { ...initialGameState };

    default:
      return state;
  }
}