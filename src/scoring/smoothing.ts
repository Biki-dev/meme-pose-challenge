// src/scoring/smoothing.ts

export class BestPoseTracker {
  private alpha: number;              // smoothing factor (0..1)
  private stableScore: number | null = null;
  private bestScore: number = 0;

  constructor(alpha: number = 0.3) {
    this.alpha = alpha;
  }

  /**
   * Add a raw score from a valid frame.
   * If no stable score yet, initialise with raw.
   */
  addSample(rawScore: number): void {
    if (this.stableScore === null) {
      this.stableScore = rawScore;
    } else {
      this.stableScore = this.alpha * rawScore + (1 - this.alpha) * this.stableScore;
    }
    if (this.stableScore > this.bestScore) {
      this.bestScore = this.stableScore;
    }
  }

  /** Current smoothed score (for live meter). */
  getCurrentStableScore(): number {
    return this.stableScore ?? 0;
  }

  /** Best stable score observed so far. */
  getBestScore(): number {
    return this.bestScore;
  }

  /** Reset for a new round. */
  reset(): void {
    this.stableScore = null;
    this.bestScore = 0;
  }
}