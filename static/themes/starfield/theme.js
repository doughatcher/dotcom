/**
 * Starfield Animation
 * Creates an animated starfield background using Canvas
 */

(function() {
  'use strict';

  // Configuration
  const config = {
    starCount: 200,
    starSpeed: 0.5,
    starSize: {
      min: 1,
      max: 3
    },
    colors: [
      'rgba(255, 255, 255, 0.8)',
      'rgba(200, 220, 255, 0.8)',
      'rgba(255, 230, 200, 0.8)',
      'rgba(220, 200, 255, 0.8)'
    ]
  };

  class Star {
    constructor(canvas) {
      this.canvas = canvas;
      this.reset();
    }

    reset() {
      this.x = Math.random() * this.canvas.width;
      this.y = Math.random() * this.canvas.height;
      this.z = Math.random() * this.canvas.width;
      this.size = Math.random() * (config.starSize.max - config.starSize.min) + config.starSize.min;
      this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
      this.brightness = Math.random() * 0.5 + 0.5;
    }

    update() {
      this.z -= config.starSpeed;
      
      if (this.z <= 0) {
        this.reset();
        this.z = this.canvas.width;
      }
    }

    draw(ctx) {
      const x = (this.x - this.canvas.width / 2) * (this.canvas.width / this.z);
      const y = (this.y - this.canvas.height / 2) * (this.canvas.width / this.z);
      const size = this.size * (this.canvas.width / this.z);
      
      const screenX = x + this.canvas.width / 2;
      const screenY = y + this.canvas.height / 2;

      if (screenX < 0 || screenX > this.canvas.width || 
          screenY < 0 || screenY > this.canvas.height) {
        return;
      }

      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.brightness * (1 - this.z / this.canvas.width);
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  class Starfield {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.stars = [];
      this.animationId = null;
      this.init();
    }

    init() {
      // Create canvas
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'starfield-canvas';
      this.ctx = this.canvas.getContext('2d');
      
      // Insert as first child of body
      document.body.insertBefore(this.canvas, document.body.firstChild);
      
      // Set initial size
      this.resize();
      
      // Create stars
      for (let i = 0; i < config.starCount; i++) {
        this.stars.push(new Star(this.canvas));
      }
      
      // Handle window resize
      window.addEventListener('resize', () => this.resize());
      
      // Start animation
      this.animate();
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    animate() {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.stars.forEach(star => {
        star.update();
        star.draw(this.ctx);
      });
      
      this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
    }
  }

  // Initialize starfield when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.starfield = new Starfield();
    });
  } else {
    window.starfield = new Starfield();
  }

  // Clean up on theme change
  window.addEventListener('themechange', () => {
    if (window.starfield) {
      window.starfield.destroy();
      window.starfield = null;
    }
  });
})();
