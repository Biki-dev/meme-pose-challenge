// src/camera/cameraManager.ts
export class CameraManager {
  private stream: MediaStream | null = null;
  public video: HTMLVideoElement | null = null;

  async startCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    if (this.stream) return this.stream;

    this.video = videoElement;
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.video.srcObject = this.stream;
    await this.video.play();
    return this.stream;
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
  }
}

// Singleton instance
export const cameraManager = new CameraManager();