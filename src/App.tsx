// src/App.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { CameraView } from './components/CameraView';
import { MemeVideo } from './components/MemeVideo';
import { useGame } from './hooks/useGame';
import { preloadAllMemes } from './data/memePreloader';
import type { Meme } from './types/meme';
import type { LandmarkList } from './types/pose';

function App() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [playerNameInput, setPlayerNameInput] = useState('');

  useEffect(() => {
    preloadAllMemes().then(setMemes);
  }, []);

  const { state, startGame, processFrame, resetGame, saveResult } = useGame(memes);

  const handleLandmarks = useCallback(
    (landmarks: LandmarkList | null) => {
      processFrame(landmarks);
    },
    [processFrame]
  );

  const handleStart = () => {
    if (!playerNameInput.trim()) {
      alert('Please enter your name');
      return;
    }
    if (memes.length === 0) {
      alert('Memes still loading, please wait...');
      return;
    }
    startGame(playerNameInput.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleStart();
  };

  const renderContent = () => {
    switch (state.state) {
      case 'IDLE':
        return (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Enter Your Name</h2>
            <input
              type="text"
              value={playerNameInput}
              onChange={(e) => setPlayerNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Your name…"
              style={{ padding: '0.5rem', fontSize: '1.2rem', marginRight: '1rem' }}
            />
            <button
              onClick={handleStart}
              disabled={memes.length === 0}
              style={{ padding: '0.5rem 2rem', fontSize: '1.2rem' }}
            >
              {memes.length === 0 ? 'Loading…' : 'Start Challenge!'}
            </button>
          </div>
        );

      case 'COUNTDOWN':
        return (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '4rem' }}>{state.countdownValue}</h1>
            <p>Get ready!</p>
          </div>
        );

      case 'PLAYING':
        return (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>⏱ {(state.timeLeftMs / 1000).toFixed(1)}s</div>
            <div style={{ fontSize: '2rem', color: '#00e5ff' }}>
              Score: {Math.round(state.liveScore)}%
            </div>
            <div
              style={{
                width: '80%',
                height: '20px',
                background: '#333',
                borderRadius: '10px',
                margin: '1rem auto',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, state.liveScore)}%`,
                  height: '100%',
                  background: '#00e5ff',
                  transition: 'width 0.1s',
                }}
              />
            </div>
            <p style={{ color: '#aaa' }}>Strike the pose!</p>
            {state.currentMeme && (
              <p style={{ color: '#888', fontSize: '0.9rem' }}>🎭 {state.currentMeme.title}</p>
            )}
          </div>
        );

      case 'RESULT':
        return (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '4rem', color: '#ff2e88' }}>{state.finalScore}%</h1>
            <p style={{ fontSize: '1.5rem' }}>Great effort, {state.playerName}!</p>
            <button
              onClick={() => saveResult(state.finalScore!)}
              style={{ padding: '0.5rem 2rem', fontSize: '1.2rem', marginTop: '1rem' }}
            >
              Save &amp; Next
            </button>
          </div>
        );

      case 'ERROR':
        return (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>⚠️ Error</h2>
            <p>{state.errorMessage}</p>
            <button onClick={resetGame}>Retry</button>
          </div>
        );

      default:
        return <div>Loading…</div>;
    }
  };

  return (
    <div
      style={{
        background: '#0a0a0f',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1rem',
      }}
    >
      <h1>🎮 Meme Pose Challenge</h1>
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '1200px',
        }}
      >
        {/* Left: Camera view */}
        <CameraView onLandmarks={handleLandmarks} />

        {/* Right: Game UI + Meme Video */}
        <div
          style={{
            flex: '1',
            minWidth: '300px',
            background: '#1a1a2e',
            padding: '1rem',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Meme video – shown during COUNTDOWN and PLAYING */}
          {(state.state === 'COUNTDOWN' || state.state === 'PLAYING') && state.currentMeme && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#aaa' }}>👀 Strike this pose:</p>
              <MemeVideo
                videoUrl={state.currentMeme.videoUrl}
                isPlaying={state.state === 'PLAYING' || state.state === 'COUNTDOWN'}
              />
            </div>
          )}

          {/* Game state UI */}
          {renderContent()}

          {/* Leaderboard placeholder – will be replaced with real leaderboard in Phase 6/7 */}
          <div style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
            <h3>🏆 Leaderboard</h3>
            <p style={{ color: '#666' }}>(Coming soon)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;