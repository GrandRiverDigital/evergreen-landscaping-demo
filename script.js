/* =============================================
   EVERGREEN OUTDOOR LIVING — script.js
   Multi-page safe: all element access is guarded
   ============================================= */

'use strict';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const prefRed = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 1. SCROLL REVEAL ── */
if (!prefRed) {
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('up'); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  $$('.sr').forEach(el => revealIO.observe(el));
} else {
  $$('.sr').forEach(el => el.classList.add('up'));
}

/* ── 2. STICKY HEADER ── */
const hdr = $('#hdr');
if (hdr) {
  window.addEventListener('scroll', () => {
    hdr.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
}

/* ── 3. MOBILE NAV ── */
const hamburger = $('#hamburger');
const mobileNav = $('#mobile-nav');
let navOpen = false;

if (hamburger && mobileNav) {
  function openNav() {
    navOpen = true;
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    navOpen = false;
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  }
  hamburger.addEventListener('click', () => navOpen ? closeNav() : openNav());
  $$('.mobile-link').forEach(link => link.addEventListener('click', () => { if (navOpen) closeNav(); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && navOpen) closeNav(); });
}

/* ── 4. STAT COUNTERS (home + about pages) ── */
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function animateCounter(el, target, suffix, duration) {
  if (!el || prefRed) { if (el) el.innerHTML = target + '<span class="accent">' + suffix + '</span>'; return; }
  const start = performance.now();
  const isFloat = String(target).includes('.');
  function frame(now) {
    const p = Math.min((now - start) / duration, 1);
    const val = easeOut(p) * target;
    el.innerHTML = (isFloat ? val.toFixed(1) : Math.round(val)) + '<span class="accent">' + suffix + '</span>';
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const statsSection = $('#stats');
if (statsSection) {
  let countersDone = false;
  const statsIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !countersDone) {
        countersDone = true; statsIO.disconnect();
        animateCounter($('#sn-proj'), 850, '+', 1800);
        animateCounter($('#sn-yrs'), 15, '+', 1400);
      }
    });
  }, { threshold: 0.3 });
  statsIO.observe(statsSection);
}

/* ── 5. GALLERY LIGHTBOX (projects page only) ── */
const lightbox     = $('#lightbox');
const lbImg        = $('#lb-img');
const lbCaption    = $('#lb-caption');
const lbClose      = $('#lb-close');
const lbPrev       = $('#lb-prev');
const lbNext       = $('#lb-next');
const galleryItems = $$('.gallery-item[data-src]');

if (lightbox && lbImg && lbClose && lbPrev && lbNext && galleryItems.length) {
  let currentIndex = 0;

  function openLightbox(index) {
    const item = galleryItems[index]; if (!item) return;
    currentIndex = index;
    lbImg.src = item.dataset.src;
    lbImg.alt = (item.querySelector('img') || {}).alt || '';
    lbCaption.textContent = item.dataset.caption || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }
  function closeLightbox() {
    lightbox.classList.remove('open'); document.body.style.overflow = '';
    if (galleryItems[currentIndex]) galleryItems[currentIndex].focus();
  }
  function showImage(index) { openLightbox((index + galleryItems.length) % galleryItems.length); }

  galleryItems.forEach((item, i) => {
    item.setAttribute('tabindex', '0'); item.setAttribute('role', 'button');
    item.setAttribute('aria-label', item.dataset.caption || 'View project image');
    item.addEventListener('click', () => openLightbox(i));
    item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); } });
  });
  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => showImage(currentIndex - 1));
  lbNext.addEventListener('click', () => showImage(currentIndex + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
  });
  let lbTouchX = null;
  lightbox.addEventListener('touchstart', (e) => { lbTouchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (lbTouchX === null) return;
    const dx = e.changedTouches[0].clientX - lbTouchX;
    if (Math.abs(dx) > 50) showImage(currentIndex + (dx < 0 ? 1 : -1));
    lbTouchX = null;
  });
}

/* ── 6. TESTIMONIALS CAROUSEL (home page only) ── */
const track         = $('#carousel-track');
const dotsContainer = $('#carousel-dots');
const prevBtn       = $('#prev-btn');
const nextBtn       = $('#next-btn');

if (track && dotsContainer && prevBtn && nextBtn) {
  const cards = $$('.testimonial-card', track);
  if (cards.length) {
    let currentSlide = 0;
    let slidesPerView = getSlidesPerView();
    const totalSlides = Math.ceil(cards.length / slidesPerView);
    let autoInterval = null;

    function getSlidesPerView() {
      if (window.innerWidth >= 1080) return 3;
      if (window.innerWidth >= 600)  return 2;
      return 1;
    }
    function buildDots() {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === currentSlide ? ' active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Slide ${i + 1} of ${totalSlides}`);
        dot.setAttribute('aria-selected', i === currentSlide);
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      }
    }
    function updateDots() {
      $$('.carousel-dot', dotsContainer).forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
        dot.setAttribute('aria-selected', i === currentSlide);
      });
    }
    function goTo(index) {
      currentSlide = (index + totalSlides) % totalSlides;
      const cardWidth = cards[0].offsetWidth + 20;
      track.style.transform = `translateX(-${currentSlide * slidesPerView * cardWidth}px)`;
      updateDots();
    }
    function startAuto() { clearInterval(autoInterval); autoInterval = setInterval(() => goTo(currentSlide + 1), 5000); }
    function stopAuto()  { clearInterval(autoInterval); }

    prevBtn.addEventListener('click', () => { goTo(currentSlide - 1); stopAuto(); startAuto(); });
    nextBtn.addEventListener('click', () => { goTo(currentSlide + 1); stopAuto(); startAuto(); });

    let touchStartX = null;
    track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) { goTo(currentSlide + (dx < 0 ? 1 : -1)); stopAuto(); startAuto(); }
      touchStartX = null;
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { slidesPerView = getSlidesPerView(); goTo(0); buildDots(); }, 250);
    });

    buildDots();
    if (!prefRed) startAuto();
  }
}

/* ── 7. MOBILE STICKY BAR ── */
const mobBar = $('#mob-bar');
if (mobBar) {
  let shown = false;
  const show = () => { if (!shown) { shown = true; mobBar.classList.add('visible'); } };
  window.addEventListener('scroll', show, { passive: true, once: true });
  setTimeout(show, 600);
}

/* ── 8. CONTACT FORM (contact page only) ── */
const quoteForm = $('#quote-form');
const submitBtn = $('#form-submit-btn');
if (quoteForm && submitBtn) {
  quoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitBtn.replaceChildren(document.createTextNode('\u2705 Sent! We\u2019ll be in touch within 24 hours.'));
    submitBtn.style.background = '#10B981';
    submitBtn.style.boxShadow = '0 8px 24px rgba(16,185,129,.38)';
    submitBtn.style.pointerEvents = 'none';
  });
}
