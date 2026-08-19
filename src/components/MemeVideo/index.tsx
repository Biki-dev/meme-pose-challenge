import React, { useRef, useEffect } from 'react';

interface MemeVideoProps {
  videoUrl: string;
  isPlaying: boolean;
  onEnded?: () => void;
}

export const MemeVideo: React.FC<MemeVideoProps> = ({ videoUrl, isPlaying, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      style={{ width: '100%', maxWidth: '400px', background: '#000', borderRadius: '8px' }}
      loop
      muted
      playsInline
      onEnded={onEnded}
    />
  );
};