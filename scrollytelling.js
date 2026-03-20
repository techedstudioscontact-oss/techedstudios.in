/* scrollytelling.js — Teched Studios 243-frame Canvas Engine (FIXED: FULL SPHERE VISIBLE) */
(function () {
  'use strict';

  const TOTAL_FRAMES = 243;
  const PAD = 3;
  const FRAME_DIR = 'Frames/';
  const FRAME_PREFIX = 'ezgif-frame-';
  const FRAME_EXT = '.jpg';

  const BEATS = [
    [0, 0.18],
    [0.18, 0.38],
    [0.38, 0.58],
    [0.58, 0.78],
    [0.78, 1.0],
  ];

  const section = document.getElementById('scrolly-section');
  const canvas = document.getElementById('scrolly-canvas');
  const ctx = canvas.getContext('2d');
  const beatEls = document.querySelectorAll('.s-beat');
  const dots = document.querySelectorAll('.s-dot');
  const dotsWrap = document.getElementById('s-dots');

  const images = new Array(TOTAL_FRAMES).fill(null);
  let currentFrame = 0;
  let targetFrame = 0;

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

  /* ── Canvas Setup ── */
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    drawFrame(Math.round(currentFrame));
  }

  /* ── MAIN DRAW FUNCTION ── */
  function drawFrame(idx) {
    const W = window.innerWidth;
    const H = window.innerHeight;

    ctx.clearRect(0, 0, W, H);

    const img = images[idx];
    if (!img || !img.complete || !img.naturalWidth) return;

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    /* ── 1. BACKGROUND BLUR (COVER) ── */
    ctx.save();
    ctx.filter = 'blur(60px)';
    ctx.globalAlpha = 0.45;

    const bgScale = Math.max(W / imgW, H / imgH) * 1.3;
    const bgW = imgW * bgScale;
    const bgH = imgH * bgScale;

    ctx.drawImage(img, (W - bgW) / 2, (H - bgH) / 2, bgW, bgH);
    ctx.restore();

    /* ── 2. MAIN IMAGE (HEROIC → NO GAPS) ── */
    // We use Math.max to fill the width, with 0.94 scale for the perfect visibility balance.
    const mainScale = Math.max(W / imgW, H / imgH) * 0.94; 

    const dw = imgW * mainScale;
    const dh = imgH * mainScale;

    const floatY = Math.sin(Date.now() / 1500) * 10;

    const dx = (W - dw) / 2;
    const dy = (H - dh) / 2 + floatY - H * 0.04; // 👈 slight hero shift

    ctx.drawImage(img, dx, dy, dw, dh);

    /* ── 3. GLOW EFFECT ── */
    const grd = ctx.createRadialGradient(
      W / 2,
      H / 2 + floatY,
      0,
      W / 2,
      H / 2 + floatY,
      W * 0.45
    );

    grd.addColorStop(0, 'rgba(255,120,0,0.08)');
    grd.addColorStop(1, 'rgba(11,15,25,0)');

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    /* ── 4. VIGNETTE ── */
    const vig = ctx.createRadialGradient(
      W / 2,
      H / 2,
      Math.min(W, H) * 0.2,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.9
    );

    vig.addColorStop(0, 'rgba(11,15,25,0.1)');
    vig.addColorStop(1, 'rgba(11,15,25,0.85)');

    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── Smooth Animation ── */
  function loop() {
    const diff = targetFrame - currentFrame;

    if (Math.abs(diff) > 0.2) {
      currentFrame += diff * 0.08;
      drawFrame(Math.round(currentFrame));
    }

    requestAnimationFrame(loop);
  }

  function updateBeats(p) {
    let active = BEATS.length - 1;

    for (let i = 0; i < BEATS.length; i++) {
      if (p >= BEATS[i][0] && p < BEATS[i][1]) {
        active = i;
        break;
      }
    }

    beatEls.forEach((el, i) =>
      el.classList.toggle('active', i === active)
    );

    dots.forEach((d, i) =>
      d.classList.toggle('active', i === active)
    );
  }

  function updateNav() {
    const sectionBottom = section.offsetTop + section.offsetHeight;
    const inScrolly = window.scrollY < sectionBottom;

    document.body.classList.toggle('in-scrolly', inScrolly);
    dotsWrap.classList.toggle('visible', inScrolly);
  }

  window.addEventListener('scroll', function () {
    const p = getScrollProgress();
    targetFrame = frameFromProgress(p);
    updateBeats(p);
    updateNav();
  }, { passive: true });

  window.addEventListener('resize', resizeCanvas, { passive: true });

  /* ── Image Loader ── */
  function loadImage(i) {
    if (images[i]) return;

    const img = new Image();
    images[i] = img;

    img.onload = function () {
      if (i === 0) drawFrame(0);
      if (i === Math.round(currentFrame)) drawFrame(i);
    };

    img.src = framePath(i);
  }

  function initLoad() {
    for (let i = 0; i < Math.min(30, TOTAL_FRAMES); i++) {
      loadImage(i);
    }

    let next = 30;

    function loadChunk() {
      const end = Math.min(next + 15, TOTAL_FRAMES);

      for (let i = next; i < end; i++) {
        loadImage(i);
      }

      next = end;

      if (next < TOTAL_FRAMES) {
        setTimeout(loadChunk, 100);
      }
    }

    setTimeout(loadChunk, 200);
  }

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

})();