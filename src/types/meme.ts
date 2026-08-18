// src/types/meme.ts
import type { LandmarkList } from "./pose";

export interface ReferencePose {
  id: string;              // e.g. "pose_a", "pose_b", "pose_c"
  name?: string;           // e.g. "Looking forward", "Pointing"
  landmarks: LandmarkList; // 33 normalised landmarks (x,y,z,visibility)
}

export interface Meme {
  id: string;
  title: string;
  videoUrl: string;        // e.g. "/memes/meme-01.mp4"
  referencePoses: ReferencePose[];
}