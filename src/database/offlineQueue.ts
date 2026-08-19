// src/database/offlineQueue.ts
import { saveResult } from './api';

interface QueuedResult {
  playerId: string;
  playerName: string;
  memeId: string;
  score: number;
  timestamp: number;
}

const QUEUE_KEY = 'pose_offline_queue';

function getQueue(): QueuedResult[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setQueue(queue: QueuedResult[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueResult(result: QueuedResult) {
  const queue = getQueue();
  queue.push(result);
  setQueue(queue);
  // Start the retry loop if not already running.
  startRetryLoop();
}

let retryInterval: number | null = null;

function startRetryLoop() {
  if (retryInterval !== null) return;
  retryInterval = window.setInterval(async () => {
    const queue = getQueue();
    if (queue.length === 0) {
      stopRetryLoop();
      return;
    }
    // Try to flush all items
    const remaining: QueuedResult[] = [];
    for (const item of queue) {
      const { error } = await saveResult(item.playerId, item.playerName, item.memeId, item.score);
      if (error) {
        remaining.push(item);
      }
    }
    if (remaining.length === 0) {
      setQueue([]);
      stopRetryLoop();
    } else {
      setQueue(remaining);
    }
  }, 15000); // every 15 seconds
}

function stopRetryLoop() {
  if (retryInterval !== null) {
    clearInterval(retryInterval);
    retryInterval = null;
  }
}

// Also retry when network comes back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const queue = getQueue();
    if (queue.length > 0) startRetryLoop();
  });
}