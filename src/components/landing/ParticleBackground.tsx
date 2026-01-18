'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  hue: number; // For color variation (cyan to blue to purple)
}

interface ParticleBackgroundProps {
  particleCount?: number;
  connectionDistance?: number;
  className?: string;
}

export function ParticleBackground({
  particleCount = 80,
  connectionDistance = 150,
  className = '',
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.5 + 0.2,
        hue: Math.random() * 60 + 180, // Range from cyan (180) to blue-purple (240)
      });
    }

    return particles;
  }, [particleCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Reinitialize particles on resize
      particlesRef.current = initParticles(rect.width, rect.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const rect = canvas.getBoundingClientRect();
    particlesRef.current = initParticles(rect.width, rect.height);

    // Animation loop
    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const particles = particlesRef.current;

      // Update and draw particles
      particles.forEach((particle, index) => {
        // Update position with slight oscillation
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges smoothly
        if (particle.x < -10) particle.x = rect.width + 10;
        if (particle.x > rect.width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = rect.height + 10;
        if (particle.y > rect.height + 10) particle.y = -10;

        // Subtle opacity pulsing
        particle.opacity = 0.3 + Math.sin(Date.now() * 0.001 + index) * 0.2;

        // Draw particle with glow effect
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 60%, ${particle.opacity})`);
        gradient.addColorStop(0.5, `hsla(${particle.hue}, 100%, 50%, ${particle.opacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 50%, 0)`);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw core of particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 100%, 70%, ${particle.opacity + 0.3})`;
        ctx.fill();

        // Draw connections to nearby particles
        for (let j = index + 1; j < particles.length; j++) {
          const otherParticle = particles[j];
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const connectionOpacity = (1 - distance / connectionDistance) * 0.15;

            // Create gradient line
            const lineGradient = ctx.createLinearGradient(
              particle.x, particle.y,
              otherParticle.x, otherParticle.y
            );
            lineGradient.addColorStop(0, `hsla(${particle.hue}, 100%, 60%, ${connectionOpacity})`);
            lineGradient.addColorStop(1, `hsla(${otherParticle.hue}, 100%, 60%, ${connectionOpacity})`);

            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initParticles, connectionDistance]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{
        background: 'linear-gradient(180deg, var(--landing-bg-primary, #0D1117) 0%, var(--landing-deep-blue, #0A1628) 50%, var(--landing-bg-secondary, #1A1F2E) 100%)',
        width: '100%',
        height: '100%',
      }}
      aria-hidden="true"
    />
  );
}

export default ParticleBackground;
