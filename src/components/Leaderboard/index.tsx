// src/components/Leaderboard/index.tsx
import React, { useMemo, useRef, useEffect } from 'react';
import { useLeaderboard } from '../../hooks/useLeaderboard';

interface LeaderboardProps {
  limit?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ limit = 10 }) => {
  const { entries, loading } = useLeaderboard(limit);
  const prevEntriesRef = useRef<typeof entries>([]);

  // Track which rows are new or changed position
  const entryMap = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e, idx) => map.set(e.id, idx));
    return map;
  }, [entries]);

  useEffect(() => {
    prevEntriesRef.current = entries;
  }, [entries]);

  if (loading && entries.length === 0) {
    return <p style={{ color: '#666' }}>Loading leaderboard…</p>;
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>🏆 Leaderboard</h3>
      {entries.length === 0 ? (
        <p style={{ color: '#666' }}>No scores yet – be the first!</p>
      ) : (
        <ol style={{ paddingLeft: '1.2rem', margin: 0 }}>
          {entries.map((entry, idx) => {
            const prevIndex = prevEntriesRef.current.findIndex((e) => e.id === entry.id);
            const isNew = prevIndex === -1 && idx < entries.length;
            const moved = prevIndex !== -1 && prevIndex !== idx;
            const rank = idx + 1;
            return (
              <li
                key={entry.id}
                style={{
                  padding: '0.3rem 0',
                  borderBottom: '1px solid #2a2a3a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  animation: isNew ? 'fadeSlideIn 0.4s ease' : moved ? 'highlightRow 0.5s ease' : 'none',
                }}
              >
                <span>
                  <span style={{ fontWeight: 'bold', color: rank === 1 ? '#ffd700' : '#aaa' }}>
                    #{rank}
                  </span>
                  {' '}
                  <span style={{ color: '#fff' }}>{entry.player_name}</span>
                </span>
                <span style={{ color: '#00e5ff', fontWeight: 'bold' }}>{entry.score}%</span>
              </li>
            );
          })}
        </ol>
      )}
      <style>{`
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes highlightRow {
          0%, 100% { background: transparent; }
          50% { background: rgba(0, 229, 255, 0.15); }
        }
      `}</style>
    </div>
  );
};