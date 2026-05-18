const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

document.body.classList.add("is-loading");

window.addEventListener("load", () => {
  const loader = document.querySelector(".loader");
  window.setTimeout(() => {
    loader?.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
    revealHero();
    updateScrollEffects();
  }, prefersReducedMotion ? 100 : 1450);
});

const revealItems = Array.from(document.querySelectorAll(".reveal"));
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 42, 360)}ms`;
  revealObserver.observe(item);
});

function revealHero() {
  document.querySelectorAll(".hero-stage .reveal").forEach((item) => {
    item.classList.add("is-visible");
  });
}

const canvas = document.getElementById("atmosphere");
const ctx = canvas.getContext("2d", { alpha: true });
const aboutCanvas = document.getElementById("about-field");
const aboutCtx = aboutCanvas?.getContext("2d", { alpha: true });
let width = 0;
let height = 0;
let dpr = 1;
let pointer = { x: 0.5, y: 0.5 };
let aboutWidth = 0;
let aboutHeight = 0;
let aboutDpr = 1;
let aboutDots = [];
let aboutPointer = { x: -9999, y: -9999, active: false };

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

}

function drawAtmosphere(time = 0) {
  ctx.clearRect(0, 0, width, height);
  const t = time * 0.001;

  const glow = ctx.createRadialGradient(
    width * (0.24 + pointer.x * 0.08),
    height * (0.18 + pointer.y * 0.08),
    0,
    width * 0.5,
    height * 0.45,
    Math.max(width, height) * 0.8
  );
  glow.addColorStop(0, "rgba(148, 245, 196, 0.32)");
  glow.addColorStop(0.46, "rgba(141, 121, 255, 0.17)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  if (!prefersReducedMotion) {
    requestAnimationFrame(drawAtmosphere);
  }
}

function resizeAboutField() {
  if (!aboutCanvas || !aboutCtx) return;
  const section = aboutCanvas.parentElement;
  const rect = section.getBoundingClientRect();
  aboutDpr = Math.min(window.devicePixelRatio || 1, 2);
  aboutWidth = Math.max(1, Math.floor(rect.width));
  aboutHeight = Math.max(1, Math.floor(rect.height));
  aboutCanvas.width = Math.floor(aboutWidth * aboutDpr);
  aboutCanvas.height = Math.floor(aboutHeight * aboutDpr);
  aboutCanvas.style.width = `${aboutWidth}px`;
  aboutCanvas.style.height = `${aboutHeight}px`;
  aboutCtx.setTransform(aboutDpr, 0, 0, aboutDpr, 0, 0);

  const gap = 28;
  aboutDots = [];
  for (let y = gap; y < aboutHeight; y += gap) {
    for (let x = gap; x < aboutWidth; x += gap) {
      const noise = Math.sin(x * 0.025) * Math.cos(y * 0.018);
      aboutDots.push({
        x,
        y,
        seed: noise,
        r: 1.1 + Math.abs(noise) * 1.3 + Math.random() * 0.6
      });
    }
  }
}

function drawAboutField() {
  if (!aboutCtx) return;
  aboutCtx.clearRect(0, 0, aboutWidth, aboutHeight);
  const radius = 190;

  if (aboutPointer.active) {
    const glow = aboutCtx.createRadialGradient(aboutPointer.x, aboutPointer.y, 0, aboutPointer.x, aboutPointer.y, radius);
    glow.addColorStop(0, "rgba(255, 90, 31, 0.14)");
    glow.addColorStop(0.52, "rgba(255, 90, 31, 0.045)");
    glow.addColorStop(1, "rgba(255, 90, 31, 0)");
    aboutCtx.fillStyle = glow;
    aboutCtx.fillRect(aboutPointer.x - radius, aboutPointer.y - radius, radius * 2, radius * 2);
  }

  aboutDots.forEach((dot) => {
    let drawX = dot.x;
    let drawY = dot.y;
    let alpha = 0.18 + Math.abs(dot.seed) * 0.2;
    const dx = aboutPointer.x - dot.x;
    const dy = aboutPointer.y - dot.y;
    const distance = Math.hypot(dx, dy);

    if (aboutPointer.active && distance < radius) {
      const pull = Math.pow(1 - distance / radius, 2);
      drawX += dx * pull * 0.34;
      drawY += dy * pull * 0.34;
      alpha += pull * 0.28;
    }

    aboutCtx.beginPath();
    aboutCtx.fillStyle = `rgba(120, 120, 120, ${alpha})`;
    aboutCtx.arc(drawX, drawY, dot.r, 0, Math.PI * 2);
    aboutCtx.fill();
  });

  if (!prefersReducedMotion) requestAnimationFrame(drawAboutField);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  resizeAboutField();
  updateScrollEffects();
});

window.addEventListener("pointermove", (event) => {
  pointer = {
    x: event.clientX / Math.max(1, width),
    y: event.clientY / Math.max(1, height)
  };

  if (aboutCanvas) {
    const rect = aboutCanvas.getBoundingClientRect();
    aboutPointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
    };
  }
});

resizeCanvas();
drawAtmosphere();
resizeAboutField();
drawAboutField();

const heroScroll = document.querySelector(".hero-scroll");
const heroStage = document.querySelector(".hero-stage");
const heroMask = document.querySelector(".hero-mask");
const heroCopy = document.querySelector(".hero-copy");
const stackCards = Array.from(document.querySelectorAll(".stack-card"));
const sectionTitles = Array.from(document.querySelectorAll(".section-title"));

function updateHeroMask() {
  if (!heroScroll || !heroMask || prefersReducedMotion) return;
  const rect = heroScroll.getBoundingClientRect();
  const scrollable = Math.max(1, rect.height - window.innerHeight);
  const progress = clamp(-rect.top / scrollable);
  const eased = 1 - Math.pow(1 - progress, 3);

  heroStage.style.setProperty("--hero-inset", `${eased * 29}%`);
  heroStage.style.setProperty("--hero-side", `${eased * 32}%`);
  heroStage.style.setProperty("--hero-radius", `${eased * 34}px`);
  heroStage.style.setProperty("--hero-scale", `${1 - eased * 0.03}`);
  heroStage.style.setProperty("--marquee-opacity", String(clamp((progress - 0.22) / 0.34)));
  heroStage.style.setProperty("--hero-copy-opacity", String(clamp(1 - (progress - 0.02) / 0.22)));

  if (heroCopy) {
    heroCopy.style.transform = `translateY(${-progress * 26}px)`;
    heroCopy.style.opacity = String(clamp(1 - progress * 1.25, 0, 1));
  }
}

function updateSectionTitles() {
  sectionTitles.forEach((title) => {
    const rect = title.getBoundingClientRect();
    const start = window.innerHeight * 0.82;
    const end = window.innerHeight * 0.58;
    const progress = clamp((start - rect.top) / (start - end));
    title.style.setProperty("--title-progress", progress.toFixed(3));
  });
}

function updateStackCards() {
  stackCards.forEach((card, index) => {
    if (index === 0) {
      card.style.transform = "translateY(0) scale(1) rotate(0deg)";
      return;
    }

    const rect = card.getBoundingClientRect();
    const progress = clamp((window.innerHeight * 0.74 - rect.top) / (window.innerHeight * 0.72));
    const lift = -progress * Math.min(92, index * 24);
    const scale = 1 - progress * 0.012;
    const rotate = (index % 2 === 0 ? -1 : 1) * progress * 0.28;
    card.style.transform = `translateY(${lift}px) scale(${scale}) rotate(${rotate}deg)`;
  });
}

function updateScrollEffects() {
  updateHeroMask();
  updateSectionTitles();
  updateStackCards();
}

window.addEventListener("scroll", updateScrollEffects, { passive: true });
updateScrollEffects();

document.querySelectorAll("[data-keyword]").forEach((item) => {
  const lab = item.closest(".letter-lab");
  const activate = () => {
    lab?.classList.add("has-active");
    item.classList.add("is-active");
  };
  const deactivate = () => {
    item.classList.remove("is-active");
    if (!lab?.querySelector(".is-active")) lab?.classList.remove("has-active");
  };
  item.addEventListener("pointerenter", activate);
  item.addEventListener("pointerleave", deactivate);
  item.addEventListener("focusin", activate);
  item.addEventListener("focusout", deactivate);
});

const carousel = document.querySelector(".capability-orbit");
const carouselCards = Array.from(document.querySelectorAll("[data-carousel-card]"));
const prevButton = document.querySelector(".carousel-button--prev");
const nextButton = document.querySelector(".carousel-button--next");
let carouselAngle = 0;
let dragStartX = 0;
let dragStartAngle = 0;
let isDraggingCarousel = false;

function renderCarousel() {
  if (!carouselCards.length) return;
  const count = carouselCards.length;
  const step = 360 / count;
  const radius = Math.min(window.innerWidth * 0.34, 520);
  carouselCards.forEach((card, index) => {
    const angle = index * step + carouselAngle;
    const normalized = ((angle % 360) + 360) % 360;
    const frontness = Math.cos((normalized * Math.PI) / 180);
    const opacity = 0.36 + Math.max(0, frontness) * 0.64;
    card.style.opacity = opacity.toFixed(3);
    card.style.transform = `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px)`;
    card.style.zIndex = String(Math.round(frontness * 100));
  });
}

prevButton?.addEventListener("click", () => {
  carouselAngle += 72;
  renderCarousel();
});

nextButton?.addEventListener("click", () => {
  carouselAngle -= 72;
  renderCarousel();
});

carousel?.addEventListener("pointerdown", (event) => {
  isDraggingCarousel = true;
  dragStartX = event.clientX;
  dragStartAngle = carouselAngle;
  carousel.classList.add("is-dragging");
  carousel.setPointerCapture(event.pointerId);
});

carousel?.addEventListener("pointermove", (event) => {
  if (!isDraggingCarousel) return;
  carouselAngle = dragStartAngle + (event.clientX - dragStartX) * 0.28;
  renderCarousel();
});

carousel?.addEventListener("pointerup", (event) => {
  isDraggingCarousel = false;
  carousel.classList.remove("is-dragging");
  carousel.releasePointerCapture(event.pointerId);
});

carousel?.addEventListener("pointercancel", () => {
  isDraggingCarousel = false;
  carousel.classList.remove("is-dragging");
});

window.addEventListener("resize", renderCarousel);
renderCarousel();

document.querySelectorAll("[data-theme-choice]").forEach((button) => {
  button.addEventListener("click", () => {
    document.body.dataset.theme = button.dataset.themeChoice;
    document.querySelectorAll("[data-theme-choice]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
  });
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy || "";
    try {
      await navigator.clipboard.writeText(value);
      button.dataset.copied = "true";
      window.setTimeout(() => {
        delete button.dataset.copied;
      }, 900);
    } catch {
      button.dataset.copied = "false";
    }
  });
});

document.querySelectorAll(".magnetic").forEach((element) => {
  element.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion) return;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    element.style.transform = `translate3d(${x * 0.12}px, ${y * 0.18}px, 0)`;
  });

  element.addEventListener("pointerleave", () => {
    element.style.transform = "";
  });
});

document.querySelectorAll("[data-tilt]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion) return;
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 7;
    const rotateX = (0.5 - py) * 7;
    card.style.setProperty("--mx", `${px * 100}%`);
    card.style.setProperty("--my", `${py * 100}%`);
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});
