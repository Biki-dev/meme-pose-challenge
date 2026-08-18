// src/pose/drawUtils.ts
import type { LandmarkList } from "../types/pose";

// Define connections between landmarks (indices) – MediaPipe Pose Landmarker uses 33 landmarks.
// The full list can be found in the documentation.
export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], // shoulders
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], // left arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], // right arm
  [11, 23], [23, 25], [25, 27], [27, 29], [29, 31], // left leg
  [12, 24], [24, 26], [26, 28], [28, 30], [30, 32], // right leg
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], // face
];

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: LandmarkList,
  canvasWidth: number,
  canvasHeight: number,
  color = "#00FF00",
  lineWidth = 2
) {
  if (!landmarks) return;

  ctx.save();

  ctx.clearRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  // Draw connections
  ctx.beginPath();

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  for (const [i, j] of POSE_CONNECTIONS) {
    const p1 = landmarks[i];
    const p2 = landmarks[j];

    if (
      !p1 ||
      !p2 ||
      (p1.visibility ?? 1) < 0.5 ||
      (p2.visibility ?? 1) < 0.5
    ) {
      continue;
    }

    const x1 = p1.x * canvasWidth;
    const y1 = p1.y * canvasHeight;

    const x2 = p2.x * canvasWidth;
    const y2 = p2.y * canvasHeight;

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }

  ctx.stroke();

  // Draw landmark points
  ctx.fillStyle = color;

  for (const lm of landmarks) {
    if (!lm || (lm.visibility ?? 1) < 0.5) {
      continue;
    }

    const x = lm.x * canvasWidth;
    const y = lm.y * canvasHeight;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      3,
      0,
      2 * Math.PI
    );

    ctx.fill();
  }

  ctx.restore();
}