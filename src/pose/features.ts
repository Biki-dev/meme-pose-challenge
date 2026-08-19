// src/pose/features.ts
import type { LandmarkList, NormalizedLandmark } from '../types/pose';

// Joint definitions: [parent, joint, child] for angles
const ANGLE_JOINTS: [number, number, number][] = [
  [11, 13, 15], // left elbow
  [12, 14, 16], // right elbow
  [13, 11, 23], // left shoulder (torso angle)
  [14, 12, 24], // right shoulder
  [23, 25, 27], // left knee
  [24, 26, 28], // right knee
];

// Bones: [start, end] for direction vectors
const BONE_PAIRS: [number, number][] = [
  [11, 13], // left upper arm
  [13, 15], // left forearm
  [12, 14], // right upper arm
  [14, 16], // right forearm
  [23, 25], // left thigh
  [25, 27], // left shin
  [24, 26], // right thigh
  [26, 28], // right shin
  [11, 23], // left torso
  [12, 24], // right torso
];

export interface PoseFeatures {
  angles: number[];    // in degrees, order matches ANGLE_JOINTS
  bones: { x: number; y: number; z: number }[]; // unit vectors
}

function angleBetween(p1: NormalizedLandmark, p2: NormalizedLandmark, p3: NormalizedLandmark): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.hypot(v1.x, v1.y, v1.z);
  const mag2 = Math.hypot(v2.x, v2.y, v2.z);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.acos(cos) * 180 / Math.PI;
}

function boneDirection(from: NormalizedLandmark, to: NormalizedLandmark): { x: number; y: number; z: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const len = Math.hypot(dx, dy, dz);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: dx / len, y: dy / len, z: dz / len };
}

export function extractFeatures(landmarks: LandmarkList): PoseFeatures | null {
  if (!landmarks || landmarks.length < 33) return null;

  // Require only shoulders — arms and upper body are always the key for meme poses.
  // Lower-body landmarks (knees, ankles) are optional: if invisible (upper-body shot)
  // those joints simply contribute 0 to the score rather than nullifying everything.
  const coreRequired = [11, 12]; // left & right shoulder
  for (const idx of coreRequired) {
    if (!landmarks[idx] || landmarks[idx].visibility < 0.5) return null;
  }

  const angles = ANGLE_JOINTS.map(([p, j, c]) => {
    if (!landmarks[p] || !landmarks[j] || !landmarks[c]) return 0;
    if (landmarks[p].visibility < 0.5 || landmarks[j].visibility < 0.5 || landmarks[c].visibility < 0.5) return 0;
    return angleBetween(landmarks[p], landmarks[j], landmarks[c]);
  });

  const bones = BONE_PAIRS.map(([start, end]) => {
    if (!landmarks[start] || !landmarks[end]) return { x: 0, y: 0, z: 0 };
    if (landmarks[start].visibility < 0.5 || landmarks[end].visibility < 0.5) return { x: 0, y: 0, z: 0 };
    return boneDirection(landmarks[start], landmarks[end]);
  });

  return { angles, bones };
}