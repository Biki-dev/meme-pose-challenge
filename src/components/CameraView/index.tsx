// src/components/CameraView/index.tsx
import React, { useRef, useEffect, useState } from "react";
import { cameraManager } from "../../camera/cameraManager";
import { PoseLandmarkerService } from "../../pose/mediapipe";
import { drawSkeleton } from "../../pose/drawUtils";
import type { LandmarkList } from "../../types/pose";

export const CameraView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarks, setLandmarks] = useState<LandmarkList | null>(null);
  const [isReady, setIsReady] = useState(false);
  const poseServiceRef = useRef<PoseLandmarkerService | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Start camera
    cameraManager.startCamera(video)
      .then(() => {
        // Set canvas size to match video dimensions
        const resizeCanvas = () => {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        };
        video.addEventListener("loadedmetadata", resizeCanvas);
        resizeCanvas();

        // Initialise MediaPipe
        const service = new PoseLandmarkerService(
          video,
          (landmarks: LandmarkList | null) => {
            setLandmarks(landmarks);
          }
        );
        service.initialize().then(() => {
          service.startDetection();
          poseServiceRef.current = service;
          setIsReady(true);
        });

        return () => {
          service.stopDetection();
          service.close();
          cameraManager.stopCamera();
        };
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setIsReady(false);
      });

    // Cleanup on unmount
    return () => {
      if (poseServiceRef.current) {
        poseServiceRef.current.stopDetection();
        poseServiceRef.current.close();
        poseServiceRef.current = null;
      }
      cameraManager.stopCamera();
    };
  }, []);

  // Draw skeleton on canvas whenever landmarks update
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!landmarks) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    drawSkeleton(ctx, landmarks, canvas.width, canvas.height, "#00FF88", 2);
  }, [landmarks]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <video
        ref={videoRef}
        style={{
          display: "block",
          width: "640px",
          height: "480px",
          transform: "scaleX(-1)", // mirror for natural self-view
        }}
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      {!isReady && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "white",
          background: "rgba(0,0,0,0.7)",
          padding: "1rem",
          borderRadius: "8px",
        }}>
          Loading camera & pose model...
        </div>
      )}
    </div>
  );
};