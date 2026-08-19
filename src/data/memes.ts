// src/data/memes.ts
import type { Meme, ReferencePose } from '../types/meme';

const FALLBACK_LANDMARKS = Array.from({ length: 33 }, () => ({
  x: 0,
  y: 0,
  z: 0,
  visibility: 0,
}));

// Use 'meme-01' as ID – your JSON file should be /poses/meme-01.json
export const MEME_LIST: Omit<Meme, 'referencePoses'>[] = [
  {
    id: 'meme-01',
    title: 'Meme 1',
    videoUrl: '/memes/meme-01.mp4',
  },
  // Add more memes here
];

export async function loadMemePoses(memeId: string): Promise<ReferencePose[]> {
  const url = `/poses/${memeId}.json`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data: unknown = await resp.json();
    // Handle both array and object with referencePoses
    if (Array.isArray(data)) return data as ReferencePose[];
    if (
      data &&
      typeof data === 'object' &&
      'referencePoses' in data &&
      Array.isArray((data as { referencePoses: unknown }).referencePoses)
    ) {
      return (data as { referencePoses: ReferencePose[] }).referencePoses;
    }
    return [data as ReferencePose];
  } catch (err) {
    console.warn(`Failed to load ${url}, using fallback pose.`, err);
    return [
      {
        id: 'fallback',
        name: 'Fallback',
        landmarks: FALLBACK_LANDMARKS,
      },
    ];
  }
}

export async function loadFullMeme(memeId: string): Promise<Meme> {
  const meta = MEME_LIST.find((m) => m.id === memeId);
  if (!meta) throw new Error(`Meme ${memeId} not found`);
  const poses = await loadMemePoses(memeId);
  return { ...meta, referencePoses: poses };
}