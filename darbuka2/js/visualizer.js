/**
 * Visualizer Module
 * Handles canvas-based audio visualization
 */

export class Visualizer {
  constructor(app) {
    this.app = app;
    this.canvas = null;
    this.ctx = null;
    this.hits = [];
    this.animationId = null;
    this.lastHitTime = 0;
    this.width = 0;
    this.height = 0;
    this.particles = [];
  }

  start() {
    this.canvas = document.getElementById('visualizer');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Start animation loop
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  triggerHit(note) {
    const now = Date.now();
    
    // Add hit effect
    this.hits.push({
      note,
      time: now,
      x: Math.random() * this.width,
      y: this.height / 2 + (Math.random() - 0.5) * 40,
      size: 0,
      maxsize: 30 + Math.random() * 20,
      alpha: 1
    });
    
    // Add particles
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        note,
        time: now,
        x: this.width / 2,
        y: this.height / 2,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        size: 3 + Math.random() * 4,
        alpha: 1
      });
    }
    
    this.lastHitTime = now;
  }

  animate() {
    if (!this.ctx || !this.canvas) return;

    const now = Date.now();
    
    // Clear canvas with fade effect
    this.ctx.fillStyle = 'rgba(11, 17, 32, 0.2)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Update and draw hits
    this.hits = this.hits.filter(hit => {
      const age = now - hit.time;
      const life = 500; // ms
      
      if (age > life) return false;

      const progress = age / life;
      
      // Grow then shrink
      if (progress < 0.3) {
        hit.size = hit.maxsize * (progress / 0.3);
      } else {
        hit.size = hit.maxsize * (1 - (progress - 0.3) / 0.7);
      }
      
      hit.alpha = 1 - progress;

      // Get color for note
      const color = this.getNoteColor(hit.note);
      
      // Draw hit circle with glow
      this.ctx.save();
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = color;
      this.ctx.beginPath();
      this.ctx.arc(hit.x, hit.y, hit.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `${color}${Math.floor(hit.alpha * 255).toString(16).padStart(2, '0')}`;
      this.ctx.fill();
      this.ctx.restore();

      // Draw note letter
      this.ctx.fillStyle = `rgba(255, 255, 255, ${hit.alpha})`;
      this.ctx.font = 'bold 14px system-ui';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(hit.note, hit.x, hit.y);

      return true;
    });

    // Update and draw particles
    this.particles = this.particles.filter(p => {
      const age = now - p.time;
      const life = 800;
      
      if (age > life) return false;
      
      const progress = age / life;
      
      // Update position
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.alpha = 1 - progress;
      p.size *= 0.98;
      
      // Draw particle
      const color = this.getNoteColor(p.note);
      this.ctx.fillStyle = `${color}${Math.floor(p.alpha * 255).toString(16).padStart(2, '0')}`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      return true;
    });

    // Draw playhead indicator when playing
    if (this.app.isPlaying) {
      const step = this.app.sequencer?.currentStep || 0;
      const stepWidth = this.width / 16;
      const x = step * stepWidth;
      
      this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#facc15';
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  getNoteColor(note) {
    const colors = {
      'D': '#3b82f6',
      'T': '#a855f7',
      'K': '#eab308',
      'S': '#ef4444',
      't': '#22d3ee',
      'k': '#fb923c',
      'B': '#fb7185',
      'R': '#64748b'
    };
    return colors[note] || '#ffffff';
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  clear() {
    this.hits = [];
    this.particles = [];
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }
}
