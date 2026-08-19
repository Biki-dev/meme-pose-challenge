// src/components/Wheel/index.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Meme } from '../../types/meme';

interface WheelProps {
  memes: Meme[];
  onSelect: (meme: Meme) => void;
  disabled?: boolean;
}

const COLORS = ['#ef6d3b', '#c5f04b', '#7d9c71', '#d9d6cc', '#8b9b83', '#f0a35b', '#a9c57b', '#626d5d', '#e6b36d', '#91ae5a'];

export const Wheel: React.FC<WheelProps> = ({ memes, onSelect, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startRotationRef = useRef(0);

  const numSlices = memes.length;
  const sliceAngle = numSlices > 0 ? (2 * Math.PI) / numSlices : 0;

  const drawWheel = useCallback((ctx: CanvasRenderingContext2D, size: number, rot: number) => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 14;

    // Clear to transparent – no background fill
    ctx.clearRect(0, 0, size, size);

    if (numSlices === 0) return;

    for (let i = 0; i < numSlices; i += 1) {
      const start = i * sliceAngle + rot;
      const end = start + sliceAngle;
      const midAngle = start + sliceAngle / 2;
      const color = COLORS[i % COLORS.length];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#10140f';
      ctx.lineWidth = 3;
      ctx.stroke();

      const textRadius = radius * 0.62;
      const x = cx + Math.cos(midAngle) * textRadius;
      const y = cy + Math.sin(midAngle) * textRadius;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(midAngle + (midAngle > Math.PI / 2 && midAngle < (Math.PI * 3) / 2 ? Math.PI : 0));
      ctx.fillStyle = color === '#d9d6cc' || color === '#c5f04b' ? '#1c201b' : '#f7f4eb';
      ctx.font = '500 11px "DM Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = memes[i].title || `Meme ${i + 1}`;
      ctx.fillText(label.length > 14 ? `${label.slice(0, 12)}…` : label, 0, 0);
      ctx.restore();
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#10140f';
    ctx.fill();
    ctx.strokeStyle = '#c5f04b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Arrow pointer at the TOP, pointing DOWN (apex at top)
    ctx.beginPath();
    ctx.moveTo(cx, 30);
    ctx.lineTo(cx - 13, 10);
    ctx.lineTo(cx + 13, 10);
    ctx.closePath();
    ctx.fillStyle = '#c5f04b';
    ctx.fill();
  }, [memes, numSlices, sliceAngle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parentWidth = canvas.parentElement?.getBoundingClientRect().width || 400;
    const size = Math.max(220, Math.min(400, parentWidth - 28));
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(pixelRatio, pixelRatio);
    drawWheel(ctx, size, rotation);
  }, [drawWheel, rotation]);

  const spin = useCallback(() => {
    if (isSpinning || disabled || numSlices === 0) return;

    setIsSpinning(true);
    const selectedIndex = Math.floor(Math.random() * numSlices);
    // Pointer is at TOP: angle = -PI/2
    const pointerAngle = -Math.PI / 2;
    const sliceMid = (selectedIndex + 0.5) * sliceAngle;
    const targetRot = pointerAngle - sliceMid + (Math.random() - 0.5) * sliceAngle * 0.7 + (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
    const startRotation = rotation;
    const startTime = performance.now();
    startRotationRef.current = startRotation;
    startTimeRef.current = startTime;

    const animate = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      const progress = Math.min(elapsed / 3.4, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setRotation(startRotation + (targetRot - startRotation) * eased);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      setRotation(targetRot);
      setIsSpinning(false);
      // Determine which slice is at the top pointer
      let pointer = pointerAngle - targetRot;
      pointer = ((pointer % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const index = Math.floor(pointer / sliceAngle) % numSlices;
      onSelect(memes[index]);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [disabled, isSpinning, memes, numSlices, onSelect, rotation, sliceAngle]);

  useEffect(() => () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <div className="wheel-wrap">
      <div className="wheel-stage">
        <canvas ref={canvasRef} aria-label="Meme challenge selection wheel" />
      </div>
      <button className="button button-lime wheel-button" onClick={spin} disabled={isSpinning || disabled || numSlices === 0}>
        {isSpinning ? 'Spinning the deck…' : 'Spin the deck'}
      </button>
    </div>
  );
};