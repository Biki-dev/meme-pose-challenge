// src/scoring/scorer.ts
import type { LandmarkList } from '../types/pose';
import { normalizeLandmarks } from '../pose/normalization';
import { computeBestMatch } from '../pose/similarity';
import { BestPoseTracker } from './smoothing';

export class PoseScorer {
  private tracker: BestPoseTracker;
  private refPoses: LandmarkList[];   // already normalised

  constructor(refPoses: LandmarkList[], smoothingAlpha: number = 0.3) {
    this.refPoses = refPoses;
    this.tracker = new BestPoseTracker(smoothingAlpha);
  }

  /**
   * Process a raw frame (un-normalised landmarks).
   * Returns the current stable score (for live UI) and updates internal tracker.
   * Returns null if frame invalid.
   */
  processFrame(rawLandmarks: LandmarkList): number | null {
    const norm = normalizeLandmarks(rawLandmarks);
    if (!norm) return null;

    // Compute best match against all reference poses
    const rawScore = computeBestMatch(norm, this.refPoses);
    this.tracker.addSample(rawScore);
    return this.tracker.getCurrentStableScore();
  }

  /** Get final best score at round end. */
  getFinalScore(): number {
    return Math.round(this.tracker.getBestScore());
  }

  /** Reset tracker for new round. */
  reset(): void {
    this.tracker.reset();
  }
}