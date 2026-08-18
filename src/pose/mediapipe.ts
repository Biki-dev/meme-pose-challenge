// src/pose/mediapipe.ts

import {
  PoseLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

import type {
  PoseLandmarkerOptions,
} from "@mediapipe/tasks-vision";

import type { LandmarkList } from "../types/pose";

export type PoseDetectionCallback = (
  landmarks: LandmarkList | null,
  timestampMs: number
) => void;

export class PoseLandmarkerService {
  private landmarker: PoseLandmarker | null = null;
  private running = false;
  private animationId: number | null = null;
  private lastTimestamp = 0;

  private videoElement: HTMLVideoElement;
  private onLandmarks: PoseDetectionCallback;
  private options?: Partial<PoseLandmarkerOptions>;

  constructor(
    videoElement: HTMLVideoElement,
    onLandmarks: PoseDetectionCallback,
    options?: Partial<PoseLandmarkerOptions>
  ) {
    this.videoElement = videoElement;
    this.onLandmarks = onLandmarks;
    this.options = options;
  }

  async initialize(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    const baseOptions: PoseLandmarkerOptions = {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/" +
          "pose_landmarker/pose_landmarker_lite/" +
          "float16/1/pose_landmarker_lite.task",

        delegate: "GPU",
      },

      runningMode: "VIDEO",

      numPoses: 1,

      minPoseDetectionConfidence: 0.5,

      minPosePresenceConfidence: 0.5,

      minTrackingConfidence: 0.5,

      ...this.options,
    };

    this.landmarker =
      await PoseLandmarker.createFromOptions(
        vision,
        baseOptions
      );
  }

  startDetection(): void {
    if (this.running || !this.landmarker) {
      return;
    }

    this.running = true;
    this.lastTimestamp = 0;

    this.detectLoop();
  }

  stopDetection(): void {
    this.running = false;

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private detectLoop = (): void => {
    if (!this.running || !this.landmarker) {
      return;
    }

    const video = this.videoElement;

    if (video.readyState >= 2) {
      const timestamp = performance.now();

      // Approximately 30 detections per second.
      if (timestamp - this.lastTimestamp > 30) {
        const result =
          this.landmarker.detectForVideo(
            video,
            timestamp
          );

        if (
          result.landmarks &&
          result.landmarks.length > 0
        ) {
          const landmarks =
            result.landmarks[0] as unknown as LandmarkList;

          this.onLandmarks(
            landmarks,
            timestamp
          );
        } else {
          this.onLandmarks(
            null,
            timestamp
          );
        }

        this.lastTimestamp = timestamp;
      }
    }

    this.animationId =
      requestAnimationFrame(
        this.detectLoop
      );
  };

  close(): void {
    this.stopDetection();

    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }
  }
}