// src/pose/normalization.ts
import type { LandmarkList } from '../types/pose';

export function normalizeLandmarks(landmarks: LandmarkList): LandmarkList | null {
  if (!landmarks || landmarks.length < 33) return null;

  // Get hip centre (indices 23, 24)
  const hipL = landmarks[23];
  const hipR = landmarks[24];
  if (!hipL || !hipR || hipL.visibility < 0.5 || hipR.visibility < 0.5) {
    return null;
  }
  const hipCenterX = (hipL.x + hipR.x) / 2;
  const hipCenterY = (hipL.y + hipR.y) / 2;

  // Shoulder width (indices 11, 12)
  const shoulderL = landmarks[11];
  const shoulderR = landmarks[12];
  if (!shoulderL || !shoulderR || shoulderL.visibility < 0.5 || shoulderR.visibility < 0.5) {
    return null;
  }
  const sw = Math.hypot(shoulderL.x - shoulderR.x, shoulderL.y - shoulderR.y);
  const scale = sw > 0.01 ? sw : 0.3; // fallback

  const normalized: LandmarkList = landmarks.map((lm) => {
    if (lm.visibility < 0.5) {
      return { x: 0, y: 0, z: 0, visibility: 0 };
    }
    return {
      x: (lm.x - hipCenterX) / scale,
      y: (lm.y - hipCenterY) / scale,
      z: lm.z || 0,
      visibility: lm.visibility,
    };
  });
  return normalized;
}