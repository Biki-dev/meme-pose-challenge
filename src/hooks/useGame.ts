// src/hooks/useGame.ts
import { useReducer, useEffect, useRef, useCallback } from 'react';
import { gameReducer, initialGameState } from '../game/gameMachine';
import type { GameState } from '../types/game';
import { PoseScorer } from '../scoring/scorer';
import type { Meme } from '../types/meme';
import { GAME_CONFIG } from '../game/gameConfig';
import type { LandmarkList } from '../types/pose';
import { MemeSelector } from '../game/memeSelector';
import { saveResult as dbSave } from '../database/api';
import { enqueueResult } from '../database/offlineQueue';

export function useGame(allMemes: Meme[]) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  const scorerRef = useRef<PoseScorer | null>(null);
  const selectorRef = useRef<MemeSelector>(new MemeSelector([]));
  const lastMemeIdRef = useRef<string | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const liveScoreRef = useRef<number>(0);

  const gameStateRef = useRef<GameState>(state.state);
  useEffect(() => {
    gameStateRef.current = state.state;
  }, [state.state]);

  // Update selector when allMemes changes
  useEffect(() => {
    selectorRef.current = new MemeSelector(allMemes.map((m) => m.id));
  }, [allMemes]);

  const startGame = useCallback(
    (playerName: string) => {
      if (allMemes.length === 0) {
        console.error('No memes loaded');
        return;
      }
      const memeId = selectorRef.current.next(lastMemeIdRef.current);
      if (!memeId) {
        console.error('No meme ID from selector');
        return;
      }
      lastMemeIdRef.current = memeId;
      const meme = allMemes.find((m) => m.id === memeId);
      if (!meme) {
        console.error('Meme not found:', memeId);
        return;
      }

      scorerRef.current = new PoseScorer(
        meme.referencePoses.map((p) => p.landmarks),
        GAME_CONFIG.SCORE_SMOOTHING_ALPHA
      );
      liveScoreRef.current = 0;
      startTimeRef.current = null;

      dispatch({
        type: 'START_GAME',
        playerId: crypto.randomUUID(),
        playerName,
        meme,
      });
    },
    [allMemes]
  );

  // processFrame – only updates score
  const processFrame = useCallback((landmarks: LandmarkList | null) => {
    if (gameStateRef.current !== 'PLAYING') return;
    if (!scorerRef.current || !landmarks) return;

    const liveScore = scorerRef.current.processFrame(landmarks);
    if (liveScore !== null) {
      liveScoreRef.current = liveScore;
      dispatch({ type: 'SCORE_UPDATE', liveScore });
    }
  }, []);

  // Countdown effect
  useEffect(() => {
    if (state.state !== 'COUNTDOWN') return;
    let count = 3;
    const iv = setInterval(() => {
      count--;
      if (count > 0) {
        dispatch({ type: 'COUNTDOWN_TICK', value: count });
      } else {
        startTimeRef.current = performance.now();
        dispatch({ type: 'COUNTDOWN_TICK', value: 'GO' });
        clearInterval(iv);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [state.state]);

  // Timer loop (only updates time)
  useEffect(() => {
    if (state.state !== 'PLAYING') {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      return;
    }

    let alive = true;
    const tick = () => {
      if (!alive) return;
      const elapsed = startTimeRef.current
        ? performance.now() - startTimeRef.current
        : 0;
      const timeLeftMs = Math.max(0, GAME_CONFIG.ROUND_DURATION_MS - elapsed);

      dispatch({ type: 'TIME_TICK', timeLeftMs });

      if (timeLeftMs <= 0) {
        alive = false;
        const final = scorerRef.current?.getFinalScore() ?? 0;
        dispatch({ type: 'SHOW_RESULT', finalScore: final });
        frameIdRef.current = null;
        return;
      }

      frameIdRef.current = requestAnimationFrame(tick);
    };

    frameIdRef.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, [state.state]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' });
    scorerRef.current = null;
    startTimeRef.current = null;
    liveScoreRef.current = 0;
  }, []);

const saveResult = useCallback(
  async (finalScore: number) => {
    if (!state.playerId || !state.currentMeme) {
      console.error('Missing player or meme');
      return;
    }
    try {
      const { error } = await dbSave(
        state.playerId,
        state.playerName,
        state.currentMeme.id,
        finalScore
      );
      if (error) {
        // Queue locally
        enqueueResult({
          playerId: state.playerId,
          playerName: state.playerName,
          memeId: state.currentMeme.id,
          score: finalScore,
          timestamp: Date.now(),
        });
        console.warn('Saved to offline queue:', error);
      }
    } catch (err) {
      // Fallback to queue
      enqueueResult({
        playerId: state.playerId,
        playerName: state.playerName,
        memeId: state.currentMeme.id,
        score: finalScore,
        timestamp: Date.now(),
      });
      console.warn('Network error, queued locally');
    }
    // Always go back to IDLE
    dispatch({ type: 'SAVE_COMPLETE' });
  },
  [state.playerId, state.playerName, state.currentMeme]
);

  return { state, startGame, processFrame, resetGame, saveResult };
}