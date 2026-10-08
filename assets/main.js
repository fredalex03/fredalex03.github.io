"use strict";
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
let language = localStorage.getItem("language") || "en";
function setLanguage(next) {
  language = next;
  document.documentElement.lang = next;
  window.dispatchEvent(new CustomEvent("site-language-change"));
  $$(`[data-${next}]`).forEach((el) => {
    const t = el.dataset[next];
    if (t) t.includes("<br>") ? (el.innerHTML = t) : (el.textContent = t);
  });
  $$(`[data-href-${next}]`).forEach((el) => {
    el.href = el.dataset[next === "fr" ? "hrefFr" : "hrefEn"];
  });
  const b = $("#lang");
  if (b) b.textContent = next === "en" ? "FR" : "EN";
  localStorage.setItem("language", next);
}
$("#lang")?.addEventListener("click", () =>
  setLanguage(language === "en" ? "fr" : "en"),
);
setLanguage(language);
const observer = new IntersectionObserver(
  (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("on")),
  { threshold: 0.1 },
);
$$(".reveal").forEach((e) => observer.observe(e));
addEventListener(
  "scroll",
  () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = $("#progress");
    if (p) p.style.width = `${max ? (scrollY / max) * 100 : 0}%`;
  },
  { passive: true },
);
if ($("#year")) $("#year").textContent = new Date().getFullYear();

// Active navigation section
function setupActiveNavigation() {
  const links = $$("#nav a[href^='#']");
  const sections = links
    .map((link) => document.querySelector(link.hash))
    .filter(Boolean);

  if (!links.length || !sections.length) return;

  const style = document.createElement("style");
  style.textContent = `
    #nav a {
      position: relative;
      padding-bottom: 7px;
    }

    #nav a::after {
      content: "";
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      height: 1px;
      background: var(--cyan);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 180ms ease;
    }

    #nav a.is-active {
      color: var(--cyan);
      -webkit-text-fill-color: var(--cyan);
      opacity: 1;
    }

    #nav a.is-active::after {
      transform: scaleX(1);
    }
  `;
  document.head.append(style);

  const setActiveLink = (sectionId) => {
    links.forEach((link) => {
      const isActive = link.hash === `#${sectionId}`;
      link.classList.toggle("is-active", isActive);

      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (current) setActiveLink(current.target.id);
    },
    {
      rootMargin: "-30% 0px -60% 0px",
      threshold: [0, 0.2, 0.5],
    },
  );

  sections.forEach((section) => observer.observe(section));
}

setupActiveNavigation();

// PDF links for talks with available Beamer slides.
function setupTalkPdfLinks() {
  const talks = $$("#talks .talk-list article");
  const presentations = [
    [0, "Clubmath_2026.pdf"],
    [1, "Diapos_CUMC2026.pdf"],
    [2, "experium2026.pdf"],
    [3, "summ2026.pdf"],
    [4, "presentation-stage-e25.pdf"],
    [5, "beamer-cumc.pdf"],
    [6, "Présentation___SUMM.pdf"],
    [7, "Intro_top_diff_Frédéric-A.Lacasse.pdf"],
  ];

  presentations.forEach(([index, file]) => {
    const content = talks[index]?.querySelector("div");
    if (!content || content.querySelector(".talk-pdf-link")) return;

    const link = document.createElement("a");
    link.className = "talk-pdf-link";
    link.href = `assets/${file}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "Open presentation PDF");
    link.dataset.en = "OPEN PDF ↗";
    link.dataset.fr = "OUVRIR LE PDF ↗";
    link.textContent = language === "fr" ? link.dataset.fr : link.dataset.en;
    content.append(link);
  });

  if (document.querySelector("#talk-pdf-link-styles")) return;

  const style = document.createElement("style");
  style.id = "talk-pdf-link-styles";
  style.textContent = `
    .talk-pdf-link,
    .talk-pdf-link:link,
    .talk-pdf-link:visited {
      display: inline-flex;
      align-items: center;
      margin-top: 14px;
      padding: 8px 12px;
      border: 1px solid rgba(105, 234, 214, 0.28);
      border-radius: 999px;
      color: var(--acid);
      -webkit-text-fill-color: var(--acid);
      font: 400 9px var(--mono);
      letter-spacing: 0.1em;
      text-decoration: none;
      transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
    }

    .talk-pdf-link:hover {
      transform: translateY(-2px);
      border-color: var(--cyan);
      background: rgba(105, 234, 214, 0.08);
    }

    .talk-pdf-link:focus-visible {
      outline: 2px solid var(--acid);
      outline-offset: 4px;
    }
  `;
  document.head.append(style);
}

setupTalkPdfLinks();

class ConeAnimation {
  constructor() {
    this.canvas = $("#cone");
    if (!this.canvas) return;
    this.context = this.canvas.getContext("2d");
    this.slider = $("#slider");
    this.button = $("#play");
    this.value = 0;
    this.playing = true;
    this.time = 0;
    this.lastFrame = performance.now();
    this.slider?.addEventListener("input", () => {
      this.value = Number(this.slider.value) / 100;
      this.playing = false;
      this.updateButton();
    });
    this.button?.addEventListener("click", () => {
      this.playing = !this.playing;
      this.updateButton();
    });
    addEventListener("resize", () => this.resize());
    addEventListener("site-language-change", () => this.updateButton());
    this.resize();
    this.updateButton();
    requestAnimationFrame((now) => this.frame(now));
  }
  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    const density = Math.min(devicePixelRatio || 1, 2);
    this.width = bounds.width;
    this.height = bounds.height;
    this.canvas.width = bounds.width * density;
    this.canvas.height = bounds.height * density;
    this.context.setTransform(density, 0, 0, density, 0, 0);
  }
  updateButton() {
    if (!this.button) return;

    const isFrench = document.documentElement.lang === "fr";
    this.button.textContent = this.playing
      ? isFrench
        ? "Mettre l’évolution en pause"
        : "Pause evolution"
      : isFrench
        ? "Reprendre l’évolution"
        : "Play evolution";
  }
  frame(now) {
    const delta = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    if (this.playing) {
      this.time += delta;
      const travel = 5;
      const hold = 1.3;
      const phase = this.time % (2 * travel + 2 * hold);
      if (phase < hold) this.value = 0;
      else if (phase < hold + travel) this.value = (phase - hold) / travel;
      else if (phase < 2 * hold + travel) this.value = 1;
      else this.value = 1 - (phase - 2 * hold - travel) / travel;
      if (this.slider) this.slider.value = Math.round(this.value * 100);
    }
    this.draw();
    requestAnimationFrame((next) => this.frame(next));
  }
  drawArrow(x1, y1, x2, y2, label) {
    const c = this.context;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const size = 7;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(
      x2 - size * Math.cos(angle - Math.PI / 6),
      y2 - size * Math.sin(angle - Math.PI / 6),
    );
    c.lineTo(
      x2 - size * Math.cos(angle + Math.PI / 6),
      y2 - size * Math.sin(angle + Math.PI / 6),
    );
    c.closePath();
    c.fill();
    const labelX = label === "t" ? x2 + 18 : x2 + 8;
    const axisLabelY = label === "t" ? y2 + 20 : y2 + 4;
    c.fillText(label, labelX, axisLabelY);
  }
  drawCone(cx, cy, halfWidth, halfHeight) {
    const c = this.context;
    const gradient = c.createLinearGradient(
      cx,
      cy - halfHeight,
      cx,
      cy + halfHeight,
    );
    gradient.addColorStop(0, "rgba(105,234,214,.42)");
    gradient.addColorStop(0.5, "rgba(105,234,214,.82)");
    gradient.addColorStop(1, "rgba(213,255,98,.34)");
    c.fillStyle = gradient;
    c.strokeStyle = "rgba(105,234,214,.95)";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx - halfWidth, cy - halfHeight);
    c.quadraticCurveTo(
      cx,
      cy - halfHeight * 0.76,
      cx + halfWidth,
      cy - halfHeight,
    );
    c.closePath();
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx - halfWidth, cy + halfHeight);
    c.quadraticCurveTo(
      cx,
      cy + halfHeight * 0.76,
      cx + halfWidth,
      cy + halfHeight,
    );
    c.closePath();
    c.fill();
    c.stroke();
  }
  draw() {
    const c = this.context;
    const cx = this.width / 2;
    const topBand = 54;
    const drawingHeight = this.height - topBand;
    const cy = topBand + drawingHeight / 2;
    const scale = Math.min(this.width, this.height) * 0.38;
    const angle = (this.value * Math.PI) / 2;
    // Exact contraction limits:
    // Carroll (value = 0): the cone collapses onto the t-axis.
    // Galilei (value = 1): the cone collapses onto the x-axis.
    const halfWidth = Math.sin(angle) * scale;
    const halfHeight = Math.cos(angle) * scale;
    c.clearRect(0, 0, this.width, this.height);
    c.strokeStyle = "rgba(242,255,252,.5)";
    c.fillStyle = "rgba(242,255,252,.8)";
    c.lineWidth = 1;
    c.font = '12px "DM Mono", monospace';
    this.drawArrow(28, cy, this.width - 28, cy, "x");
    this.drawArrow(cx, this.height - 26, cx, topBand + 22, "t");
    this.drawCone(cx, cy, halfWidth, halfHeight);

    // At an exact contraction limit the filled cone has zero area.
    // Draw its degenerate image explicitly so the limit remains visible.
    c.save();
    c.strokeStyle = "rgba(105, 234, 214, 0.98)";
    c.lineWidth = 4;
    c.lineCap = "round";
    c.shadowColor = "rgba(105, 234, 214, 0.55)";
    c.shadowBlur = 10;

    if (this.value <= 0.001) {
      // Carrollian limit: collapse onto the t-axis.
      c.beginPath();
      c.moveTo(cx, cy - scale);
      c.lineTo(cx, cy + scale);
      c.stroke();
    } else if (this.value >= 0.999) {
      // Galilean limit: collapse onto the x-axis.
      c.beginPath();
      c.moveTo(cx - scale, cy);
      c.lineTo(cx + scale, cy);
      c.stroke();
    }

    c.restore();
    c.textAlign = "center";
    const isFrench = document.documentElement.lang === "fr";
    const isCarrollianLimit = this.value <= 0.001;
    const isGalileanLimit = this.value >= 0.999;

    // Use the limit names only once the contraction is complete.
    const regimeLabel = isCarrollianLimit
      ? isFrench
        ? "CARROLLIEN"
        : "CARROLLIAN"
      : isGalileanLimit
        ? isFrench
          ? "GALILÉEN"
          : "GALILEAN"
        : isFrench
          ? "LORENTZIEN"
          : "LORENTZIAN";

    // Draw the label last, inside a small dark plate, so it never disappears
    // behind the axes, the collapsed cone, or the canvas border.
    c.save();
    c.font = '500 12px "DM Mono", monospace';
    c.textAlign = "center";
    c.textBaseline = "middle";
    const labelY = 24;
    const limitLabel = isCarrollianLimit
      ? "c → 0"
      : isGalileanLimit
        ? "c → ∞"
        : "0 < c < ∞";

    const titleWidth = c.measureText(regimeLabel).width;
    c.font = '400 10px "DM Mono", monospace';
    const limitWidth = c.measureText(limitLabel).width;
    const labelWidth = Math.max(titleWidth, limitWidth) + 28;

    c.fillStyle = "rgba(4, 9, 8, 0.88)";
    c.strokeStyle = "rgba(105, 234, 214, 0.32)";
    c.lineWidth = 1;
    c.beginPath();
    c.roundRect(cx - labelWidth / 2, labelY - 20, labelWidth, 40, 16);
    c.fill();
    c.stroke();

    c.fillStyle = "rgba(242, 255, 252, 0.96)";
    c.font = '500 12px "DM Mono", monospace';
    c.fillText(regimeLabel, cx, labelY - 6);

    c.fillStyle = isCarrollianLimit
      ? "rgba(105, 234, 214, 0.98)"
      : isGalileanLimit
        ? "rgba(213, 255, 98, 0.98)"
        : "rgba(145, 161, 154, 0.92)";
    c.font = '400 10px "DM Mono", monospace';
    c.fillText(limitLabel, cx, labelY + 9);
    c.restore();
    c.textAlign = "start";
  }
}
new ConeAnimation();
class LensedStarField {
  constructor() {
    this.canvas = $("#starfield");
    if (!this.canvas) return;
    this.c = this.canvas.getContext("2d");
    this.p = { x: innerWidth * 0.72, y: innerHeight * 0.42 };
    this.t = { ...this.p };
    this.last = performance.now();
    addEventListener(
      "pointermove",
      (e) => {
        this.t.x = e.clientX;
        this.t.y = e.clientY;
      },
      { passive: true },
    );
    addEventListener("resize", () => this.resize());
    this.resize();
    requestAnimationFrame((t) => this.frame(t));
  }
  resize() {
    const d = Math.min(devicePixelRatio || 1, 2);
    this.w = innerWidth;
    this.h = innerHeight;
    this.canvas.width = this.w * d;
    this.canvas.height = this.h * d;
    this.c.setTransform(d, 0, 0, d, 0, 0);
    const n = Math.max(210, Math.floor((this.w * this.h) / 4300));
    this.stars = Array.from({ length: n }, (_, i) => ({
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      r: 0.55 + Math.random() * 1.4,
      a: 0.46 + Math.random() * 0.54,
      s: 1.4 + Math.random() * 5.2,
      ph: i * 0.67,
    }));
    this.rays = Array.from({ length: 30 }, (_, i) => ({
      a: (Math.PI * 2 * i) / 30 + Math.random() * 0.08,
      l: 230 + Math.random() * 390,
      w: 0.45 + Math.random() * 1.05,
      o: 0.065 + Math.random() * 0.105,
      ph: Math.random() * Math.PI * 2,
    }));
  }
  frame(t) {
    const dt = Math.min((t - this.last) / 1000, 0.05);
    this.last = t;
    this.p.x += (this.t.x - this.p.x) * 0.075;
    this.p.y += (this.t.y - this.p.y) * 0.075;
    this.background();
    this.drawStars(t, dt);
    this.ring(t);
    requestAnimationFrame((n) => this.frame(n));
  }
  background() {
    const c = this.c;
    c.fillStyle = "#020706";
    c.fillRect(0, 0, this.w, this.h);
    const g = c.createRadialGradient(
      this.p.x,
      this.p.y,
      0,
      this.p.x,
      this.p.y,
      520,
    );
    g.addColorStop(0, "rgba(25,92,76,.11)");
    g.addColorStop(1, "rgba(2,7,6,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, this.w, this.h);
  }
  drawStars(t, dt) {
    const c = this.c,
      R = 205;
    this.stars.forEach((s) => {
      s.y += s.s * dt;
      if (s.y > this.h + 5) {
        s.y = -5;
        s.x = Math.random() * this.w;
      }
      const dx = s.x - this.p.x,
        dy = s.y - this.p.y,
        d = Math.hypot(dx, dy) || 1,
        f = Math.max(0, 1 - d / R),
        b = f * f * 52,
        x = s.x - (dy / d) * b,
        y = s.y + (dx / d) * b,
        tw = 0.78 + Math.sin(t * 0.0015 + s.ph) * 0.22;
      c.beginPath();
      c.arc(x, y, s.r + f * 1.1, 0, Math.PI * 2);
      c.fillStyle = `rgba(242,255,252,${s.a * tw})`;
      c.fill();
    });
  }
  drawRays(t) {
    const c = this.c;
    c.save();
    c.globalCompositeOperation = "screen";
    c.shadowColor = "rgba(166,242,229,.25)";
    c.shadowBlur = 4;
    this.rays.forEach((r) => {
      const pulse = 0.78 + Math.sin(t * 0.0009 + r.ph) * 0.22,
        x = this.p.x + Math.cos(r.a) * r.l,
        y = this.p.y + Math.sin(r.a) * r.l,
        cx = this.p.x + Math.cos(r.a + Math.PI / 2) * 34,
        cy = this.p.y + Math.sin(r.a + Math.PI / 2) * 34,
        g = c.createLinearGradient(x, y, this.p.x, this.p.y);
      g.addColorStop(0, "rgba(175,245,233,0)");
      g.addColorStop(0.42, `rgba(175,245,233,${r.o * 0.55 * pulse})`);
      g.addColorStop(0.8, `rgba(202,255,246,${r.o * 1.25 * pulse})`);
      g.addColorStop(1, `rgba(255,255,255,${r.o * 2.8 * pulse})`);
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(cx, cy, this.p.x, this.p.y);
      c.strokeStyle = g;
      c.lineWidth = r.w;
      c.stroke();
    });
    c.restore();
  }
  ring(t) {
    const c = this.c,
      r = 43 * (1 + Math.sin(t * 0.0011) * 0.024);
    c.save();
    c.globalCompositeOperation = "screen";
    const halo = c.createRadialGradient(
      this.p.x,
      this.p.y,
      r * 0.65,
      this.p.x,
      this.p.y,
      r + 64,
    );
    halo.addColorStop(0, "rgba(105,234,214,0)");
    halo.addColorStop(0.3, "rgba(105,234,214,.04)");
    halo.addColorStop(0.58, "rgba(105,234,214,.085)");
    halo.addColorStop(0.82, "rgba(105,234,214,.04)");
    halo.addColorStop(1, "rgba(105,234,214,0)");
    c.fillStyle = halo;
    c.beginPath();
    c.arc(this.p.x, this.p.y, r + 64, 0, Math.PI * 2);
    c.fill();
    const ring = c.createRadialGradient(
      this.p.x,
      this.p.y,
      r - 12,
      this.p.x,
      this.p.y,
      r + 14,
    );
    ring.addColorStop(0, "rgba(105,234,214,0)");
    ring.addColorStop(0.42, "rgba(105,234,214,.08)");
    ring.addColorStop(0.5, "rgba(225,255,248,.31)");
    ring.addColorStop(0.6, "rgba(105,234,214,.08)");
    ring.addColorStop(1, "rgba(105,234,214,0)");
    c.fillStyle = ring;
    c.beginPath();
    c.arc(this.p.x, this.p.y, r + 15, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.save();
    c.globalCompositeOperation = "source-over";
    const core = c.createRadialGradient(
      this.p.x,
      this.p.y,
      0,
      this.p.x,
      this.p.y,
      30,
    );
    core.addColorStop(0, "rgba(0,0,0,1)");
    core.addColorStop(0.7, "rgba(0,0,0,1)");
    core.addColorStop(0.86, "rgba(0,0,0,.78)");
    core.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = core;
    c.beginPath();
    c.arc(this.p.x, this.p.y, 30, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}
new LensedStarField();

// Language badges for talks.
(() => {
  const talks = document.querySelectorAll("#talks .talk-list article");
  const talkLanguages = ["fr", "en", "fr", "fr", "fr", "en", "fr", "fr"];

  talkLanguages.forEach((talkLanguage, index) => {
    const content = talks[index]?.querySelector("div");
    const venue = content?.querySelector("small");

    if (!content || !venue || content.querySelector(".talk-language")) {
      return;
    }

    const badge = document.createElement("span");
    badge.className = `talk-language talk-language-${talkLanguage}`;
    badge.lang = talkLanguage;
    badge.dataset.en = talkLanguage === "en" ? "ENGLISH" : "FRENCH";
    badge.dataset.fr = talkLanguage === "en" ? "ANGLAIS" : "FRANÇAIS";
    badge.textContent =
      document.documentElement.lang === "fr"
        ? badge.dataset.fr
        : badge.dataset.en;

    venue.after(badge);
  });

  if (!document.querySelector("#talk-language-styles")) {
    const style = document.createElement("style");
    style.id = "talk-language-styles";
    style.textContent = `
      .talk-language {
        display: inline-flex;
        margin-left: 10px;
        padding: 3px 7px;
        border: 1px solid rgba(105, 234, 214, 0.24);
        border-radius: 999px;
        color: var(--cyan);
        font: 400 8px var(--mono);
        letter-spacing: 0.1em;
        line-height: 1;
        vertical-align: middle;
      }

      .talk-language-en {
        color: var(--acid);
        border-color: rgba(213, 255, 98, 0.28);
      }
    `;
    document.head.append(style);
  }
})();

// Thesis language label and oral-defense slides.
(() => {
  const thesisSection = document.querySelector("#thesis, #theses");
  if (!thesisSection) return;

  const thesisCard =
    thesisSection.querySelector(
      ".thesis-card, .thesis-item, article, a[href$='.pdf']",
    ) ?? thesisSection;

  // Add a polished language badge even when the original card has no “(in French)” text.
  if (!thesisCard.querySelector(".thesis-language-badge")) {
    const languageBadge = document.createElement("span");
    languageBadge.className = "thesis-language-badge";
    languageBadge.lang = "fr";
    languageBadge.dataset.en = "FRENCH-LANGUAGE WORK";
    languageBadge.dataset.fr = "TRAVAIL EN FRANÇAIS";
    languageBadge.textContent =
      document.documentElement.lang === "fr"
        ? languageBadge.dataset.fr
        : languageBadge.dataset.en;

    const thesisKind = thesisCard.querySelector(".thesis-kind");
    const thesisSchool = thesisCard.querySelector(".thesis-school");

    if (thesisKind) thesisKind.after(languageBadge);
    else if (thesisSchool) thesisSchool.before(languageBadge);
    else thesisCard.prepend(languageBadge);
  }

  // Also replace an older plain “(in French)” label if one is still present.
  const walker = document.createTreeWalker(thesisCard, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    if (!/\(?in french\)?/i.test(node.nodeValue ?? "")) return;

    const existingBadge = thesisCard.querySelector(".thesis-language-badge");
    if (existingBadge) {
      node.nodeValue = (node.nodeValue ?? "").replace(/\(?in french\)?/i, "");
      return;
    }

    const badge = document.createElement("span");
    badge.className = "thesis-language-badge";
    badge.lang = "fr";
    badge.dataset.en = "FRENCH-LANGUAGE WORK";
    badge.dataset.fr = "TRAVAIL EN FRANÇAIS";
    badge.textContent =
      document.documentElement.lang === "fr"
        ? badge.dataset.fr
        : badge.dataset.en;

    const before = document.createTextNode(
      (node.nodeValue ?? "").replace(/\(?in french\)?/i, ""),
    );
    node.parentNode?.replaceChild(badge, node);
    badge.before(before);
  });

  if (!thesisCard.querySelector(".thesis-oral-link")) {
    const oralLink = document.createElement("a");
    oralLink.className = "thesis-resource thesis-oral-link";
    oralLink.href = "assets/OralMAT4000.pdf";
    oralLink.target = "_blank";
    oralLink.rel = "noopener noreferrer";
    oralLink.dataset.en = "ORAL DEFENSE SLIDES ↗";
    oralLink.dataset.fr = "DIAPOSITIVES DE SOUTENANCE ↗";
    oralLink.textContent =
      document.documentElement.lang === "fr"
        ? oralLink.dataset.fr
        : oralLink.dataset.en;
    oralLink.setAttribute("aria-label", "Open oral defense slides PDF");

    const existingPdfLink = thesisCard.querySelector("a[href$='.pdf']");
    let resources = thesisCard.querySelector(".thesis-resources");

    if (!resources) {
      resources = document.createElement("div");
      resources.className = "thesis-resources";

      if (existingPdfLink && existingPdfLink.parentElement) {
        existingPdfLink.classList.add("thesis-resource", "thesis-written-link");
        existingPdfLink.dataset.en = "WRITTEN THESIS ↗";
        existingPdfLink.dataset.fr = "MÉMOIRE ÉCRIT ↗";
        existingPdfLink.textContent =
          document.documentElement.lang === "fr"
            ? existingPdfLink.dataset.fr
            : existingPdfLink.dataset.en;
        existingPdfLink.parentElement.insertBefore(resources, existingPdfLink);
        resources.append(existingPdfLink);
      } else {
        thesisCard.append(resources);
      }
    }

    resources.append(oralLink);
  }

  if (!document.querySelector("#thesis-resource-styles")) {
    const style = document.createElement("style");
    style.id = "thesis-resource-styles";
    style.textContent = `
      .thesis-language-badge {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        margin-left: 10px;
        padding: 4px 8px;
        border: 1px solid rgba(105, 234, 214, 0.3);
        border-radius: 999px;
        color: var(--cyan);
        font: 500 8px var(--mono);
        letter-spacing: 0.1em;
        line-height: 1;
        vertical-align: middle;
      }

      .thesis-resources {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        width: 100%;
        margin-top: 24px;
      }

      .thesis-resource,
      .thesis-resource:link,
      .thesis-resource:visited {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 52px;
        padding: 14px 16px;
        border: 1px solid rgba(105, 234, 214, 0.28);
        border-radius: 14px;
        color: var(--acid);
        -webkit-text-fill-color: var(--acid);
        font: 500 9px var(--mono);
        letter-spacing: 0.1em;
        text-decoration: none;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
      }

      .thesis-resource:hover {
        transform: translateY(-2px);
        border-color: var(--cyan);
        background: rgba(105, 234, 214, 0.08);
      }

      .thesis-resource:focus-visible {
        outline: 2px solid var(--acid);
        outline-offset: 4px;
      }

      @media (max-width: 620px) {
        .thesis-resources {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.append(style);
  }
})();
