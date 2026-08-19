// src/pose/normalization.ts
import type { LandmarkList } from '../types/pose';

/**
 * Normalize landmarks to a body-relative coordinate system.
 *
 * Origin  = hip centre (if hips visible) or shoulder centre (fallback for
 *           upper-body / seated shots where hips may be off-screen).
 * Scale   = shoulder width (inter-shoulder distance).
 *
 * Landmarks with visibility < 0.5 are zeroed out so they don't
 * contribute to scoring or feature extraction.
 */
export function normalizeLandmarks(landmarks: LandmarkList): LandmarkList | null {
  if (!landmarks || landmarks.length < 33) return null;

  // --- Scale: shoulder width (landmarks 11 = left, 12 = right) ---
  const shoulderL = landmarks[11];
  const shoulderR = landmarks[12];
  if (!shoulderL || !shoulderR || shoulderL.visibility < 0.3 || shoulderR.visibility < 0.3) {
    return null; // can't establish scale without shoulders
  }
  const sw = Math.hypot(shoulderL.x - shoulderR.x, shoulderL.y - shoulderR.y);
  const scale = sw > 0.01 ? sw : 0.3; // safe fallback

  // --- Origin: prefer hip centre, fall back to shoulder centre ---
  const hipL = landmarks[23];
  const hipR = landmarks[24];
  const hipsVisible =
    hipL &&
    hipR &&
    hipL.visibility >= 0.5 &&
    hipR.visibility >= 0.5;

  const originX = hipsVisible
    ? (hipL!.x + hipR!.x) / 2
    : (shoulderL.x + shoulderR.x) / 2;
  const originY = hipsVisible
    ? (hipL!.y + hipR!.y) / 2
    : (shoulderL.y + shoulderR.y) / 2;

  const normalized: LandmarkList = landmarks.map((lm) => {
    if (!lm || lm.visibility < 0.5) {
      return { x: 0, y: 0, z: 0, visibility: 0 };
    }
    return {
      x: (lm.x - originX) / scale,
      y: (lm.y - originY) / scale,
      z: lm.z || 0,
      visibility: lm.visibility,
    };
  });

  return normalized;
}