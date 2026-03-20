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

  /* ── Canvas: High-DPI & Elite Scaling ── */
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    // CSS pixels (layout)
    canvas.style.width  = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    // Physical pixels (drawing surface)
    canvas.width  = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    // Scale context to match
    ctx.scale(dpr, dpr);
    
    // Smooth rendering for mobile
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    drawFrame(Math.round(currentFrame));
  }

  function drawFrame(idx) {
    const W = window.innerWidth;
    const H = window.innerHeight;

    ctx.clearRect(0, 0, W, H);

    const img = images[idx];
    if (!img || !img.complete || !img.naturalWidth) return;

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    // 1. CINEMATIC BACKGROUND GLOW
    // We draw a blurred, scaled-up version of the image for that 'Apple' feel.
    ctx.save();
    ctx.filter = 'blur(60px)';
    const bgScale = Math.max(W / imgW, H / imgH) * 1.3;
    const bgW = imgW * bgScale;
    const bgH = imgH * bgScale;
    ctx.globalAlpha = 0.45; // Subtle background presence
    ctx.drawImage(img, (W - bgW) / 2, (H - bgH) / 2, bgW, bgH);
    ctx.restore();

    // 2. MAIN SPHERE SCALING
    // We use the 95% scale requested+verified previously
    const mainScale = Math.max(W / imgW, H / imgH) * 0.95;
    const dw = imgW * mainScale;
    const dh = imgH * mainScale;
    
    // Subtle float animation based on current index
    const floatY = Math.sin(Date.now() / 1500) * 12;
    
    const dx = (W - dw) / 2;
    const dy = (H - dh) / 2 + floatY;

    // Draw main high-quality frame
    ctx.drawImage(img, dx, dy, dw, dh);

    // 3. OVERLAYS FOR CINEMATIC DEPTH
    // Subtle white-hot center glow
    const grd = ctx.createRadialGradient(W / 2, H / 2 + floatY, 0, W / 2, H / 2 + floatY, W * 0.45);
    grd.addColorStop(0, 'rgba(255,107,0,0.08)');
    grd.addColorStop(1, 'rgba(11,15,25,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Vignette to hide background edges
    const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.9);
    vig.addColorStop(0, 'rgba(11,15,25,0.1)');
    vig.addColorStop(1, 'rgba(11,15,25,0.85)');
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
