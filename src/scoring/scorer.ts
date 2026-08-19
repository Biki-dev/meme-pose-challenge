// src/scoring/scorer.ts
import type { LandmarkList } from '../types/pose';
import { normalizeLandmarks } from '../pose/normalization';
import { computeBestMatch } from '../pose/similarity';
import { BestPoseTracker } from './smoothing';

export class PoseScorer {
  private tracker: BestPoseTracker;
  /**
   * Reference poses as stored in the JSON produced by extract_poses.py.
   * They are ALREADY normalised (hip-centred, shoulder-width scaled),
   * so we must NOT re-normalise them — only the live camera frame needs
   * normalisation before comparison.
   */
  private refPoses: LandmarkList[];

  constructor(refPoses: LandmarkList[], smoothingAlpha: number = 0.3) {
    this.refPoses = refPoses;
    this.tracker = new BestPoseTracker(smoothingAlpha);
  }

  /**
   * Process a raw camera frame (un-normalised MediaPipe landmarks 0..1).
   * Returns the current smoothed score (0-100) for the live UI.
   * Returns null if the frame cannot be normalised (body not detected).
   */
  processFrame(rawLandmarks: LandmarkList): number | null {
    const norm = normalizeLandmarks(rawLandmarks);
    if (!norm) return null;

    // Compare the normalised live pose against pre-normalised reference poses
    const rawScore = computeBestMatch(norm, this.refPoses);
    this.tracker.addSample(rawScore);
    return this.tracker.getCurrentStableScore();
  }

  /** Get final best score at round end (0-100, rounded). */
  getFinalScore(): number {
    return Math.round(this.tracker.getBestScore());
  }

  /** Reset tracker for a new round. */
  reset(): void {
    this.tracker.reset();
  }
}