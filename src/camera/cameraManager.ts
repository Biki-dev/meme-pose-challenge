// src/camera/cameraManager.ts
export class CameraManager {
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;

  async startCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    // Reuse existing stream if it's already attached to the same element.
    if (this.stream && this.videoEl === videoElement) {
      // Ensure srcObject is still set (it can be cleared by stopCamera racing)
      if (!videoElement.srcObject) {
        videoElement.srcObject = this.stream;
      }
      return this.stream;
    }

    // Stop any lingering stream from a previous element.
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }

    this.videoEl = videoElement;

    const constraints: MediaStreamConstraints = {
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // By the time getUserMedia resolves, stopCamera() may have been called
    // (React StrictMode double-invocation).  Check if this call is still valid.
    if (this.videoEl !== videoElement) {
      // We were superseded — release this stream and bail out.
      stream.getTracks().forEach((t) => t.stop());
      throw new DOMException('Superseded by a newer startCamera call', 'AbortError');
    }

    this.stream = stream;
    videoElement.srcObject = stream;

    try {
      await videoElement.play();
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') {
        // Expected during React StrictMode double-effect; the video will
        // resume playing when srcObject is re-attached by the second run.
        console.debug('[CameraManager] play() AbortError suppressed (StrictMode dev)');
      } else {
        throw err;
      }
    }

    return stream;
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
      this.videoEl = null;
    }
  }
}

// Singleton — shared across the app so camera is only opened once.
export const cameraManager = new CameraManager();