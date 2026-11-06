// Royal doors, mandalas, petals, scroll UI, countdown, lightbox and native share support.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Mandalas ----------
// Builds concentric rings of petals into every <svg class="mandala"> (viewBox -200 -200 400 400).
const SVG_NS = "http://www.w3.org/2000/svg";
const rings = [
  { count: 8, rx: 14, ry: 40, y: -52 },
  { count: 16, rx: 9, ry: 26, y: -104 },
  { count: 24, rx: 6, ry: 22, y: -142 },
  { count: 48, rx: 2.5, ry: 12, y: -178 }
];
const circles = [24, 88, 128, 162, 194];

function buildMandala(svg) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("stroke-width", "1.2");
  circles.forEach((r, i) => {
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("r", r);
    if (i % 2) circle.setAttribute("stroke-dasharray", "2 5");
    group.appendChild(circle);
  });
  rings.forEach(({ count, rx, ry, y }) => {
    for (let i = 0; i < count; i++) {
      const petal = document.createElementNS(SVG_NS, "ellipse");
      petal.setAttribute("cx", 0);
      petal.setAttribute("cy", y);
      petal.setAttribute("rx", rx);
      petal.setAttribute("ry", ry);
      petal.setAttribute("transform", `rotate(${(360 / count) * i})`);
      group.appendChild(petal);
    }
  });
  svg.appendChild(group);
}
document.querySelectorAll("svg.mandala").forEach(buildMandala);

// ---------- Royal doors ----------
const opener = document.getElementById("opener");
const openButton = document.getElementById("openInvite");
document.body.classList.add("locked");
openButton.focus({ preventScroll: true });

function openInvitation() {
  opener.classList.add("opened");
  document.body.classList.remove("locked");
  document.body.classList.add("ready");
  setTimeout(() => opener.remove(), reduceMotion ? 0 : 2000);
}
openButton.addEventListener("click", openInvitation);
opener.addEventListener("keydown", (event) => {
  if (event.key === "Escape") openInvitation();
});

// ---------- Falling petals ----------
if (!reduceMotion) {
  const petals = document.getElementById("petals");
  const count = window.innerWidth < 720 ? 12 : 22;
  for (let i = 0; i < count; i++) {
    const petal = document.createElement("span");
    petal.className = i % 3 === 0 ? "petal gold" : "petal";
    const size = 8 + Math.random() * 10;
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.width = `${size}px`;
    petal.style.height = `${size}px`;
    petal.style.opacity = (0.35 + Math.random() * 0.45).toFixed(2);
    petal.style.animationDuration = `${12 + Math.random() * 14}s`;
    petal.style.animationDelay = `${-Math.random() * 20}s`;
    petals.appendChild(petal);
  }
}

// ---------- Reveal on scroll ----------
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

// ---------- Scroll progress, top nav, mobile dock, active link ----------
const progress = document.getElementById("scrollProgress");
const topnav = document.getElementById("topnav");
const dock = document.querySelector(".dock");
const hero = document.getElementById("home");
const navLinks = [...document.querySelectorAll(".topnav-links a")];
const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href")));

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;

  const pastHero = window.scrollY > hero.offsetHeight * 0.6;
  topnav.classList.toggle("show", pastHero);
  dock.classList.toggle("show", pastHero);

  const marker = window.scrollY + window.innerHeight * 0.35;
  let activeIndex = -1;
  sections.forEach((section, i) => {
    if (section && section.offsetTop <= marker) activeIndex = i;
  });
  navLinks.forEach((link, i) => link.classList.toggle("active", i === activeIndex));
}
let scrollQueued = false;
window.addEventListener("scroll", () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    onScroll();
    scrollQueued = false;
  });
}, { passive: true });
onScroll();

// ---------- Countdown ----------
// Event time is 6:00 PM India Standard Time (UTC+05:30).
const eventDate = new Date("2026-11-15T18:00:00+05:30").getTime();
const countdownGrid = document.getElementById("countdownGrid");
const countdownDone = document.getElementById("countdownDone");
let countdownTimer;

function updateCountdown() {
  const diff = eventDate - Date.now();
  if (diff <= 0) {
    countdownGrid.hidden = true;
    countdownDone.hidden = false;
    clearInterval(countdownTimer);
    return;
  }
  const values = {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000)
  };
  Object.entries(values).forEach(([key, value]) => {
    const el = document.getElementById(key);
    const text = String(value).padStart(2, "0");
    if (el && el.textContent !== text) {
      el.textContent = text;
      const tick = el.parentElement;
      tick.classList.remove("flip");
      void tick.offsetWidth; // restart the flip animation
      tick.classList.add("flip");
    }
  });
}
updateCountdown();
countdownTimer = setInterval(updateCountdown, 1000);

// ---------- Lightbox ----------
const lightbox = document.getElementById("lightbox");
const lbImage = document.getElementById("lbImage");
const lbCaption = document.getElementById("lbCaption");
const photos = [...document.querySelectorAll(".photo")].map((figure) => ({
  src: figure.querySelector("img").src,
  alt: figure.querySelector("img").alt,
  caption: figure.querySelector("figcaption").textContent
}));
let current = 0;

function showPhoto(index) {
  current = (index + photos.length) % photos.length;
  lbImage.src = photos[current].src;
  lbImage.alt = photos[current].alt;
  lbCaption.textContent = photos[current].caption;
}
if (typeof lightbox.showModal === "function") {
  document.querySelectorAll(".photo-frame").forEach((frame) => {
    frame.addEventListener("click", () => {
      showPhoto(Number(frame.dataset.index));
      lightbox.showModal();
    });
  });
  lightbox.querySelector(".lb-close").addEventListener("click", () => lightbox.close());
  lightbox.querySelector(".lb-prev").addEventListener("click", () => showPhoto(current - 1));
  lightbox.querySelector(".lb-next").addEventListener("click", () => showPhoto(current + 1));
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showPhoto(current - 1);
    if (event.key === "ArrowRight") showPhoto(current + 1);
  });
  let touchX = null;
  lightbox.addEventListener("touchstart", (event) => { touchX = event.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", (event) => {
    if (touchX === null) return;
    const dx = event.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showPhoto(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });
}

// ---------- Share ----------
const shareHint = document.getElementById("shareHint");
const toast = document.getElementById("toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

async function shareInvitation() {
  const shareData = {
    title: "Vignesh & Amrutha — Nichayathartham",
    text: "You're warmly invited to Vignesh & Amrutha's engagement on Sunday, 15 November 2026 at 6:00 PM, at Agaram Palace, Chennai.",
    url: window.location.href
  };
  const fallback = "Copy this page's address from your browser and send it to your guests.";
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(window.location.href);
      shareHint.textContent = "Invitation link copied. Share it with family and friends!";
      showToast("Invitation link copied ♡");
    } else {
      shareHint.textContent = fallback;
      showToast(fallback);
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      shareHint.textContent = fallback;
    }
  }
}
document.getElementById("shareButton").addEventListener("click", shareInvitation);
document.getElementById("dockShare").addEventListener("click", shareInvitation);
