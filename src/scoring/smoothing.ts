// Directional score smoothing: good matches build score, poor matches drain it.
export class BestPoseTracker {
  private readonly riseAlpha: number;
  private readonly fallAlpha: number;
  private stableScore: number | null = null;
  private bestScore = 0;

  constructor(riseAlpha = 0.22, fallAlpha = 0.5) {
    this.riseAlpha = Math.max(0, Math.min(1, riseAlpha));
    this.fallAlpha = Math.max(0, Math.min(1, fallAlpha));
  }

  addSample(rawScore: number): void {
    const nextScore = Math.max(0, Math.min(100, rawScore));

    if (this.stableScore === null) {
      this.stableScore = nextScore;
    } else {
      // Use a stronger fall response so leaving the pose is immediately visible.
      const alpha = nextScore >= this.stableScore ? this.riseAlpha : this.fallAlpha;
      this.stableScore += alpha * (nextScore - this.stableScore);
    }

    this.stableScore = Math.max(0, Math.min(100, this.stableScore));
    this.bestScore = Math.max(this.bestScore, this.stableScore);
  }

  getCurrentStableScore(): number {
    return this.stableScore ?? 0;
  }

  // Final score reflects the score at the end of the round, not the historical peak.
  getFinalScore(): number {
    return this.stableScore ?? 0;
  }

  getBestScore(): number {
    return this.bestScore;
  }

  reset(): void {
    this.stableScore = null;
    this.bestScore = 0;
  }
}
