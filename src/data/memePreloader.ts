// src/data/memePreloader.ts
import type { Meme } from '../types/meme';
import { MEME_LIST, loadFullMeme } from './memes';

let loadedMemes: Meme[] | null = null;

export async function preloadAllMemes(): Promise<Meme[]> {
  if (loadedMemes) return loadedMemes;
  const promises = MEME_LIST.map(m => loadFullMeme(m.id));
  loadedMemes = await Promise.all(promises);
  return loadedMemes;
}

export function getPreloadedMemes(): Meme[] | null {
  return loadedMemes;
}