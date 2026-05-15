const canvas = document.querySelector("#signalCanvas");
const ctx = canvas.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let width = 0;
let height = 0;
let points = [];

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  points = Array.from({ length: Math.min(64, Math.floor(width / 18)) }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.34,
    vy: (Math.random() - 0.5) * 0.34,
  }));
}

function drawNetwork() {
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;

  for (const point of points) {
    point.x += point.vx;
    point.y += point.vy;

    if (point.x < -20) point.x = width + 20;
    if (point.x > width + 20) point.x = -20;
    if (point.y < -20) point.y = height + 20;
    if (point.y > height + 20) point.y = -20;
  }

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const a = points[i];
      const b = points[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);

      if (distance < 132) {
        const opacity = 1 - distance / 132;
        ctx.strokeStyle = `rgba(72, 244, 255, ${opacity * 0.16})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  for (const point of points) {
    ctx.fillStyle = "rgba(156, 255, 106, 0.5)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!prefersReducedMotion) requestAnimationFrame(drawNetwork);
}

function animateCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        const target = Number(element.dataset.count);
        const start = performance.now();
        const duration = 900;

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

function setupTickerLoop() {
  const track = document.querySelector(".ticker-track");
  if (!track || track.dataset.looped) return;

  track.innerHTML += track.innerHTML;
  track.dataset.looped = "true";
}

function setupScrollReveal() {
  const revealTargets = document.querySelectorAll(
    ".split-section, .section-heading, .capability-card, .timeline-card, .process-grid article, .featured-project, .portfolio-list a, .credentials-section > div, .site-footer"
  );

  revealTargets.forEach((target) => target.classList.add("reveal"));

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

function setupCursorGlow() {
  if (prefersReducedMotion) return;

  window.addEventListener("pointermove", (event) => {
    document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
  });
}

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

function setActiveNav() {
  const sections = ["profile", "experience", "erp", "projects", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const links = new Map(
    Array.from(document.querySelectorAll(".nav-links a")).map((link) => [
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

resizeCanvas();
setupTickerLoop();
if (prefersReducedMotion) {
  drawNetwork();
} else {
  requestAnimationFrame(drawNetwork);
}
animateCounters();
setupScrollReveal();
setupCursorGlow();
setupTiltCards();
setActiveNav();
window.addEventListener("resize", resizeCanvas);
