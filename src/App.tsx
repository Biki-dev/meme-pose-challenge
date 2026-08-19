import React, { useCallback, useEffect, useState } from 'react';
import { CameraView } from './components/CameraView';
import { MemeVideo } from './components/MemeVideo';
import { Leaderboard } from './components/Leaderboard';
import { Wheel } from './components/Wheel';
import { preloadAllMemes } from './data/memePreloader';
import { useGame } from './hooks/useGame';
import type { Meme } from './types/meme';
import type { LandmarkList } from './types/pose';
import './App.css';

function App() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const { state, startGame, processFrame, resetGame, saveResult, selectMeme } = useGame(memes);

  useEffect(() => {
    preloadAllMemes().then(setMemes);
  }, []);

  const handleLandmarks = useCallback((landmarks: LandmarkList | null) => processFrame(landmarks), [processFrame]);

  const handleStart = () => {
    if (!playerNameInput.trim()) return;
    if (memes.length === 0) return;
    startGame(playerNameInput.trim());
  };

  const renderGameState = () => {
    switch (state.state) {
      case 'IDLE':
        return (
          <section className="state-panel intro-panel">
            <div className="eyebrow">Ready when you are</div>
            <h2>Make the internet’s face.</h2>
            <p className="muted">Pick a name, spin the deck, then match the pose before the clock taps out.</p>
            <div className="name-form">
              <label htmlFor="player-name">Your player tag</label>
              <div className="input-row">
                <input id="player-name" value={playerNameInput} onChange={(e) => setPlayerNameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleStart()} placeholder="e.g. poseboss" maxLength={18} />
                <button className="button button-lime" onClick={handleStart} disabled={!playerNameInput.trim() || memes.length === 0}>{memes.length === 0 ? 'Loading deck' : 'Enter arena'}</button>
              </div>
            </div>
            <div className="micro-stats"><span><b>{memes.length || '—'}</b> poses in deck</span><span><b>10 sec</b> per round</span><span><b>∞</b> ways to flail</span></div>
          </section>
        );
      case 'WHEEL':
        return (
          <section className="state-panel wheel-panel">
            <div className="eyebrow">Round one · {state.playerName}</div>
            <h2>Choose your chaos.</h2>
            <p className="muted">The wheel decides what your camera sees next.</p>
            <Wheel memes={memes} onSelect={selectMeme} />
          </section>
        );
      case 'COUNTDOWN':
        return (
          <section className="state-panel countdown-panel">
            <div className="eyebrow">Lock in your stance</div>
            <div className="countdown-number">{state.countdownValue}</div>
            <h2>Find the frame.</h2>
            <p className="muted">Your best angle is probably closer than you think.</p>
          </section>
        );
      case 'PLAYING':
        return (
          <section className="state-panel playing-panel">
            <div className="play-topline"><div><div className="eyebrow">Live match</div><h2>Hold that energy.</h2></div><div className="timer"><span>TIME</span>{(state.timeLeftMs / 1000).toFixed(1)}<small>s</small></div></div>
            <div className="score-readout"><span>POSE MATCH</span><strong>{Math.round(state.liveScore)}<small>%</small></strong></div>
            <div className="score-track"><div className="score-fill" style={{ width: `${Math.min(100, state.liveScore)}%` }} /></div>
            <div className="play-hint"><span className="pulse-dot" /> Match the reference. Make it yours.</div>
            {state.currentMeme && <div className="current-meme"><span>NOW PLAYING</span><strong>{state.currentMeme.title}</strong></div>}
          </section>
        );
      case 'RESULT':
        return (
          <section className="state-panel result-panel">
            <div className="eyebrow">Round complete</div>
            <div className="result-score">{state.finalScore}<small>%</small></div>
            <h2>That was a moment, {state.playerName}.</h2>
            <p className="muted">Save your score and see how it stacks up.</p>
            <button className="button button-lime full-button" onClick={() => saveResult(state.finalScore!)}>Save score &amp; play again</button>
          </section>
        );
      case 'ERROR':
        return <section className="state-panel error-panel"><div className="eyebrow">Signal lost</div><h2>Something got in the way.</h2><p className="muted">{state.errorMessage}</p><button className="button button-outline" onClick={resetGame}>Try again</button></section>;
      default:
        return <section className="state-panel"><div className="eyebrow">Loading</div><h2>Warming up the room…</h2></section>;
    }
  };

  const liveRound = state.state === 'COUNTDOWN' || state.state === 'PLAYING';

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img
            src="https://res.cloudinary.com/dnmobechs/image/upload/f_auto,q_auto/v1786978432/ISTE_1_dtam0y.png"
            alt="ISTE logo"
            style={{ height: '32px', width: 'auto', display: 'block' }}
          />
          <span className="brand-name">ISTE meme pose<span> / </span>challenge</span>
        </div>
      </header>  <section className="arena-grid">
        <div className="camera-card"><div className="card-label"><span>01 / YOUR CAMERA</span><span className="signal"><i /> LIVE FEED</span></div><div className="camera-frame"><CameraView onLandmarks={handleLandmarks} /><div className="camera-corner camera-corner-tl" /><div className="camera-corner camera-corner-br" /><div className="camera-caption">MIRROR MODE <span>·</span> POSE TRACKING</div></div></div>
        <aside className="game-column"><div className="control-card"><div className="card-label"><span>02 / GAME CONTROL</span><span className="round-badge">{liveRound ? 'IN PLAY' : state.state}</span></div>{liveRound && state.currentMeme && <div className="reference-card"><div className="reference-heading"><span>REFERENCE FRAME</span><span>⟷</span></div><MemeVideo videoUrl={state.currentMeme.videoUrl} isPlaying /><div className="reference-title">{state.currentMeme.title}</div></div>}{renderGameState()}</div><div className="leaderboard-card"><div className="card-label"><span>03 / THE BOARD</span><span>TOP 100</span></div><Leaderboard limit={10} /></div></aside>
      </section>
    </main>
  );
}

export default App;

