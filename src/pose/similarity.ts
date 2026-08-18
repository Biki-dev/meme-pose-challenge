// src/pose/similarity.ts
import type { LandmarkList } from '../types/pose';
import { type PoseFeatures, extractFeatures } from './features';

// Weights (can be tuned)
const WEIGHTS = {
  landmark: 0.50,
  angle: 0.30,
  bone: 0.20,
};

// Max expected distance in normalized units (tuning parameter)
const MAX_DIST = 0.6;

export function computeSimilarity(
  liveLandmarks: LandmarkList,
  refLandmarks: LandmarkList,
): number {
  // 1. Landmark score (Euclidean distance)
  let totalDist = 0;
  let count = 0;
  for (let i = 0; i < 33; i++) {
    const l = liveLandmarks[i];
    const r = refLandmarks[i];
    if (!l || !r || l.visibility < 0.5 || r.visibility < 0.5) continue;
    const d = Math.hypot(l.x - r.x, l.y - r.y, l.z - r.z);
    totalDist += d;
    count++;
  }
  if (count === 0) return 0;
  const meanDist = totalDist / count;
  const landmarkScore = Math.max(0, 1 - meanDist / MAX_DIST) * 100;

  // 2. Angle score
  const liveFeat = extractFeatures(liveLandmarks);
  const refFeat = extractFeatures(refLandmarks);
  let angleScore = 0;
  if (liveFeat && refFeat && liveFeat.angles.length === refFeat.angles.length) {
    let sumDiff = 0;
    let cnt = 0;
    for (let i = 0; i < liveFeat.angles.length; i++) {
      const diff = Math.abs(liveFeat.angles[i] - refFeat.angles[i]);
      sumDiff += Math.min(diff, 180);
      cnt++;
    }
    if (cnt > 0) {
      const avgDiff = sumDiff / cnt;
      angleScore = Math.max(0, 1 - avgDiff / 90) * 100; // 90° threshold
    }
  }

  // 3. Bone direction score (cosine similarity)
  let boneScore = 0;
  if (liveFeat && refFeat && liveFeat.bones.length === refFeat.bones.length) {
    let sumCos = 0;
    let cnt = 0;
    for (let i = 0; i < liveFeat.bones.length; i++) {
      const a = liveFeat.bones[i];
      const b = refFeat.bones[i];
      if (a.x === 0 && a.y === 0 && a.z === 0) continue;
      if (b.x === 0 && b.y === 0 && b.z === 0) continue;
      const dot = a.x*b.x + a.y*b.y + a.z*b.z;
      const cosSim = Math.max(-1, Math.min(1, dot));
      sumCos += (cosSim + 1) / 2; // map to 0..1
      cnt++;
    }
    if (cnt > 0) {
      boneScore = (sumCos / cnt) * 100;
    }
  }

  // Combine
  const finalScore =
    WEIGHTS.landmark * landmarkScore +
    WEIGHTS.angle * angleScore +
    WEIGHTS.bone * boneScore;

  return finalScore;
}

/**
 * Compare live landmarks against all reference poses of a meme.
 * Returns the best (maximum) score among them.
 */
export function computeBestMatch(
  liveLandmarks: LandmarkList,
  refPoses: LandmarkList[],
): number {
  let best = 0;
  for (const ref of refPoses) {
    const score = computeSimilarity(liveLandmarks, ref);
    if (score > best) best = score;
  }
  return best;
}