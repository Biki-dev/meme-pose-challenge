import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Meme } from '../../types/meme';

interface WheelProps {
  memes: Meme[];
  onSelect: (meme: Meme) => void;
  disabled?: boolean;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#FF8A5C', '#A29BFE', '#FD79A8', '#00CEC9',
];

export const Wheel: React.FC<WheelProps> = ({ memes, onSelect, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startRotationRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);

  const numSlices = memes.length;
  const sliceAngle = (2 * Math.PI) / numSlices;

  // Draw the wheel
  const drawWheel = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, rot: number) => {
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) / 2 - 10;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < numSlices; i++) {
        const start = i * sliceAngle + rot;
        const end = start + sliceAngle;
        const color = COLORS[i % COLORS.length];
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text label
        const midAngle = start + sliceAngle / 2;
        const textRadius = radius * 0.6;
        const x = cx + Math.cos(midAngle) * textRadius;
        const y = cy + Math.sin(midAngle) * textRadius;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(midAngle + (midAngle > Math.PI / 2 ? Math.PI : 0));
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = memes[i].title || `Meme ${i + 1}`;
        // Truncate if too long
        const displayLabel = label.length > 12 ? label.slice(0, 10) + '…' : label;
        ctx.fillText(displayLabel, 0, 0);
        ctx.restore();
      }

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pointer (triangle at top)
      ctx.beginPath();
      ctx.moveTo(cx, 10);
      ctx.lineTo(cx - 15, 30);
      ctx.lineTo(cx + 15, 30);
      ctx.closePath();
      ctx.fillStyle = '#FF2E88';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [numSlices, memes, sliceAngle]
  );

  // Redraw on rotation change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    const size = Math.min(400, (rect?.width || 400) - 40);
    canvas.width = size;
    canvas.height = size;
    drawWheel(ctx, size, size, rotation);
  }, [rotation, drawWheel]);

  // Spin logic
  const spin = useCallback(() => {
    if (isSpinning || disabled || numSlices === 0) return;
    setIsSpinning(true);

    // Pick random slice
    const selectedIndex = Math.floor(Math.random() * numSlices);
    // Calculate final rotation so that the selected slice ends at the top pointer
    const pointerAngle = -Math.PI / 2; // top
    const sliceMid = (selectedIndex + 0.5) * sliceAngle;
    let targetRot = pointerAngle - sliceMid;
    // Add random offset within slice for natural feel
    targetRot += (Math.random() - 0.5) * sliceAngle * 0.8;
    // Add several full turns
    const extraTurns = 5 + Math.floor(Math.random() * 4);
    targetRot += extraTurns * 2 * Math.PI;

    targetRotationRef.current = targetRot;
    startRotationRef.current = rotation;
    startTimeRef.current = performance.now();

    const animate = (time: number) => {
      if (startTimeRef.current === null) return;
      const elapsed = (time - startTimeRef.current) / 1000;
      const duration = 4; // seconds
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRotationRef.current + (targetRot - startRotationRef.current) * eased;
      setRotation(currentRot);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setRotation(targetRot);
        setIsSpinning(false);
        // Determine which slice is at the top
        let pointer = -Math.PI / 2 - targetRot;
        pointer = ((pointer % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const idx = Math.floor(pointer / sliceAngle) % numSlices;
        onSelect(memes[idx]);
      }
    };
    animationRef.current = requestAnimationFrame(animate);
  }, [isSpinning, disabled, numSlices, sliceAngle, rotation, memes, onSelect]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 'auto', borderRadius: '8px', background: '#1a1a2e' }}
        />
      </div>
      <button
        onClick={spin}
        disabled={isSpinning || disabled || numSlices === 0}
        style={{
          padding: '0.8rem 2rem',
          fontSize: '1.2rem',
          background: '#00e5ff',
          color: '#0a0a0f',
          border: 'none',
          borderRadius: '8px',
          cursor: isSpinning ? 'default' : 'pointer',
          opacity: isSpinning ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {isSpinning ? '🎡 Spinning...' : '🎯 SPIN!'}
      </button>
    </div>
  );
};