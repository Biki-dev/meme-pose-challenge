// src/components/CameraView/index.tsx
import React, { useRef, useEffect, useState } from 'react';
import { cameraManager } from '../../camera/cameraManager';
import { PoseLandmarkerService } from '../../pose/mediapipe';
import { drawSkeleton } from '../../pose/drawUtils';
import type { LandmarkList } from '../../types/pose';

interface CameraViewProps {
  onLandmarks?: (landmarks: LandmarkList | null) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onLandmarks }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep onLandmarks in a ref so the pose service callback is always current
  // without needing to tear down and restart the camera pipeline.
  const onLandmarksRef = useRef(onLandmarks);
  useEffect(() => {
    onLandmarksRef.current = onLandmarks;
  });

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let mounted = true;
    let service: PoseLandmarkerService | null = null;

    (async () => {
      try {
        // ── 1. Start camera ──────────────────────────────────────────────
        await cameraManager.startCamera(video);
        if (!mounted) return;

        // Sync canvas size to actual video dimensions
        const syncCanvas = () => {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        };
        video.addEventListener('loadedmetadata', syncCanvas);
        syncCanvas();

        // ── 2. Build the landmark callback ──────────────────────────────
        const onDetect = (landmarks: LandmarkList | null) => {
          // Draw skeleton onto the canvas
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (!landmarks) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
              drawSkeleton(ctx, landmarks, canvas.width, canvas.height, '#00FF88', 2);
            }
          }
          // Forward to parent
          onLandmarksRef.current?.(landmarks);
        };

        // ── 3. Start pose detection ──────────────────────────────────────
        service = new PoseLandmarkerService(video, onDetect);
        await service.initialize();
        if (!mounted) {
          service.close();
          return;
        }

        service.startDetection();
        setStatus('ready');
      } catch (err) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        // AbortError is expected in React StrictMode first-run cleanup — ignore it.
        if ((err as DOMException).name === 'AbortError') {
          console.debug('[CameraView] AbortError on first StrictMode run — second run will succeed');
          return;
        }
        console.error('[CameraView] init error:', err);
        setStatus('error');
        setErrorMsg(msg);
      }
    })();

    return () => {
      mounted = false;
      service?.stopDetection();
      service?.close();
      cameraManager.stopCamera();
    };
  }, []); // mount-only — onLandmarks is read through a ref

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Mirror the video so users see themselves as in a mirror */}
      <video
        ref={videoRef}
        style={{
          display: 'block',
          width: '640px',
          height: '480px',
          transform: 'scaleX(-1)',
          background: '#000',
        }}
        autoPlay
        playsInline
        muted
      />
      {/* Canvas is mirrored to match — skeleton overlays correctly */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          transform: 'scaleX(-1)',
        }}
      />

      {/* Status overlay */}
      {status !== 'ready' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            borderRadius: '4px',
          }}
        >
          {status === 'loading' && (
            <p style={{ textAlign: 'center', padding: '1rem' }}>
              📷 Loading camera &amp; pose model…
            </p>
          )}
          {status === 'error' && (
            <p style={{ textAlign: 'center', padding: '1rem', color: '#ff6b6b' }}>
              ⚠️ Camera error: {errorMsg}
            </p>
          )}
        </div>
      )}
    </div>
  );
};