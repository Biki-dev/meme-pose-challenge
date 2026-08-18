// src/data/memes.ts
import type { Meme, ReferencePose } from '../types/meme';

export const MEME_LIST: Omit<Meme, 'referencePoses'>[] = [
  { id: 'meme-01', title: 'Meme 1', videoUrl: '/memes/meme-01.mp4' },
  // ... add all your memes
];

export async function loadMemePoses(memeId: string): Promise<ReferencePose[]> {
  const url = `/poses/${memeId}.json`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to load ${memeId}`);
  const data = await resp.json();
  // Data can be array of poses, or object with referencePoses field
  if (Array.isArray(data)) return data;
  if (data.referencePoses && Array.isArray(data.referencePoses)) return data.referencePoses;
  // Fallback: single pose wrapped
  return [data];
}

export async function loadFullMeme(memeId: string): Promise<Meme> {
  const meta = MEME_LIST.find(m => m.id === memeId);
  if (!meta) throw new Error(`Meme ${memeId} not found`);
  const poses = await loadMemePoses(memeId);
  return { ...meta, referencePoses: poses };
}