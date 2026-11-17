import React, { useEffect, useRef } from 'react';
import { ThemeId } from '../types';

interface NightSkyCanvasProps {
  theme: ThemeId;
  dimLevel?: number; // 0 (brightest normal) to 1 (near-black)
}

interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  twinkleSpeed: number;
  driftX: number;
  phase: number;
}

interface Cloud {
  x: number;
  y: number;
  rx: number;
  ry: number;
  speed: number;
  alpha: number;
}

interface RainDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
}

export const NightSkyCanvas: React.FC<NightSkyCanvasProps> = ({
  theme,
  dimLevel = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const stars: Star[] = Array.from({ length: 85 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.85,
      r: 0.5 + Math.random() * 1.4,
      alpha: 0.15 + Math.random() * 0.45,
      twinkleSpeed: 0.004 + Math.random() * 0.01,
      driftX: 0.012 + Math.random() * 0.025,
      phase: Math.random() * Math.PI * 2,
    }));

    const clouds: Cloud[] = Array.from({ length: 5 }, (_, i) => ({
      x: (width / 4) * i,
      y: height * (0.14 + (i % 3) * 0.16),
      rx: 220 + Math.random() * 180,
      ry: 55 + Math.random() * 35,
      speed: 0.06 + Math.random() * 0.06,
      alpha: 0.022 + Math.random() * 0.018,
    }));

    const particles = Array.from({ length: 24 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.08,
      vy: -0.05 - Math.random() * 0.08,
      alpha: 0.05 + Math.random() * 0.1,
    }));

    const raindrops: RainDrop[] = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: 14 + Math.random() * 18,
      speed: 3.4 + Math.random() * 2.2,
      alpha: 0.06 + Math.random() * 0.08,
    }));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Base sky gradient by theme
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      if (theme === 'midnight') {
        grad.addColorStop(0, '#050814');
        grad.addColorStop(0.55, '#091022');
        grad.addColorStop(1, '#04060d');
      } else if (theme === 'rain') {
        grad.addColorStop(0, '#050912');
        grad.addColorStop(0.6, '#0b1321');
        grad.addColorStop(1, '#04070d');
      } else if (theme === 'mist') {
        grad.addColorStop(0, '#080a14');
        grad.addColorStop(0.55, '#111426');
        grad.addColorStop(1, '#06070d');
      } else {
        // obsidian
        grad.addColorStop(0, '#030408');
        grad.addColorStop(1, '#05060a');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Soft distant moonlight halo
      if (theme !== 'obsidian') {
        const moonX = width * 0.82;
        const moonY = height * 0.16;
        const moonGlow = ctx.createRadialGradient(
          moonX,
          moonY,
          8,
          moonX,
          moonY,
          Math.min(width, height) * 0.36
        );
        const moonIntensity = theme === 'rain' ? 0.05 : 0.095;
        moonGlow.addColorStop(0, `rgba(226, 222, 238, ${moonIntensity})`);
        moonGlow.addColorStop(0.45, `rgba(164, 154, 206, ${moonIntensity * 0.35})`);
        moonGlow.addColorStop(1, 'rgba(5, 8, 20, 0)');
        ctx.fillStyle = moonGlow;
        ctx.fillRect(0, 0, width, height);

        // Subtle crescent moon disc
        if (theme !== 'rain') {
          ctx.save();
          ctx.globalAlpha = 0.24 * (1 - dimLevel * 0.7);
          ctx.fillStyle = '#e8e4dc';
          ctx.beginPath();
          ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.arc(moonX + 7, moonY - 5, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Slowly moving stars
      const starScale = theme === 'obsidian' ? 0.35 : theme === 'rain' ? 0.45 : 1;
      for (const s of stars) {
        if (!prefersReducedMotion) {
          s.x += s.driftX;
          if (s.x > width + 4) s.x = -4;
        }
        const twinkle = prefersReducedMotion
          ? 1
          : 0.65 + 0.35 * Math.sin(time * 0.001 * (s.twinkleSpeed * 120) + s.phase);
        ctx.fillStyle = `rgba(232, 229, 240, ${
          s.alpha * twinkle * starScale * (1 - dimLevel * 0.75)
        })`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Very slow-moving soft clouds
      if (theme !== 'obsidian') {
        for (const c of clouds) {
          if (!prefersReducedMotion) {
            c.x += c.speed;
            if (c.x - c.rx > width) c.x = -c.rx;
          }
          const cg = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, c.rx);
          cg.addColorStop(
            0,
            `rgba(165, 174, 204, ${c.alpha * (1 - dimLevel * 0.8)})`
          );
          cg.addColorStop(1, 'rgba(165, 174, 204, 0)');
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Gentle ambient drifting particles
      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -10) p.y = height + 10;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }
        ctx.fillStyle = `rgba(184, 174, 220, ${p.alpha * (1 - dimLevel * 0.75)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Optional gentle rainfall
      if (theme === 'rain' && !prefersReducedMotion) {
        ctx.strokeStyle = `rgba(195, 208, 228, ${0.14 * (1 - dimLevel * 0.6)})`;
        ctx.lineWidth = 1;
        for (const d of raindrops) {
          d.y += d.speed;
          d.x -= 0.45;
          if (d.y > height) {
            d.y = -d.len;
            d.x = Math.random() * (width + 60);
          }
          ctx.globalAlpha = d.alpha * (1 - dimLevel * 0.5);
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - 2.5, d.y + d.len);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      if (!prefersReducedMotion) {
        animId = window.requestAnimationFrame(draw);
      }
    };

    animId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme, dimLevel]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};
