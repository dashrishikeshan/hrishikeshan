/* =========================================================
   Hrishikeshan Das — CV Site · Enhanced Background Engine
   ========================================================= */

"use strict";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Utility ─────────────────────────────────────────── */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

/* ── Page Loader ─────────────────────────────────────── */
document.body.classList.add("is-loading");

function setupPageLoader() {
  const finishLoading = () => {
    window.setTimeout(() => {
      document.body.classList.remove("is-loading");
      document.body.classList.add("is-loaded");
    }, prefersReducedMotion ? 0 : 450);
  };

  if (document.readyState === "complete") {
    finishLoading();
  } else {
    window.addEventListener("load", finishLoading, { once: true });
  }
}

/* ── Aurora Background Canvas ────────────────────────── */
const auroraCanvas = document.querySelector("#auroraCanvas");
const auroraCtx = auroraCanvas ? auroraCanvas.getContext("2d") : null;

let auroraW = 0, auroraH = 0;
let auroraTime = 0;

// Aurora blob nodes — lazily drifting color masses
const auroraBlobs = [
  { x: 0.18, y: 0.22, r: 0.52, hue: 185, sat: 88, lit: 54, speed: 0.00014, phase: 0 },
  { x: 0.82, y: 0.18, r: 0.44, hue: 295, sat: 80, lit: 52, speed: 0.00011, phase: 1.8 },
  { x: 0.55, y: 0.72, r: 0.48, hue: 145, sat: 78, lit: 50, speed: 0.00009, phase: 3.4 },
  { x: 0.28, y: 0.65, r: 0.38, hue: 220, sat: 82, lit: 56, speed: 0.00016, phase: 0.9 },
  { x: 0.72, y: 0.55, r: 0.40, hue: 320, sat: 75, lit: 50, speed: 0.00013, phase: 2.6 },
];

function resizeAurora() {
  if (!auroraCanvas) return;
  // Use a low pixel ratio for the aurora since it's just big blurry blobs
  const ratio = 0.5;
  auroraW = window.innerWidth;
  auroraH = window.innerHeight;
  auroraCanvas.width = Math.floor(auroraW * ratio);
  auroraCanvas.height = Math.floor(auroraH * ratio);
  auroraCanvas.style.width = `${auroraW}px`;
  auroraCanvas.style.height = `${auroraH}px`;
  auroraCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawAurora(ts) {
  if (!auroraCtx || prefersReducedMotion) return;
  auroraTime = ts * 0.001;

  auroraCtx.clearRect(0, 0, auroraW, auroraH);

  for (const blob of auroraBlobs) {
    const drift = auroraTime * blob.speed * 1000;
    const cx = (blob.x + Math.sin(drift + blob.phase) * 0.14) * auroraW;
    const cy = (blob.y + Math.cos(drift * 0.72 + blob.phase) * 0.10) * auroraH;
    const rx = blob.r * Math.max(auroraW, auroraH);
    const hue = blob.hue + Math.sin(drift * 0.5 + blob.phase) * 18;
    const alpha = 0.055 + Math.sin(drift * 0.38 + blob.phase) * 0.018;

    const grad = auroraCtx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    grad.addColorStop(0, `hsla(${hue}, ${blob.sat}%, ${blob.lit}%, ${alpha * 2.4})`);
    grad.addColorStop(0.42, `hsla(${hue + 14}, ${blob.sat - 8}%, ${blob.lit - 6}%, ${alpha})`);
    grad.addColorStop(1, `hsla(${hue + 28}, ${blob.sat - 20}%, ${blob.lit - 12}%, 0)`);

    auroraCtx.fillStyle = grad;
    auroraCtx.beginPath();
    auroraCtx.ellipse(cx, cy, rx, rx * 0.68, Math.sin(drift * 0.22 + blob.phase) * 0.6, 0, Math.PI * 2);
    auroraCtx.fill();
  }
}

/* ── Particle Network Canvas ─────────────────────────── */
const netCanvas = document.querySelector("#signalCanvas");
const netCtx = netCanvas ? netCanvas.getContext("2d") : null;

let netW = 0, netH = 0;
let netPoints = [];
let mouse = { x: -9999, y: -9999 };

// Palette cycling colours for connections
const NET_PALETTE = [
  [72, 244, 255],   // cyan
  [156, 255, 106],  // green
  [255, 79, 216],   // magenta
  [120, 160, 255],  // blue-ish
];

function resizeNet() {
  if (!netCanvas) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  netW = window.innerWidth;
  netH = window.innerHeight;
  netCanvas.width = Math.floor(netW * ratio);
  netCanvas.height = Math.floor(netH * ratio);
  netCanvas.style.width = `${netW}px`;
  netCanvas.style.height = `${netH}px`;
  netCtx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.min(90, Math.floor(netW / 14));
  netPoints = Array.from({ length: count }, (_, i) => ({
    x: rand(0, netW),
    y: rand(0, netH),
    vx: rand(-0.28, 0.28),
    vy: rand(-0.28, 0.28),
    r: rand(1.0, 2.2),
    palIdx: i % NET_PALETTE.length,
    alpha: rand(0.35, 0.72),
    pulse: rand(0, Math.PI * 2),
    pulseSpeed: rand(0.008, 0.022),
  }));
}

function drawNet(ts) {
  if (!netCtx) return;

  netCtx.clearRect(0, 0, netW, netH);

  const t = ts * 0.001;
  const LINK_DIST = 160;
  const MOUSE_DIST = 220;

  for (const p of netPoints) {
    p.x += p.vx;
    p.y += p.vy;
    p.pulse += p.pulseSpeed;

    // Mouse repulsion
    const mdx = p.x - mouse.x;
    const mdy = p.y - mouse.y;
    const md = Math.hypot(mdx, mdy);
    if (md < MOUSE_DIST && md > 0) {
      const force = (1 - md / MOUSE_DIST) * 0.32;
      p.vx += (mdx / md) * force;
      p.vy += (mdy / md) * force;
    }

    // Dampen velocity
    p.vx *= 0.994;
    p.vy *= 0.994;

    // Wrap
    if (p.x < -20) p.x = netW + 20;
    if (p.x > netW + 20) p.x = -20;
    if (p.y < -20) p.y = netH + 20;
    if (p.y > netH + 20) p.y = -20;
  }

  // Draw connections (optimized: single stroke style, no gradient)
  for (let i = 0; i < netPoints.length; i++) {
    const a = netPoints[i];
    for (let j = i + 1; j < netPoints.length; j++) {
      const b = netPoints[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);

      if (dist < LINK_DIST) {
        const frac = 1 - dist / LINK_DIST;
        netCtx.strokeStyle = `rgba(128, 240, 255, ${frac * 0.15})`;
        netCtx.lineWidth = frac * 1.2;
        netCtx.beginPath();
        netCtx.moveTo(a.x, a.y);
        netCtx.lineTo(b.x, b.y);
        netCtx.stroke();
      }
    }
  }

  // Draw nodes (optimized: simple solid circles)
  for (const p of netPoints) {
    const col = NET_PALETTE[p.palIdx];
    const pulseAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
    const glowR = p.r * (1 + 0.5 * Math.abs(Math.sin(p.pulse)));

    netCtx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${pulseAlpha * 0.4})`;
    netCtx.beginPath();
    netCtx.arc(p.x, p.y, glowR * 3, 0, Math.PI * 2);
    netCtx.fill();

    netCtx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${pulseAlpha})`;
    netCtx.beginPath();
    netCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    netCtx.fill();
  }
}

/* ── Scanline Pulse ──────────────────────────────────── */
const scanCanvas = document.querySelector("#scanCanvas");
const scanCtx = scanCanvas ? scanCanvas.getContext("2d") : null;
let scanW = 0, scanH = 0;

function resizeScan() {
  if (!scanCanvas) return;
  const ratio = 0.5; // low resolution is fine for simple scan lines
  scanW = window.innerWidth;
  scanH = window.innerHeight;
  scanCanvas.width = Math.floor(scanW * ratio);
  scanCanvas.height = Math.floor(scanH * ratio);
  scanCanvas.style.width = `${scanW}px`;
  scanCanvas.style.height = `${scanH}px`;
  scanCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

let scanY = -60;
let scanSpeed = 0.7;
let scanDir = 1;
function drawScan(ts) {
  if (!scanCtx || prefersReducedMotion) return;

  scanCtx.clearRect(0, 0, scanW, scanH);

  // Scanline gradient
  const grad = scanCtx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
  grad.addColorStop(0, "rgba(72,244,255,0)");
  grad.addColorStop(0.5, "rgba(72,244,255,0.045)");
  grad.addColorStop(1, "rgba(72,244,255,0)");

  scanCtx.fillStyle = grad;
  scanCtx.fillRect(0, scanY - 60, scanW, 120);

  scanY += scanSpeed * scanDir;
  if (scanY > scanH + 60) { scanY = -60; }
}

/* ── Unified RAF Loop ────────────────────────────────── */
function rafLoop(ts) {
  drawAurora(ts);
  drawScan(ts);
  drawNet(ts);
  if (!prefersReducedMotion) requestAnimationFrame(rafLoop);
}

/* ── Counter Animation ───────────────────────────────── */
function animateCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        const target = Number(element.dataset.count);
        const start = performance.now();
        const duration = 1100;

        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          element.textContent = Math.round(target * eased);
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        observer.unobserve(element);
      });
    },
    { threshold: 0.45 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

/* ── Ticker Loop ─────────────────────────────────────── */
function setupTickerLoop() {
  const track = document.querySelector(".ticker-track");
  if (!track || track.dataset.looped) return;

  track.innerHTML += track.innerHTML;
  track.dataset.looped = "true";
}

/* ── Scroll Reveal ───────────────────────────────────── */
function setupScrollReveal() {
  const revealTargets = document.querySelectorAll(
    ".ticker-section, .split-section, .section-heading, .capability-card, .timeline-card, .process-grid article, .featured-project, .portfolio-list a, .credentials-section > div, .site-footer"
  );

  revealTargets.forEach((target, index) => {
    const groupIndex = Array.from(target.parentElement?.children || []).indexOf(target);
    const stagger = Math.max(groupIndex, 0) % 6;
    target.classList.add("reveal");
    target.style.setProperty("--reveal-delay", `${Math.min(stagger * 75 + (index % 2) * 20, 380)}ms`);
  });

  if (prefersReducedMotion) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  revealTargets.forEach((target) => observer.observe(target));
}

/* ── Cursor Glow ─────────────────────────────────────── */
function setupCursorGlow() {
  if (prefersReducedMotion) return;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  window.addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });

  // Smooth cursor glow
  function moveCursor() {
    currentX = lerp(currentX, targetX, 0.09);
    currentY = lerp(currentY, targetY, 0.09);
    document.documentElement.style.setProperty("--cursor-x", `${currentX}px`);
    document.documentElement.style.setProperty("--cursor-y", `${currentY}px`);
    requestAnimationFrame(moveCursor);
  }
  moveCursor();
}

/* ── Tilt Cards ──────────────────────────────────────── */
function setupTiltCards() {
  if (prefersReducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const cards = document.querySelectorAll(
    ".capability-card, .process-grid article, .featured-project, .portfolio-list a, .metrics-grid div"
  );

  cards.forEach((card) => {
    card.classList.add("tilt-card");

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      card.style.setProperty("--tilt-x", `${y * -7}deg`);
      card.style.setProperty("--tilt-y", `${x * 7}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

/* ── Active Nav Highlight ────────────────────────────── */
function setActiveNav() {
  const sections = ["profile", "experience", "erp", "projects", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const links = new Map(
    Array.from(document.querySelectorAll('.nav-links a[href^="#"]')).map((link) => [
      link.getAttribute("href").replace("#", ""),
      link,
    ])
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.remove("active"));
        const active = links.get(entry.target.id);
        if (active) active.classList.add("active");
      });
    },
    { rootMargin: "-40% 0px -50% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ── Back to Top ─────────────────────────────────────── */
function setupBackToTop() {
  const button = document.querySelector(".back-to-top");
  if (!button) return;

  function syncVisibility() {
    button.classList.toggle("is-visible", window.scrollY > 460);
  }

  syncVisibility();
  window.addEventListener("scroll", syncVisibility, { passive: true });
}

/* ── Initialise ──────────────────────────────────────── */
setupPageLoader();
resizeAurora();
resizeNet();
resizeScan();
setupTickerLoop();

if (!prefersReducedMotion) {
  requestAnimationFrame(rafLoop);
} else {
  // Static draw once for reduced motion
  drawNet(0);
}

animateCounters();
setupScrollReveal();
setupCursorGlow();
setupTiltCards();
setActiveNav();
setupBackToTop();

window.addEventListener("resize", () => {
  resizeAurora();
  resizeNet();
  resizeScan();
});
