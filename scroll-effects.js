// ============================================================
// OPPO-Inspired Scroll Effects Engine
// Premium scroll-driven animations: parallax, sticky reveals,
// progressive BG transitions, cinematic section entrances,
// and scale/fade transforms
// ============================================================

(function () {
  'use strict';

  // ---- UTILITIES ----
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const mapRange = (value, inMin, inMax, outMin, outMax) =>
    clamp(((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin, outMin, outMax);

  // Detect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============================================================
  // 1. HERO PARALLAX DEPTH — multi-layer parallax in the hero
  // ============================================================
  function initHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const content = hero.querySelector('.hero-content');
    const grid = hero.querySelector('.hero-grid');
    const scrollIndicator = hero.querySelector('.scroll-indicator');

    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroH = hero.offsetHeight;

        if (scrollY < heroH * 1.5) {
          const progress = scrollY / heroH;

          // Parallax: content moves slower, creating depth
          if (content) {
            content.style.transform = `translateY(${scrollY * 0.4}px)`;
            content.style.opacity = 1 - progress * 1.4;
          }

          // Scroll indicator fades quickly
          if (scrollIndicator) {
            scrollIndicator.style.opacity = 1 - progress * 4;
          }
        }
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ============================================================
  // 2. CINEMATIC SECTION ENTRANCES — fade + rise + blur
  // ============================================================
  function initCinematicEntrance() {
    // Target inner containers instead of sections themselves
    // This prevents conflicts with section backgrounds
    const targets = document.querySelectorAll(
      '.about-section .container,' +
      '.services-bg .container,' +
      '.strengths-bg .container,' +
      '.org-bg .container,' +
      '.facility-bg .container,' +
      '.clients-bg .container,' +
      '#contact .container'
    );

    targets.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(60px)';
      el.style.transition = 'opacity 1s ease, transform 1s cubic-bezier(0.16,1,0.3,1)';
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
    );

    targets.forEach(el => observer.observe(el));
  }

  // ============================================================
  // 3. STAT CARDS — staggered bloom power-up with glow
  // ============================================================
  function initStatPowerUp() {
    const statsContainer = document.querySelector('.about-stats');
    if (!statsContainer) return;

    const cards = statsContainer.querySelectorAll('.stat-card');
    if (cards.length === 0) return;

    // Set initial state via JS (not CSS!) to avoid permanent hidden state
    cards.forEach(card => {
      card.style.transform = 'scale(0.8) translateY(20px)';
      card.style.opacity = '0';
      card.style.filter = 'blur(6px)';
      card.style.transition = 'none';
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            cards.forEach((card, i) => {
              setTimeout(() => {
                card.style.transition = 'transform 0.9s cubic-bezier(0.16,1,0.3,1), opacity 0.7s ease, filter 0.7s ease, box-shadow 0.7s ease';
                card.style.transform = 'scale(1) translateY(0)';
                card.style.opacity = '1';
                card.style.filter = 'blur(0)';
                card.style.boxShadow = '0 0 40px rgba(92,154,50,0.2)';

                // Remove the glow after animation
                setTimeout(() => {
                  card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
                }, 900);
              }, i * 180);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(statsContainer);
  }

  // ============================================================
  // 4. PROGRESSIVE BG COLOR TRANSITIONS between sections
  // ============================================================
  function initBgTransitions() {
    // Add gradient overlays between light→dark section transitions
    const visionSection = document.querySelector('.vision-section');
    if (visionSection) {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: absolute; top: -80px; left: 0; right: 0; height: 80px;
        background: linear-gradient(to bottom, var(--color-bg-light), var(--color-bg-dark));
        pointer-events: none; z-index: 0;
      `;
      visionSection.style.position = 'relative';
      visionSection.insertBefore(overlay, visionSection.firstChild);
    }

    const industriesSection = document.querySelector('.industries-bg');
    if (industriesSection) {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: absolute; top: -80px; left: 0; right: 0; height: 80px;
        background: linear-gradient(to bottom, var(--color-bg-light), rgba(13, 27, 42, 1));
        pointer-events: none; z-index: 0;
      `;
      industriesSection.style.position = 'relative';
      industriesSection.insertBefore(overlay, industriesSection.firstChild);
    }
  }

  // ============================================================
  // 5. VISION CARDS — scroll-linked scale + opacity reveal
  // ============================================================
  function initVisionStickyReveal() {
    const section = document.querySelector('.vision-section');
    if (!section) return;

    const cards = section.querySelectorAll('.vision-card');
    if (cards.length === 0) return;

    // Remove any existing fade-up transitions
    cards.forEach(card => {
      card.classList.remove('fade-up');
      card.style.opacity = '0';
      card.style.transform = 'translateY(60px) scale(0.92)';
      card.style.transition = 'none';
    });

    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const sectionH = section.offsetHeight;
        const windowH = window.innerHeight;

        const progress = clamp((windowH - rect.top) / (sectionH + windowH * 0.5), 0, 1);

        cards.forEach((card, i) => {
          const cardStart = 0.15 + (i * 0.2);
          const cardEnd = cardStart + 0.35;
          const cardProgress = clamp(mapRange(progress, cardStart, cardEnd, 0, 1), 0, 1);

          // Smooth easeOutCubic
          const eased = 1 - Math.pow(1 - cardProgress, 3);

          card.style.transform = `translateY(${(1 - eased) * 60}px) scale(${0.92 + eased * 0.08})`;
          card.style.opacity = eased;
        });

        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ============================================================
  // 6. STRENGTH ITEMS — alternating slide-in from left/right
  // ============================================================
  function initStrengthScrollReveal() {
    const items = document.querySelectorAll('.strength-item');
    if (items.length === 0) return;

    items.forEach(item => {
      item.style.opacity = '0';
      item.style.transition = 'none';
      const dir = item.classList.contains('right') ? 100 : -100;
      item.style.transform = `translateX(${dir}px)`;
    });

    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const windowH = window.innerHeight;

        items.forEach(item => {
          const rect = item.getBoundingClientRect();
          const triggerPoint = windowH * 0.85;

          if (rect.top < triggerPoint) {
            const progress = clamp((triggerPoint - rect.top) / (windowH * 0.25), 0, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            const direction = item.classList.contains('right') ? 100 : -100;
            item.style.transform = `translateX(${direction * (1 - eased)}px)`;
            item.style.opacity = eased;
          }
        });

        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // Trigger immediately in case items are already visible
    onScroll();
  }

  // ============================================================
  // 7. HEX GRID — staggered bloom with blur + scale
  // ============================================================
  function initHexBloom() {
    const hexItems = document.querySelectorAll('.hex-item');
    if (hexItems.length === 0) return;

    hexItems.forEach(item => {
      item.style.transform = 'scale(0.5)';
      item.style.opacity = '0';
      item.style.filter = 'blur(10px)';
      item.style.transition = 'none';
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('.hex-item');
            items.forEach((item, i) => {
              setTimeout(() => {
                item.style.transition = 'transform 0.9s cubic-bezier(0.16,1,0.3,1), opacity 0.7s ease, filter 0.9s ease';
                item.style.transform = 'scale(1)';
                item.style.opacity = '1';
                item.style.filter = 'blur(0)';
              }, i * 150);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const hexGrid = document.querySelector('.hex-grid');
    if (hexGrid) observer.observe(hexGrid);
  }

  // ============================================================
  // 8. SECTION TITLE — word-by-word reveal from below
  // ============================================================
  function initTitleReveal() {
    const titles = document.querySelectorAll('.section-title');

    titles.forEach(title => {
      const text = title.textContent.trim();
      if (!text) return;

      const words = text.split(' ');
      title.innerHTML = '';

      words.forEach((word, wi) => {
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.overflow = 'hidden';
        wordSpan.style.verticalAlign = 'top';

        const innerSpan = document.createElement('span');
        innerSpan.textContent = word;
        innerSpan.className = 'title-word-inner';
        innerSpan.style.cssText = `
          display: inline-block;
          transform: translateY(110%);
          transition: transform 0.8s cubic-bezier(0.16,1,0.3,1);
          transition-delay: ${wi * 0.1}s;
        `;

        wordSpan.appendChild(innerSpan);
        title.appendChild(wordSpan);

        if (wi < words.length - 1) {
          title.appendChild(document.createTextNode('\u00A0'));
        }
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.title-word-inner').forEach(w => {
              w.style.transform = 'translateY(0)';
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    titles.forEach(t => observer.observe(t));
  }

  // ============================================================
  // 9. NAVBAR MORPH — progressive blur & border glow on scroll
  // ============================================================
  function initNavbarMorph() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const progress = clamp(scrollY / 200, 0, 1);

        const blur = lerp(10, 22, progress);
        const bgOpacity = lerp(0.95, 0.99, progress);
        navbar.style.backdropFilter = `blur(${blur}px)`;
        navbar.style.background = `rgba(10, 22, 40, ${bgOpacity})`;

        const borderOpacity = lerp(0.05, 0.2, progress);
        navbar.style.borderBottomColor = `rgba(92, 154, 50, ${borderOpacity})`;

        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ============================================================
  // 10. FACILITY CARDS — 3D perspective flip reveal
  // ============================================================
  function initFacilityReveal() {
    const facilityCards = document.querySelectorAll('.facility-card');
    if (facilityCards.length === 0) return;

    facilityCards.forEach(card => {
      card.style.transform = 'perspective(1000px) rotateY(12deg) translateX(-30px)';
      card.style.opacity = '0';
      card.style.transition = 'none';
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll('.facility-card');
            cards.forEach((card, i) => {
              setTimeout(() => {
                card.style.transition = 'transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.8s ease';
                card.style.transform = 'perspective(1000px) rotateY(0deg) translateX(0)';
                card.style.opacity = '1';
              }, i * 250);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const facilitySection = document.getElementById('facility');
    if (facilitySection) observer.observe(facilitySection);
  }

  // ============================================================
  // 11. ORG CHART CASCADE — nodes drop in like a waterfall
  // ============================================================
  function initOrgCascade() {
    const orgNodes = document.querySelectorAll('.org-node');
    const orgRoles = document.querySelectorAll('.org-role');

    const allElements = [...orgNodes, ...orgRoles];
    allElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-25px) scale(0.9)';
      el.style.transition = 'none';
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            allElements.forEach((el, i) => {
              setTimeout(() => {
                el.style.transition = 'transform 0.7s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0) scale(1)';
              }, i * 100);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const orgSection = document.getElementById('org');
    if (orgSection) observer.observe(orgSection);
  }

  // ============================================================
  // 12. TESTIMONIAL CARD — cinematic fade + shimmer
  // ============================================================
  function initTestimonialReveal() {
    const card = document.querySelector('.testimonial-card');
    if (!card) return;

    card.style.opacity = '0';
    card.style.transform = 'translateY(40px) scale(0.95)';
    card.style.transition = 'none';

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.transition = 'transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.8s ease';
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0) scale(1)';

            const quoteIcon = entry.target.querySelector('.quote-icon');
            if (quoteIcon) {
              quoteIcon.style.animation = 'quoteShimmer 2s ease-in-out';
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(card);
  }

  // ============================================================
  // 13. CONTACT FORM — reveal from below with subtle rotation
  // ============================================================
  function initContactReveal() {
    const contactGrid = document.querySelector('.contact-grid');
    if (!contactGrid) return;

    const form = contactGrid.querySelector('.contact-form');
    const details = contactGrid.querySelector('.contact-details');

    [form, details].filter(Boolean).forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = `translateY(50px) rotate(${i === 0 ? -1 : 1}deg)`;
      el.style.transition = 'none';
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            [form, details].filter(Boolean).forEach((el, i) => {
              setTimeout(() => {
                el.style.transition = 'transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.7s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0) rotate(0deg)';
              }, i * 250);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(contactGrid);
  }

  // ============================================================
  // 14. SERVICE CARDS — staggered scale-in from below
  // ============================================================
  function initServiceCardsReveal() {
    const cards = document.querySelectorAll('.service-card');
    if (cards.length === 0) return;

    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(40px) scale(0.95)';
      card.style.transition = 'none';
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Find this card's index among all service cards
            const allCards = [...document.querySelectorAll('.service-card')];
            const idx = allCards.indexOf(entry.target);
            const delay = Math.min(idx, 8) * 100; // Cap delay

            setTimeout(() => {
              entry.target.style.transition = 'transform 0.8s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease';
              entry.target.style.transform = 'translateY(0) scale(1)';
              entry.target.style.opacity = '1';
            }, delay);

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );

    cards.forEach(c => observer.observe(c));
  }

  // ============================================================
  // 15. CHAPTER DOTS — section indicator on the right side
  // ============================================================
  function initChapterDots() {
    const sectionIds = ['hero', 'about', 'services', 'industries', 'strengths', 'facility', 'clients', 'contact'];
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
    if (sections.length === 0) return;

    const dotsContainer = document.createElement('nav');
    dotsContainer.className = 'chapter-dots';
    dotsContainer.setAttribute('aria-label', 'Section navigation');
    dotsContainer.innerHTML = sections.map((sec, i) => {
      const label = sectionIds[i].charAt(0).toUpperCase() + sectionIds[i].slice(1);
      return `<a href="#${sectionIds[i]}" class="chapter-dot" data-index="${i}" aria-label="${label}">
        <span class="dot-pip"></span>
        <span class="dot-label">${label}</span>
      </a>`;
    }).join('');

    document.body.appendChild(dotsContainer);

    let ticking = false;

    function updateDots() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const scrollY = window.scrollY + window.innerHeight / 3;
        let activeIndex = 0;

        sections.forEach((sec, i) => {
          if (scrollY >= sec.offsetTop) {
            activeIndex = i;
          }
        });

        dotsContainer.querySelectorAll('.chapter-dot').forEach((dot, i) => {
          dot.classList.toggle('active', i === activeIndex);
        });

        // Show/hide dots
        dotsContainer.classList.toggle('visible', window.scrollY > 300);

        ticking = false;
      });
    }

    window.addEventListener('scroll', updateDots, { passive: true });
    updateDots();

    // Smooth scroll on dot click
    dotsContainer.querySelectorAll('.chapter-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(dot.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // ============================================================
  // 16. SCROLL PROGRESS BAR — green gradient at top of page
  // ============================================================
  function initScrollProgressBar() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress-bar';
    bar.style.cssText = `
      position: fixed; top: 0; left: 0; height: 3px; z-index: 10001;
      background: linear-gradient(90deg, #5C9A32, #7BC950);
      width: 0%; transition: width 0.15s linear;
      box-shadow: 0 0 10px rgba(92,154,50,0.5);
    `;
    document.body.appendChild(bar);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (scrolled / maxScroll * 100) + '%';
        ticking = false;
      });
    }, { passive: true });
  }

  // ============================================================
  // INJECT CSS for scroll effects
  // ============================================================
  function injectScrollCSS() {
    const style = document.createElement('style');
    style.id = 'oppo-scroll-styles';
    style.textContent = `
      /* ---- Chapter Dots Navigation ---- */
      .chapter-dots {
        position: fixed;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 999;
        display: flex;
        flex-direction: column;
        gap: 16px;
        opacity: 0;
        transition: opacity 0.4s ease;
      }
      .chapter-dots.visible {
        opacity: 1;
      }
      .chapter-dot {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        flex-direction: row-reverse;
        cursor: pointer;
      }
      .dot-pip {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(176, 190, 197, 0.4);
        border: 2px solid transparent;
        transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
        flex-shrink: 0;
      }
      .chapter-dot.active .dot-pip {
        background: #5C9A32;
        border-color: rgba(92,154,50,0.4);
        transform: scale(1.4);
        box-shadow: 0 0 14px rgba(92,154,50,0.5);
      }
      .dot-label {
        font-family: 'Inter', sans-serif;
        font-size: 0.7rem;
        font-weight: 500;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: rgba(176, 190, 197, 0.6);
        opacity: 0;
        transform: translateX(8px);
        transition: opacity 0.3s, transform 0.3s, color 0.3s;
        white-space: nowrap;
        pointer-events: none;
      }
      .chapter-dot:hover .dot-label,
      .chapter-dot.active .dot-label {
        opacity: 1;
        transform: translateX(0);
      }
      .chapter-dot.active .dot-label {
        color: #5C9A32;
      }

      /* Hide on mobile */
      @media (max-width: 991px) {
        .chapter-dots { display: none; }
      }

      /* ---- Quote Shimmer ---- */
      @keyframes quoteShimmer {
        0% { filter: brightness(1); }
        30% { filter: brightness(2.5) drop-shadow(0 0 20px rgba(92,154,50,0.7)); }
        100% { filter: brightness(1); }
      }

      /* ---- Hero GPU performance ---- */
      .hero-content {
        will-change: transform, opacity;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function init() {
    if (prefersReducedMotion) return;

    injectScrollCSS();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
      bootstrap();
    }
  }

  function bootstrap() {
    // Wait a tick for the existing page scripts to run first
    setTimeout(() => {
      initHeroParallax();
      initCinematicEntrance();
      initStatPowerUp();
      initBgTransitions();
      initVisionStickyReveal();
      initStrengthScrollReveal();
      initHexBloom();
      initTitleReveal();
      initNavbarMorph();
      initFacilityReveal();
      initOrgCascade();
      initTestimonialReveal();
      initContactReveal();
      initServiceCardsReveal();
      initChapterDots();
      initScrollProgressBar();
    }, 100);
  }

  init();
})();
