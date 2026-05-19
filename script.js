const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

if (!location.hash) {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

document.body.classList.add("is-loading");

let lenis = null;

function normalizeWheelInput({ deltaY, event }) {
  if (!event || event.type !== "wheel") return deltaY;

  const rawDelta = Math.abs(event.deltaY);
  const isLineWheel = event.deltaMode === 1;
  const isCoarseWheel = isLineWheel || rawDelta >= 80;

  if (!isCoarseWheel) return deltaY;

  const direction = Math.sign(deltaY) || 1;
  const softened = Math.min(Math.abs(deltaY) * 0.9, window.innerHeight * 0.54);
  return direction * softened;
}

if (!prefersReducedMotion && window.Lenis) {
  lenis = new Lenis({
    duration: 1.00,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
    wheelMultiplier: 0.96,
    touchMultiplier: 1.45,
    virtualScroll: (input) => {
      input.deltaY = normalizeWheelInput(input);
    }
  });

  lenis.on("scroll", updateScrollEffects);

  const rafLenis = (time) => {
    lenis.raf(time);
    requestAnimationFrame(rafLenis);
  };

  requestAnimationFrame(rafLenis);
}

window.addEventListener("load", () => {
  const loader = document.querySelector(".loader");
  window.setTimeout(() => {
    loader?.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
    if (!location.hash) {
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    }
    revealHero();
    updateScrollEffects();
  }, prefersReducedMotion ? 100 : 2550);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!lenis) return;
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    lenis.scrollTo(target);
  });
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
  item.style.transitionDelay = item.matches(".section-title, .stack-card")
    ? "0ms"
    : `${Math.min(index * 34, 300)}ms`;
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
const heroSignature = document.querySelector(".hero-signature");
const stackSection = document.querySelector(".stack-section");
const stackCards = Array.from(document.querySelectorAll(".stack-card"));
const sectionTitles = Array.from(document.querySelectorAll(".section-title"));

function updateHeroMask() {
  if (!heroScroll || !heroMask || prefersReducedMotion) return;
  const rect = heroScroll.getBoundingClientRect();
  const scrollable = Math.max(1, rect.height - window.innerHeight);
  const progress = clamp(-rect.top / scrollable);
  const eased = 1 - Math.pow(1 - progress, 3);

  heroStage.style.setProperty("--hero-inset-top", `${eased * 22}%`);
  heroStage.style.setProperty("--hero-inset-bottom", `${eased * 14}%`);
  heroStage.style.setProperty("--hero-side", `${eased * 24}%`);
  heroStage.style.setProperty("--hero-radius", `${eased * 34}px`);
  heroStage.style.setProperty("--hero-scale", `${1 - eased * 0.03}`);
  heroStage.style.setProperty("--hero-mask-light", String(clamp((progress - 0.04) / 0.5)));
  heroStage.style.setProperty("--marquee-opacity", String(clamp((progress - 0.22) / 0.34)));
  heroStage.style.setProperty("--hero-copy-opacity", String(clamp(1 - (progress - 0.02) / 0.22)));
  heroSignature?.style.setProperty("--signature-progress", String(clamp((progress - 0.01) / 0.32)));

  if (heroCopy) {
    heroCopy.style.transform = `translateY(${-progress * 26}px)`;
    heroCopy.style.opacity = String(clamp(1 - progress * 1.25, 0, 1));
  }
}

function updateSectionTitles() {
  sectionTitles.forEach((title) => {
    const rect = title.getBoundingClientRect();
    const start = window.innerHeight * 0.9;
    const end = window.innerHeight * 0.78;
    const progress = clamp((start - rect.top) / (start - end));
    title.style.setProperty("--title-progress", progress.toFixed(3));
  });
}

function renderStackCards(stackProgress) {
  stackCards.forEach((card, index) => {
    const targetGap = index * 34;
    card.style.zIndex = String(index + 1);

    if (index === 0) {
      card.style.transform = `translateY(${targetGap}px) scale(1) rotate(0deg)`;
      return;
    }

    const cardProgress = clamp((stackProgress - (index - 1) * 0.2) / 0.2);
    const entryY = window.innerHeight * 0.54 + index * 46;
    const eased = cardProgress;
    const y = entryY + (targetGap - entryY) * eased;
    const scale = 0.985 + eased * 0.015;
    const rotate = (index % 2 === 0 ? -1 : 1) * (1 - eased) * 0.42;
    card.style.transform = `translateY(${y}px) scale(${scale}) rotate(${rotate}deg)`;
  });
}

function updateStackCards() {
  if (!stackSection || !stackCards.length) return;
  const sectionRect = stackSection.getBoundingClientRect();
  const travel = Math.max(1, window.innerHeight * 1.8);
  renderStackCards(clamp(-sectionRect.top / travel));
}

function updateScrollEffects() {
  updateHeroMask();
  updateSectionTitles();
  updateStackCards();
}

window.addEventListener("scroll", updateScrollEffects, { passive: true });
updateScrollEffects();

document.querySelectorAll(".letter-lab").forEach((lab) => {
  const items = Array.from(lab.querySelectorAll("[data-keyword]"));
  let activeItem = null;

  const setActive = (nextItem) => {
    if (!nextItem || nextItem === activeItem) return;
    items.forEach((item) => item.classList.remove("is-active"));
    activeItem = nextItem;
    lab.classList.add("has-active");
    activeItem.classList.add("is-active");
  };

  const clearActive = () => {
    items.forEach((item) => item.classList.remove("is-active"));
    activeItem = null;
    lab.classList.remove("has-active");
  };

  lab.addEventListener("pointermove", (event) => {
    const nearest = items.reduce((best, item) => {
      const rect = item.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = dx * dx + dy * dy;
      return !best || distance < best.distance ? { item, distance } : best;
    }, null);
    setActive(nearest?.item);
  });

  lab.addEventListener("pointerleave", clearActive);

  items.forEach((item) => {
    item.addEventListener("focusin", () => setActive(item));
    item.addEventListener("focusout", clearActive);
  });
});

const carousel = document.querySelector(".capability-orbit");
const carouselCards = Array.from(document.querySelectorAll("[data-carousel-card]"));
const prevButton = document.querySelector(".carousel-button--prev");
const nextButton = document.querySelector(".carousel-button--next");
let carouselAngle = 0;
let dragStartX = 0;
let dragStartAngle = 0;
let isDraggingCarousel = false;
let carouselRaf = 0;

function renderCarousel() {
  if (!carouselCards.length) return;
  const count = carouselCards.length;
  const step = 360 / count;
  const radius = Math.min(window.innerWidth * 0.28, 390);
  carouselCards.forEach((card, index) => {
    const angle = index * step + carouselAngle;
    const normalized = ((angle % 360) + 360) % 360;
    const frontness = Math.cos((normalized * Math.PI) / 180);
    const opacity = 0.18 + Math.pow(Math.max(0, frontness), 1.65) * 0.82;
    card.style.opacity = opacity.toFixed(3);
    card.style.transform = `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px)`;
    card.style.zIndex = String(Math.round(frontness * 100));
  });
}

function animateCarouselTo(nextAngle) {
  if (carouselRaf) cancelAnimationFrame(carouselRaf);
  const startAngle = carouselAngle;
  const delta = nextAngle - startAngle;
  const duration = 620;
  const start = performance.now();

  const tick = (now) => {
    const progress = clamp((now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    carouselAngle = startAngle + delta * eased;
    renderCarousel();

    if (progress < 1) {
      carouselRaf = requestAnimationFrame(tick);
    } else {
      carouselAngle = nextAngle;
      carouselRaf = 0;
      renderCarousel();
    }
  };

  carouselRaf = requestAnimationFrame(tick);
}

prevButton?.addEventListener("click", () => {
  animateCarouselTo(carouselAngle + 72);
});

nextButton?.addEventListener("click", () => {
  animateCarouselTo(carouselAngle - 72);
});

carousel?.addEventListener("pointerdown", (event) => {
  if (carouselRaf) cancelAnimationFrame(carouselRaf);
  carouselRaf = 0;
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

const qrLinks = document.querySelector(".contact-links");
const qrToggle = document.querySelector("[data-qr-toggle]");
const qrPanel = document.querySelector("#wechat-qr-panel");
const qrClose = document.querySelector("[data-qr-close]");

const setQrOpen = (isOpen) => {
  qrLinks?.classList.toggle("is-qr-open", isOpen);
  qrToggle?.setAttribute("aria-expanded", String(isOpen));
  qrPanel?.setAttribute("aria-hidden", String(!isOpen));
};

qrToggle?.addEventListener("click", () => {
  const isOpen = qrLinks?.classList.contains("is-qr-open") || false;
  setQrOpen(!isOpen);
});

qrClose?.addEventListener("click", () => {
  setQrOpen(false);
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
    const magneticX = card.classList.contains("tool-card") ? (px - 0.5) * 12 : 0;
    const magneticY = card.classList.contains("tool-card") ? (py - 0.5) * 14 : 0;
    card.style.setProperty("--mx", `${px * 100}%`);
    card.style.setProperty("--my", `${py * 100}%`);
    card.style.transform = `translate3d(${magneticX}px, ${magneticY}px, 0) perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});
