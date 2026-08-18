// src/types/pose.ts
export interface NormalizedLandmark {
  x: number; // 0..1 from left
  y: number; // 0..1 from top
  z: number; // depth
  visibility?: number;
}

export type LandmarkList = NormalizedLandmark[]; // length = 33