// ============================================================
// Pretext-Powered Interactive & Animated Effects
// Uses @chenglou/pretext for text measurement & canvas rendering
// ============================================================

import { prepare, layout, prepareWithSegments, layoutWithLines } from 'https://cdn.jsdelivr.net/npm/@chenglou/pretext/+esm';

// ---- UTILITY ----
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rand(min, max) { return Math.random() * (max - min) + min; }

// ============================================================
// 1. HERO CANVAS PARTICLE TEXT
//    Renders the tagline as particles on a canvas overlay
// ============================================================
class ParticleText {
  constructor(canvas, text, font, color) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.text = text;
    this.font = font;
    this.color = color;
    this.particles = [];
    this.mouse = { x: -9999, y: -9999, radius: 80 };
    this.animating = true;
    this.prepared = null;

    this._resize();
    this._initParticles();
    this._bindEvents();
    this._loop();
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
    this.w = rect.width;
    this.h = rect.height;
  }

  _initParticles() {
    const ctx = this.ctx;
    const fontSize = Math.min(this.w * 0.06, 60);
    const fontStr = `bold ${fontSize}px "Bebas Neue", sans-serif`;

    // Use pretext to measure and layout text
    try {
      this.prepared = prepare(this.text, fontStr);
      const metrics = layout(this.prepared, this.w * 0.8, fontSize * 1.2);
      this.textHeight = metrics.height;
    } catch (e) {
      this.textHeight = fontSize * 1.2;
    }

    // Render text offscreen to get pixel data
    const offscreen = document.createElement('canvas');
    offscreen.width = this.w * this.dpr;
    offscreen.height = this.h * this.dpr;
    const offCtx = offscreen.getContext('2d');
    offCtx.scale(this.dpr, this.dpr);
    offCtx.fillStyle = this.color;
    offCtx.font = fontStr;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(this.text, this.w / 2, this.h * 0.65);

    // Sample pixels
    const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
    const data = imageData.data;
    const gap = Math.max(2, Math.floor(3 * this.dpr));
    this.particles = [];

    for (let y = 0; y < offscreen.height; y += gap) {
      for (let x = 0; x < offscreen.width; x += gap) {
        const i = (y * offscreen.width + x) * 4;
        if (data[i + 3] > 128) {
          const px = x / this.dpr;
          const py = y / this.dpr;
          this.particles.push({
            x: rand(0, this.w), y: rand(0, this.h),
            targetX: px, targetY: py,
            size: rand(1, 2.5),
            vx: 0, vy: 0,
            opacity: rand(0.5, 1),
          });
        }
      }
    }
  }

  _bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });
    window.addEventListener('resize', () => {
      this._resize();
      this._initParticles();
    });
  }

  _loop() {
    if (!this.animating) return;
    this._draw();
    requestAnimationFrame(() => this._loop());
  }

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    for (const p of this.particles) {
      // Mouse repulsion
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.mouse.radius) {
        const force = (this.mouse.radius - dist) / this.mouse.radius;
        p.vx += (dx / dist) * force * 3;
        p.vy += (dy / dist) * force * 3;
      }

      // Spring back to target
      p.vx += (p.targetX - p.x) * 0.05;
      p.vy += (p.targetY - p.y) * 0.05;

      // Damping
      p.vx *= 0.85;
      p.vy *= 0.85;

      p.x += p.vx;
      p.y += p.vy;

      ctx.fillStyle = this.color;
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  destroy() {
    this.animating = false;
  }
}

// ============================================================
// 2. SMOOTH SERVICE ACCORDION with pretext height calc
// ============================================================
function initPretextAccordion() {
  const cards = document.querySelectorAll('.service-card');
  const bodyFont = '16px Inter';

  cards.forEach(card => {
    const desc = card.querySelector('.service-full-desc');
    if (!desc) return;
    const text = desc.textContent.trim();

    // Replace onclick with smooth pretext-measured transition
    card.removeAttribute('onclick');
    desc.style.display = 'block';
    desc.style.overflow = 'clip';
    desc.style.height = '0';
    desc.style.opacity = '0';
    desc.style.transition = 'height 0.35s cubic-bezier(0.25,0.8,0.25,1), opacity 0.3s ease';
    desc.style.marginTop = '0';
    desc.style.paddingTop = '0';

    let isOpen = false;

    card.addEventListener('click', () => {
      // Close all others
      cards.forEach(other => {
        if (other === card) return;
        const otherDesc = other.querySelector('.service-full-desc');
        if (otherDesc) {
          otherDesc.style.height = '0';
          otherDesc.style.opacity = '0';
          other._isOpen = false;
        }
      });

      if (isOpen) {
        desc.style.height = '0';
        desc.style.opacity = '0';
        isOpen = false;
      } else {
        // Use pretext to calculate target height
        try {
          const cardWidth = card.getBoundingClientRect().width - 60; // padding
          const prepared = prepare(text, bodyFont);
          const { height } = layout(prepared, cardWidth, 24);
          const targetH = Math.ceil(height) + 30; // + padding
          desc.style.height = targetH + 'px';
        } catch (e) {
          // Fallback: measure via scrollHeight
          desc.style.height = 'auto';
          const h = desc.scrollHeight;
          desc.style.height = '0';
          requestAnimationFrame(() => { desc.style.height = h + 'px'; });
        }
        desc.style.opacity = '1';
        isOpen = true;
      }
      card._isOpen = isOpen;
    });
  });
}

// ============================================================
// 3. ANIMATED FLOATING TEXT BACKGROUND (Canvas)
//    Floating engineering terms rendered via pretext
// ============================================================
class FloatingTextBg {
  constructor(canvas, words, colors) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.words = words;
    this.colors = colors;
    this.items = [];
    this.animating = true;

    this._resize();
    this._createItems();
    window.addEventListener('resize', () => { this._resize(); this._createItems(); });
    this._loop();
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
  }

  _createItems() {
    this.items = [];
    const count = Math.floor((this.w * this.h) / 40000);
    for (let i = 0; i < count; i++) {
      const word = this.words[Math.floor(Math.random() * this.words.length)];
      const size = rand(10, 18);
      const font = `${size}px "Bebas Neue", sans-serif`;
      // Use pretext to get natural width
      let textW = size * word.length * 0.6;
      try {
        const p = prepare(word, font);
        const m = layout(p, 9999, size);
        textW = size * word.length * 0.6; // approximate
      } catch (e) {}

      this.items.push({
        word, font, size,
        x: rand(0, this.w),
        y: rand(0, this.h),
        vx: rand(-0.3, 0.3),
        vy: rand(-0.2, 0.2),
        opacity: rand(0.04, 0.12),
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: rand(-0.15, 0.15),
      });
    }
  }

  _loop() {
    if (!this.animating) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    for (const item of this.items) {
      item.x += item.vx;
      item.y += item.vy;

      if (item.x < -100) item.x = this.w + 50;
      if (item.x > this.w + 100) item.x = -50;
      if (item.y < -50) item.y = this.h + 50;
      if (item.y > this.h + 100) item.y = -50;

      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);
      ctx.globalAlpha = item.opacity;
      ctx.fillStyle = item.color;
      ctx.font = item.font;
      ctx.fillText(item.word, 0, 0);
      ctx.restore();
    }
    requestAnimationFrame(() => this._loop());
  }

  destroy() { this.animating = false; }
}

// ============================================================
// 4. TEXT REVEAL ANIMATION using pretext line-by-line
// ============================================================
function initTextReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const text = el.textContent;
      const styles = getComputedStyle(el);
      const font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily.split(',')[0]}`;
      const lineHeight = parseFloat(styles.lineHeight) || parseFloat(styles.fontSize) * 1.5;

      try {
        const prepared = prepareWithSegments(text, font);
        const maxWidth = el.getBoundingClientRect().width;
        const { lines } = layoutWithLines(prepared, maxWidth, lineHeight);

        // Wrap each line in a span for staggered reveal
        el.innerHTML = '';
        lines.forEach((line, i) => {
          const span = document.createElement('span');
          span.textContent = line.text;
          span.style.cssText = `
            display: block;
            opacity: 0;
            transform: translateY(15px);
            transition: opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s;
          `;
          el.appendChild(span);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              span.style.opacity = '1';
              span.style.transform = 'translateY(0)';
            });
          });
        });
      } catch (e) {
        // Fallback: simple fade
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.6s ease';
        requestAnimationFrame(() => { el.style.opacity = '1'; });
      }
      observer.unobserve(el);
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.about-text p, .vision-card p').forEach(p => {
    observer.observe(p);
  });
}

// ============================================================
// 5. MAGNETIC CURSOR EFFECT on stat cards
// ============================================================
function initMagneticCards() {
  document.querySelectorAll('.stat-card, .hex-item, .vision-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const tiltX = (y / rect.height) * -8;
      const tiltY = (x / rect.width) * 8;
      card.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.03)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s ease';
      setTimeout(() => { card.style.transition = ''; }, 400);
    });
  });
}

// ============================================================
// 6. CURSOR GLOW TRAIL
// ============================================================
function initCursorGlow() {
  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  glow.style.cssText = `
    position: fixed; pointer-events: none; z-index: 9999;
    width: 300px; height: 300px; border-radius: 50%;
    background: radial-gradient(circle, rgba(92,154,50,0.08) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: opacity 0.3s;
    opacity: 0;
  `;
  document.body.appendChild(glow);

  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
    glow.style.opacity = '1';
  });
  document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
}

// ============================================================
// 7. SMOOTH SCROLL PROGRESS BAR
// ============================================================
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  bar.style.cssText = `
    position: fixed; top: 0; left: 0; height: 3px; z-index: 10001;
    background: linear-gradient(90deg, #5C9A32, #7BC950);
    width: 0%; transition: width 0.1s linear;
    box-shadow: 0 0 8px rgba(92,154,50,0.5);
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (scrolled / maxScroll * 100) + '%';
  });
}

// ============================================================
// 8. SECTION PARALLAX DEPTH
// ============================================================
function initParallax() {
  const sections = document.querySelectorAll('.vision-section, .industries-bg, .facility-bg');
  window.addEventListener('scroll', () => {
    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      const visible = rect.top < window.innerHeight && rect.bottom > 0;
      if (visible) {
        const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        const offset = (progress - 0.5) * 30;
        sec.style.backgroundPositionY = offset + 'px';
      }
    });
  }, { passive: true });
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for fonts to load
  await document.fonts.ready;

  // 1. Hero particle text canvas
  const hero = document.querySelector('.hero');
  if (hero) {
    const canvas = document.createElement('canvas');
    canvas.id = 'hero-particles';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:3;pointer-events:none;';
    hero.appendChild(canvas);
    new ParticleText(canvas, 'ROHAN ENGINEERING', 'bold 60px "Bebas Neue"', 'rgba(92,154,50,0.35)');
  }

  // 2. Floating text background for vision section
  const visionSec = document.querySelector('.vision-section');
  if (visionSec) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none;';
    visionSec.appendChild(canvas);
    new FloatingTextBg(canvas,
      ['PIPELINE', 'STEEL', 'WELD', 'FABRICATION', 'NDT', 'PRECISION', 'CUI', 'ASME', 'ASTM', 'ISO'],
      ['rgba(255,255,255,0.15)', 'rgba(92,154,50,0.12)', 'rgba(176,190,197,0.1)']
    );
  }

  // 3. Floating text for industries section
  const indSec = document.querySelector('.industries-bg');
  if (indSec) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    indSec.style.position = 'relative';
    indSec.appendChild(canvas);
    new FloatingTextBg(canvas,
      ['PHARMA', 'CHEMICAL', 'BIOTECH', 'OIL', 'GAS', 'INDUSTRIAL'],
      ['rgba(255,255,255,0.08)', 'rgba(92,154,50,0.06)']
    );
  }

  // 4. Pretext accordion for services
  initPretextAccordion();

  // 5. Line-by-line text reveal
  initTextReveal();

  // 6. Magnetic 3D tilt cards
  initMagneticCards();

  // 7. Cursor glow
  initCursorGlow();

  // 8. Scroll progress bar
  initScrollProgress();

  // 9. Parallax sections
  initParallax();
});
