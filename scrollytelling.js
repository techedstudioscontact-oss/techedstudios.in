/* scrollytelling.js — Teched Studios 243-frame Canvas Engine */
(function () {
  'use strict';

  const TOTAL_FRAMES = 243;
  const PAD          = 3;
  const FRAME_DIR    = 'Frames/';
  const FRAME_PREFIX = 'ezgif-frame-';
  const FRAME_EXT    = '.jpg';

  // Narrative beat ranges [startProgress, endProgress]
  const BEATS = [
    [0,     0.18],  // 0: Hero
    [0.18,  0.38],  // 1: Engineering
    [0.38,  0.58],  // 2: Connectivity
    [0.58,  0.78],  // 3: Intelligence
    [0.78,  1.0 ],  // 4: CTA
  ];

  /* ── DOM refs ── */
  const section  = document.getElementById('scrolly-section');
  const canvas   = document.getElementById('scrolly-canvas');
  const ctx      = canvas.getContext('2d');
  const beatEls  = document.querySelectorAll('.s-beat');
  const dots     = document.querySelectorAll('.s-dot');
  const dotsWrap = document.getElementById('s-dots');

  /* ── State ── */
  const images     = new Array(TOTAL_FRAMES).fill(null);
  let currentFrame = 0;
  let targetFrame  = 0;

  /* ── Helpers ── */
  function pad(n, len) { return String(n).padStart(len, '0'); }
  function framePath(i) {
    return FRAME_DIR + FRAME_PREFIX + pad(i + 1, PAD) + FRAME_EXT;
  }

  function getScrollProgress() {
    const rect = section.getBoundingClientRect();
    const totalScroll = section.offsetHeight - window.innerHeight;
    return Math.max(0, Math.min(1, -rect.top / totalScroll));
  }

  function frameFromProgress(p) {
    return Math.min(TOTAL_FRAMES - 1, Math.floor(p * (TOTAL_FRAMES - 1)));
  }

  /* ── Canvas: COVER mode (fill viewport, no black bars) ── */
  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    drawFrame(Math.round(currentFrame));
  }

  function drawFrame(idx) {
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Brand dark background
    ctx.fillStyle = '#0B0F19';
    ctx.fillRect(0, 0, W, H);

    const img = images[idx];
    if (!img || !img.complete || !img.naturalWidth) return;

    // COVER: scale to fill entire canvas
    const imgW   = img.naturalWidth;
    const imgH   = img.naturalHeight;
    const scale  = Math.max(W / imgW, H / imgH);
    const dw     = imgW * scale;
    const dh     = imgH * scale;
    const dx     = (W - dw) / 2;
    const dy     = (H - dh) / 2;

    ctx.drawImage(img, dx, dy, dw, dh);

    // Subtle orange center glow over image
    const grd = ctx.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, W * 0.42);
    grd.addColorStop(0, 'rgba(255,107,0,0.06)');
    grd.addColorStop(1, 'rgba(11,15,25,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Edge vignette for cinematic depth
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
    vig.addColorStop(0, 'rgba(11,15,25,0)');
    vig.addColorStop(1, 'rgba(11,15,25,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── Animation loop ── */
  function loop() {
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.3) {
      currentFrame += diff * 0.10;
      drawFrame(Math.round(currentFrame));
    }
    requestAnimationFrame(loop);
  }

  /* ── Beats update ── */
  function updateBeats(p) {
    let active = BEATS.length - 1;
    for (let i = 0; i < BEATS.length; i++) {
      if (p >= BEATS[i][0] && p < BEATS[i][1]) { active = i; break; }
    }
    beatEls.forEach((el, i) => el.classList.toggle('active', i === active));
    dots.forEach((d, i) => d.classList.toggle('active', i === active));
  }

  /* ── Nav state ── */
  function updateNav() {
    const sectionBottom = section.offsetTop + section.offsetHeight;
    const inScrolly = window.scrollY < sectionBottom;
    document.body.classList.toggle('in-scrolly', inScrolly);
    dotsWrap.classList.toggle('visible', inScrolly);
  }

  /* ── Scroll handler ── */
  window.addEventListener('scroll', function () {
    const p = getScrollProgress();
    targetFrame = frameFromProgress(p);
    updateBeats(p);
    updateNav();
  }, { passive: true });

  window.addEventListener('resize', resizeCanvas, { passive: true });

  /* ── Preloader: priority first 30 frames, then background load ── */
  function loadImage(i) {
    if (images[i]) return;
    const img = new Image();
    images[i] = img;
    img.onload = function () {
      if (i === 0) drawFrame(0);
      // Redraw if this is the current target frame
      if (i === Math.round(currentFrame)) drawFrame(i);
    };
    img.src = framePath(i);
  }

  function initLoad() {
    // First 30 frames — immediate
    for (let i = 0; i < Math.min(30, TOTAL_FRAMES); i++) loadImage(i);

    // Background load in chunks
    let next = 30;
    function loadChunk() {
      const end = Math.min(next + 15, TOTAL_FRAMES);
      for (let i = next; i < end; i++) loadImage(i);
      next = end;
      if (next < TOTAL_FRAMES) setTimeout(loadChunk, 100);
    }
    setTimeout(loadChunk, 200);
  }

  /* ── Init ── */
  function init() {
    resizeCanvas();
    updateNav();
    initLoad();
    loop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
