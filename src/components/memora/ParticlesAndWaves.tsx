'use client';

import React, { useEffect, useRef } from 'react';
import * as createjs from 'createjs-module';

interface ParticlesAndWavesProps {
  className?: string;
  reducedMotion?: boolean;
  maxParticles?: number;
  disableWaves?: boolean;
}

// Noise functions adapted from the original script
class NoiseGenerator {
  private static grad3 = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
  ];

  private static p = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
    140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
    247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
    57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
    74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
    60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
    65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
    200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
    207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
    119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
    218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
    81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
    184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
    222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
  ];

  private static perm: number[] = [];
  private static gradP: number[][] = [];

  static {
    // Initialize permutation arrays
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.gradP[i] = this.grad3[this.perm[i] % 12];
    }
  }

  private static fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private static lerp(a: number, b: number, t: number): number {
    return (1 - t) * a + t * b;
  }

  static noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const A = this.perm[X] + Y;
    const AA = this.perm[A];
    const AB = this.perm[A + 1];
    const B = this.perm[X + 1] + Y;
    const BA = this.perm[B];
    const BB = this.perm[B + 1];

    return this.lerp(
      this.lerp(
        this.grad(this.perm[AA], x, y),
        this.grad(this.perm[BA], x - 1, y),
        u
      ),
      this.lerp(
        this.grad(this.perm[AB], x, y - 1),
        this.grad(this.perm[BB], x - 1, y - 1),
        u
      ),
      v
    );
  }

  private static grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}

// Particle class with musical emojis (matching script.js modifications)
class Particle {
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public life: number = 0;
  public maxLife: number = 0;
  public alpha: number = 1;
  public scale: number = 1;
  public isDead: boolean = false;
  public icon: string = '♪';
  public color: string = '#6366f1';
  public size: number = 16;

  // Musical icons array (matching script.js)
  private static icons = ['❤️', '♪', '♫', '♩'];

  constructor() {
    this.resetParameters();
  }

  resetParameters(): void {
    this.life = 0;
    // MODIFICAÇÃO: Tempo de vida duplicado (matching script.js: 800+80)
    this.maxLife = Math.random() * Math.random() * 800 + 80;
    this.alpha = 1;
    this.scale = 0.5 + Math.random() * 0.5;
    this.isDead = false;
    
    // Select random musical icon
    this.icon = Particle.icons[Math.floor(Math.random() * Particle.icons.length)];
    
    // Generate vibrant random color (matching script.js)
    const hue = Math.random() * 360;
    const lightness = 50 + Math.random() * 30;
    this.color = `hsl(${hue}, 100%, ${lightness}%)`;
    
    // Random size
    this.size = 12 + Math.random() * 8;
  }

  update(): void {
    this.life++;
    
    // MODIFICAÇÃO: Gravidade reduzida em 50% (matching script.js: 0.015)
    this.vy -= 0.015;
    
    // Friction (matching script.js)
    this.vx *= 0.99;
    this.vy *= 0.99;
    
    this.x += this.vx;
    this.y += this.vy;
    
    const lifeRatio = this.life / this.maxLife;
    this.alpha = Math.random() * 0.3 + 0.7 * (1 - lifeRatio);
    this.scale = (1 - lifeRatio * 0.5);
    
    if (this.life >= this.maxLife) {
      this.isDead = true;
    }
  }

  getIsDead(): boolean {
    return this.isDead;
  }
}

// Main animation class
class ParticlesAnimation {
  private stage: createjs.Stage;
  private canvas: HTMLCanvasElement;
  private particles: Particle[] = [];
  private particlePool: Particle[] = [];
  private waveContainer: createjs.Container;
  private particleContainer: createjs.Container;
  private time: number = 0;
  private animationId: number | null = null;
  private isRunning: boolean = false;
  private maxParticles: number;
  private reducedMotion: boolean;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private targetFPS: number = 60;

  private disableWaves: boolean;

  constructor(canvas: HTMLCanvasElement, maxParticles: number = 100, reducedMotion: boolean = false, disableWaves: boolean = false) {
    this.canvas = canvas;
    this.maxParticles = maxParticles;
    this.reducedMotion = reducedMotion;
    this.disableWaves = disableWaves;
    this.stage = new createjs.Stage(canvas);
    this.waveContainer = new createjs.Container();
    this.particleContainer = new createjs.Container();
    
    this.stage.addChild(this.waveContainer);
    this.stage.addChild(this.particleContainer);
    
    // Enable ticker for better performance
    createjs.Ticker.framerate = this.targetFPS;
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    
    this.initParticlePool();
    this.resize();
  }

  private initParticlePool(): void {
    const poolSize = this.reducedMotion ? Math.min(this.maxParticles, 50) : this.maxParticles * 2;
    for (let i = 0; i < poolSize; i++) {
      this.particlePool.push(new Particle());
    }
  }

  private getParticleFromPool(): Particle | null {
    return this.particlePool.pop() || null;
  }

  private returnParticleToPool(particle: Particle): void {
    particle.resetParameters();
    this.particlePool.push(particle);
  }

  private createWaves(): void {
    // Skip wave creation if disabled
    if (this.disableWaves) return;
    
    // Create waves even with reduced motion, but with simpler animation
    // if (this.reducedMotion) return;
    
    this.waveContainer.removeAllChildren();
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Aumentar número de camadas para simular espectro sonoro
    const layerCount = width < 768 ? 4 : 6; // Mais camadas para ondas sonoras
    const step = width < 768 ? 8 : 5;
    
    // MODIFICAÇÃO: Velocidade aumentada significativamente para movimento mais visível (de 10000 para 4000)
    const timeScale = this.time / 4000;
    
    // Create multiple wave layers with different frequencies (sound spectrum)
    for (let layer = 0; layer < layerCount; layer++) {
      const wave = new createjs.Shape();
      const graphics = wave.graphics;
      
      graphics.clear();
      
      // Cores que remetem a ondas sonoras (azul/ciano/branco)
      const waveColors = [
        'rgba(99, 102, 241, 0.8)',   // Indigo
        'rgba(59, 130, 246, 0.7)',   // Blue
        'rgba(14, 165, 233, 0.6)',   // Sky
        'rgba(6, 182, 212, 0.5)',    // Cyan
        'rgba(255, 255, 255, 0.4)',  // White
        'rgba(167, 243, 208, 0.3)'   // Emerald light
      ];
      
      const color = waveColors[layer % waveColors.length];
      graphics.beginStroke(color);
      
      // Espessura aumentada significativamente para ondas mais evidentes
      const strokeWidth = (layer === 0 ? 3 : 2.5 - layer * 0.3) + Math.sin(timeScale * 2) * 0.5;
      graphics.setStrokeStyle(Math.max(strokeWidth, 0.8));
      
      const points: {x: number, y: number}[] = [];
      const BASE_Y = height / 2;
      
      // Add starting point
      points.push({ x: -200, y: BASE_Y });
      
      // Generate wave points with different frequencies for sound spectrum
      const vertexNum = 15; // Mais pontos para ondas mais suaves
      const frequency = 0.15 + layer * 0.05; // Diferentes frequências por camada
      const phaseOffset = layer * Math.PI / 3; // Offset de fase para cada camada
      
      for (let i = 0; i <= vertexNum; i++) {
        // Combinar ruído Perlin com ondas senoidais para efeito de onda sonora
        const noiseValue = NoiseGenerator.noise(i * frequency, timeScale + layer * 0.15);
        const sineWave = Math.sin((i * 0.3 + timeScale * 3.0 + phaseOffset)) * 0.4; // Velocidade e amplitude aumentadas
        
        // Amplitude aumentada significativamente para ondas mais pronunciadas e visíveis
        const amplitude = (0.8 + layer * 0.2) * height * 0.2; // Amplitude ainda maior para movimento mais visível
        const y = (noiseValue * 0.8 + sineWave) * amplitude + BASE_Y; // Maior contribuição do movimento senoidal
        
        points.push({
          x: (width * (i / vertexNum)) >> 0,
          y: y
        });
      }
      
      // Add ending point
      points.push({ x: width + 200, y: BASE_Y });
      
      // Draw smooth curves with enhanced smoothness
      for (let i = 0; i < points.length; i++) {
        if (i >= 2) {
          const p0 = points[i];
          const p1 = points[i - 1];
          const p2 = points[i - 2];
          
          const curveStartX = (p2.x + p1.x) / 2;
          const curveStartY = (p2.y + p1.y) / 2;
          const curveEndX = (p0.x + p1.x) / 2;
          const curveEndY = (p0.y + p1.y) / 2;
          
          graphics.moveTo(curveStartX, curveStartY);
          graphics.curveTo(p1.x, p1.y, curveEndX, curveEndY);
        }
      }
      
      // Adicionar gradiente sutil para profundidade com movimento mais perceptível
      wave.alpha = 0.7 + Math.sin(timeScale * 2 + layer) * 0.3; // Variação de alpha mais intensa
      wave.compositeOperation = 'screen'; // Blend mode para efeito luminoso
      
      this.waveContainer.addChild(wave);
    }
  }

  private emitParticles(): void {
    // Aumentar frequência de emissão em 25% (de 0.3 para 0.375)
    const emissionRate = this.reducedMotion ? 0.125 : 0.375;
    const maxActiveParticles = this.reducedMotion ? Math.min(this.maxParticles, 30) : this.maxParticles;
    
    if (this.particles.length < maxActiveParticles && Math.random() < emissionRate) {
      const particle = this.getParticleFromPool();
      if (particle) {
        particle.x = Math.random() * this.canvas.width;
        particle.y = this.canvas.height * 0.9 + Math.random() * this.canvas.height * 0.1;
        // MODIFICAÇÃO: Velocidade inicial aumentada em 25% (de 1.0 para 1.25)
        particle.vx = (Math.random() - 0.5) * 1.25;
        particle.vy = (Math.random() - 0.5) * 1.25;
        this.particles.push(particle);
      }
    }
  }

  private updateParticles(): void {
    this.particleContainer.removeAllChildren();
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update();
      
      if (particle.getIsDead()) {
        this.returnParticleToPool(particle);
        this.particles.splice(i, 1);
      } else {
        // Create text instead of circle (matching script.js modifications)
        const text = new createjs.Text(particle.icon, `${particle.size}px Arial`, particle.color);
        text.textAlign = 'center';
        text.textBaseline = 'middle';
        text.x = particle.x;
        text.y = particle.y;
        text.alpha = particle.alpha;
        text.scaleX = text.scaleY = particle.scale;
        text.compositeOperation = 'lighter';
        this.particleContainer.addChild(text);
      }
    }
  }

  private animate = (currentTime: number = 0): void => {
    if (!this.isRunning) return;
    
    // Frame rate limiting for better performance
    const deltaTime = currentTime - this.lastFrameTime;
    const targetFrameTime = 1000 / this.targetFPS;
    
    if (deltaTime >= targetFrameTime) {
      this.time += 2; // Incremento dobrado para movimento mais rápido e visível
      this.frameCount++;
      
      // Update waves every frame for smooth animation (only if not disabled)
      this.createWaves();
      
      this.emitParticles();
      this.updateParticles();
      this.stage.update();
      
      this.lastFrameTime = currentTime;
    }
    
    this.animationId = requestAnimationFrame(this.animate);
  };

  public start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.stage.update();
  }

  public destroy(): void {
    this.stop();
    this.stage.removeAllChildren();
    this.particles = [];
    this.particlePool = [];
  }
}

const ParticlesAndWaves: React.FC<ParticlesAndWavesProps> = ({ 
  className = '', 
  reducedMotion, 
  maxParticles = 100,
  disableWaves = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<ParticlesAnimation | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Force animation for waves while respecting reduced motion for particles only
    const prefersReducedMotion = reducedMotion ?? false; // Force waves animation
    
    // Adjust max particles based on device capabilities
    const devicePixelRatio = window.devicePixelRatio || 1;
    const isMobile = window.innerWidth < 768;
    const adjustedMaxParticles = isMobile ? Math.min(maxParticles, 50) : maxParticles;

    // Initialize animation
    animationRef.current = new ParticlesAnimation(
      canvasRef.current, 
      adjustedMaxParticles, 
      prefersReducedMotion,
      disableWaves
    );
    animationRef.current.start();

    // Handle resize with debouncing
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (animationRef.current) {
          animationRef.current.resize();
        }
      }, 150);
    };

    // Handle visibility change to pause animation when not visible
    const handleVisibilityChange = () => {
      if (animationRef.current) {
        if (document.hidden) {
          animationRef.current.stop();
        } else {
          animationRef.current.start();
        }
      }
    };

    // Intersection Observer to pause animation when not in viewport
    let observer: IntersectionObserver | null = null;
    if (containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (animationRef.current) {
              if (entry.isIntersecting) {
                animationRef.current.start();
              } else {
                animationRef.current.stop();
              }
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (observer) {
        observer.disconnect();
      }
      if (animationRef.current) {
        animationRef.current.destroy();
      }
    };
  }, [reducedMotion, maxParticles, disableWaves]);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background: 'transparent',
          zIndex: 0,
          willChange: 'transform'
        }}
      />
    </div>
  );
};

export default ParticlesAndWaves;