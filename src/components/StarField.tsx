'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number; y: number;
  r: number; opacity: number;
  speed: number; hue: number;
  drift: number;
}

interface ShootingStar {
  x: number; y: number;
  len: number; speed: number;
  opacity: number; active: boolean;
  timer: number; interval: number;
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let frame  = 0;

    const stars: Star[]          = [];
    const shooters: ShootingStar[] = [];

    function initStars() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      stars.length    = 0;
      shooters.length = 0;

      const count = Math.min(280, Math.floor((canvas.width * canvas.height) / 4800));
      for (let i = 0; i < count; i++) {
        stars.push({
          x:       Math.random() * canvas.width,
          y:       Math.random() * canvas.height,
          r:       Math.random() * 1.3 + 0.15,
          opacity: Math.random() * 0.7 + 0.2,
          speed:   Math.random() * 0.025 + 0.004,
          hue:     Math.random() > 0.85 ? 190 + Math.random() * 50 : 0,
          drift:   (Math.random() - 0.5) * 0.012,
        });
      }

      /* 3 shooting stars that fire at random intervals */
      for (let i = 0; i < 3; i++) {
        shooters.push({
          x: 0, y: 0, len: 0, speed: 0, opacity: 0,
          active:   false,
          timer:    Math.random() * 300,
          interval: 300 + Math.random() * 600,
        });
      }
    }

    function spawnShooter(s: ShootingStar) {
      s.x       = Math.random() * canvas.width * 0.6;
      s.y       = Math.random() * canvas.height * 0.4;
      s.len     = 60 + Math.random() * 100;
      s.speed   = 8 + Math.random() * 10;
      s.opacity = 1;
      s.active  = true;
    }

    function draw() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* Stars */
      for (const star of stars) {
        const flicker = 0.55 + Math.sin(frame * star.speed + star.drift * 1000) * 0.45;
        const alpha   = Math.max(0, star.opacity * flicker);
        if (star.hue === 0) {
          ctx.fillStyle = `rgba(240,240,255,${alpha.toFixed(2)})`;
        } else {
          ctx.fillStyle = `hsla(${star.hue},75%,82%,${alpha.toFixed(2)})`;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* Shooting stars */
      for (const s of shooters) {
        s.timer--;
        if (!s.active) {
          if (s.timer <= 0) { spawnShooter(s); s.timer = s.interval; }
          continue;
        }
        s.x       += s.speed;
        s.y       += s.speed * 0.45;
        s.opacity -= 0.018;
        if (s.opacity <= 0 || s.x > canvas.width) { s.active = false; continue; }

        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.len, s.y - s.len * 0.45);
        grad.addColorStop(0, `rgba(255,255,255,${s.opacity.toFixed(2)})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.len, s.y - s.len * 0.45);
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    }

    initStars();
    window.addEventListener('resize', initStars);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', initStars);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    />
  );
}
