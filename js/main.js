
// Projects: character scramble on scroll-in
(function () {
  const rows = document.querySelectorAll('.project-row');
  if (!rows.length) return;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?#%&*';

  function scramble(el, final, delay) {
    const len = final.length;
    let frame = 0;
    const resolve = len * 2;
    setTimeout(() => {
      const iv = setInterval(() => {
        let out = '';
        const done = Math.floor(frame / 2);
        for (let i = 0; i < len; i++) {
          if (final[i] === ' ') { out += ' '; continue; }
          out += i < done ? final[i] : chars[Math.floor(Math.random() * chars.length)];
        }
        el.textContent = out;
        if (++frame > resolve + 2) { el.textContent = final; clearInterval(iv); }
      }, 20);
    }, delay);
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    rows.forEach((row, i) => {
      const nameEl = row.querySelector('.project-name');
      if (nameEl) scramble(nameEl, nameEl.textContent.trim(), i * 140);
    });
    observer.disconnect();
  }, { threshold: 0.15 });

  const section = document.getElementById('projects');
  if (section) observer.observe(section);
}());

// Airport-style real-time clock in NOW section
(function () {
  const el = document.getElementById('now-clock');
  if (!el) return;

  const digits = '0123456789';
  function pad(n) { return String(n).padStart(2, '0'); }

  function getSegments() {
    const d = new Date();
    return [
      String(d.getFullYear()),
      pad(d.getMonth() + 1),
      pad(d.getDate()),
      pad(d.getHours()),
      pad(d.getMinutes()),
      pad(d.getSeconds()),
    ];
  }

  // Build DOM: year · month · day · HH:MM:SS
  const seps = [' · ', ' · ', ' · ', ':', ':'];
  const segLengths = [4, 2, 2, 2, 2, 2];
  let digitSpans = [[], [], [], [], [], []];

  segLengths.forEach((len, si) => {
    for (let i = 0; i < len; i++) {
      const s = document.createElement('span');
      s.className = 'clock-digit';
      s.textContent = '0';
      el.appendChild(s);
      digitSpans[si].push(s);
    }
    if (si < seps.length) {
      const sep = document.createElement('span');
      sep.className = 'clock-sep';
      sep.textContent = seps[si];
      el.appendChild(sep);
    }
  });

  function flip(span, target) {
    let step = 0;
    const iv = setInterval(() => {
      span.textContent = digits[Math.floor(Math.random() * 10)];
      if (++step >= 5) { span.textContent = target; clearInterval(iv); }
    }, 28);
  }

  function update() {
    const segs = getSegments();
    segs.forEach((val, si) => {
      Array.from(val).forEach((ch, ci) => {
        const span = digitSpans[si][ci];
        if (span && span.textContent !== ch) flip(span, ch);
      });
    });
  }

  update();
  setInterval(update, 1000);
}());

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    }
  });
}, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

sections.forEach(s => observer.observe(s));

// Connect is at the page bottom — activate it when scrolled near the end
window.addEventListener('scroll', () => {
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80) {
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#connect');
    });
  }
}, { passive: true });

// Fade-in on scroll
const fadeEls = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

fadeEls.forEach(el => fadeObserver.observe(el));

// Pixel trail on hero
(function () {
  const hero = document.getElementById('hero');
  const nameLines = hero && hero.querySelectorAll('.name-cap, .name-rest');
  if (!hero || !nameLines.length) return;

  const PX = 14;
  let gridEl = null, cells = [], cols = 0, rows = 0;
  let lastC = -1, lastR = -1;
  let exRect = null;

  function build() {
    if (gridEl) gridEl.remove();
    gridEl = document.createElement('div');
    gridEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:4;overflow:hidden;';
    hero.appendChild(gridEl);

    cols = Math.ceil(hero.offsetWidth / PX);
    rows = Math.ceil(hero.offsetHeight / PX) + 1;
    cells = [];

    for (let r = 0; r < rows; r++) {
      cells[r] = [];
      for (let c = 0; c < cols; c++) {
        const el = document.createElement('div');
        el.style.cssText = `position:absolute;left:${c * PX}px;top:${r * PX}px;width:${PX}px;height:${PX}px;opacity:0;background:rgb(245,245,245);`;
        gridEl.appendChild(el);
        cells[r][c] = el;
      }
    }

    exRect = null;
    lastC = lastR = -1;
  }

  function getExclusions() {
    if (exRect) return exRect;
    const hr = hero.getBoundingClientRect();
    const pad = Math.round(PX / 2);
    exRect = Array.from(nameLines).map(line => {
      const nr = line.getBoundingClientRect();
      return {
        c1: Math.floor((nr.left  - hr.left - pad) / PX),
        r1: Math.floor((nr.top   - hr.top  - pad) / PX),
        c2: Math.ceil( (nr.right - hr.left + pad) / PX),
        r2: Math.ceil( (nr.bottom - hr.top + pad) / PX),
      };
    });
    return exRect;
  }

  function activate(c, r) {
    if (c < 0 || r < 0 || c >= cols || r >= rows) return;
    const zones = getExclusions();
    const inZone = zones.some(ex => c >= ex.c1 && c < ex.c2 && r >= ex.r1 && r < ex.r2);
    const el = cells[r][c];
    el.style.transition = 'none';
    el.style.background = inZone ? 'rgba(245,245,245,0.18)' : 'rgb(245,245,245)';
    el.style.opacity = '1';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 2s ease';
      el.style.opacity = '0';
    });
  }

  build();
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 200); });

  function plotLine(c0, r0, c1, r1) {
    const dc = Math.abs(c1 - c0), dr = Math.abs(r1 - r0);
    const sc = c0 < c1 ? 1 : -1, sr = r0 < r1 ? 1 : -1;
    let err = dc - dr, c = c0, r = r0;
    while (true) {
      activate(c, r);
      if (c === c1 && r === r1) break;
      const e2 = 2 * err;
      if (e2 > -dr) { err -= dr; c += sc; }
      if (e2 <  dc) { err += dc; r += sr; }
    }
  }

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const c = Math.floor((e.clientX - rect.left) / PX);
    const r = Math.floor((e.clientY - rect.top)  / PX);
    if (c === lastC && r === lastR) return;
    if (lastC === -1) { activate(c, r); }
    else { plotLine(lastC, lastR, c, r); }
    lastC = c; lastR = r;
  });

  hero.addEventListener('mouseleave', () => { lastC = lastR = -1; exRect = null; });

}());

// Nav logo: cycles English → Korean → Chinese on click, glitches on English
(function () {
  const logo = document.querySelector('.logo-text');
  if (!logo) return;

  const names = ['TAEHYUN', '임태현', '任泰炫'];
  let nameIdx = 0;
  let revertTimer = null;

  const alikes = {
    T: ['⊤', 'τ', '†', 'T'],
    A: ['Λ', '∧', '4', 'A'],
    E: ['∃', 'Ξ', '3', 'E'],
    H: ['Η', 'ℍ', '#', 'H'],
    Y: ['γ', 'Ψ', '¥', 'Y'],
    U: ['∪', 'υ', 'Ü', 'U'],
    N: ['И', 'ℕ', 'η', 'N'],
  };

  function glitchFrame() {
    const chars = 'TAEHYUN'.split('').map(ch => {
      if (Math.random() < 0.25) {
        const opts = alikes[ch];
        return opts[Math.floor(Math.random() * opts.length)];
      }
      return ch;
    });
    logo.textContent = chars.join('');
  }

  function restore() {
    logo.textContent = names[nameIdx];
  }

  function runGlitch(frames) {
    let i = 0;
    const interval = setInterval(() => {
      if (i % 2 === 0) glitchFrame(); else restore();
      i++;
      if (i >= frames * 2) { clearInterval(interval); restore(); }
    }, 60);
  }

  function flipTo(idx) {
    if (revertTimer) { clearTimeout(revertTimer); revertTimer = null; }
    nameIdx = idx;
    let f = 0;
    const iv = setInterval(() => {
      logo.style.opacity = f % 2 === 0 ? '0.15' : '1';
      f++;
      if (f >= 6) { clearInterval(iv); logo.style.opacity = '1'; logo.textContent = names[nameIdx]; }
    }, 50);
  }

  function switchName() {
    const next = (nameIdx + 1) % names.length;
    flipTo(next);
    if (next !== 0) revertTimer = setTimeout(() => flipTo(0), 3000);
  }

  function scheduleGlitch() {
    const delay = 3000 + Math.random() * 5000;
    setTimeout(() => {
      if (nameIdx === 0) runGlitch(3 + Math.floor(Math.random() * 3));
      scheduleGlitch();
    }, delay);
  }

  document.querySelector('.nav-logo').addEventListener('click', switchName);

  scheduleGlitch();
}());

// Quote section: scroll-driven images + text reveal
(function () {
  const section = document.getElementById('quote');
  const textEl  = document.getElementById('quote-text');
  if (!section || !textEl) return;

  // — text setup —
  const words = textEl.textContent.trim().split(/\s+/);
  textEl.innerHTML = words.map(w => `<span class="quote-word">${w}</span>`).join(' ');
  const spans = Array.from(textEl.querySelectorAll('.quote-word'));
  const total = spans.length;
  spans.forEach(s => { s.style.color = '#333'; });

  // — image refs —
  const imgLeft  = section.querySelector('.quote-img-left');
  const imgRight = section.querySelector('.quote-img-right');

  function update() {
    const sectionTop = section.offsetTop;
    const scrollable = section.offsetHeight - window.innerHeight;
    const progress = Math.max(0, Math.min(1, (window.scrollY - sectionTop) / scrollable));
    const vw = window.innerWidth;

    // phase 1 (0 → 0.25): images slide in from sides
    const inP  = Math.max(0, Math.min(1, progress / 0.25));
    // phase 3 (0.75 → 1.0): images slide back out to sides
    const outP = Math.max(0, Math.min(1, (progress - 0.75) / 0.25));

    const opacity = Math.min(inP, 1 - outP);
    const leftX   = inP < 1 ? -vw * (1 - inP) : -vw * outP;
    const rightX  = inP < 1 ?  vw * (1 - inP) :  vw * outP;

    if (imgLeft)  { imgLeft.style.opacity  = opacity; imgLeft.style.transform  = `translateX(${leftX}px)`; }
    if (imgRight) { imgRight.style.opacity = opacity; imgRight.style.transform = `translateX(${rightX}px)`; }

    // phase 2 (0.25 → 0.75): word-by-word reveal
    const textProgress = Math.max(0, Math.min(1, (progress - 0.25) / 0.50));
    spans.forEach((span, i) => {
      const start = (i / (total - 1)) * 0.96;
      const end   = start + 0.04;
      const p = Math.max(0, Math.min(1, (textProgress - start) / (end - start)));
      const v = Math.round(51 + p * 204);
      span.style.color = `rgb(${v},${v},${v})`;
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}());

// Tagline flicker with lookalike character swaps
(function () {
  const el = document.querySelector('.hero-tagline');
  if (!el) return;

  const original = 'undefined but not unreachable';
  const alikes = {
    u: ['υ', '∪', 'µ', 'u'],
    n: ['η', 'И', 'ℕ', 'n'],
    d: ['∂', 'δ', 'd'],
    e: ['∃', 'ε', '3', 'e'],
    f: ['ƒ', 'f'],
    i: ['ı', '!', 'i'],
    b: ['β', '6', 'b'],
    t: ['τ', '†', 't'],
    o: ['ο', '0', 'ø', 'o'],
    r: ['ρ', 'г', 'r'],
    a: ['α', '∂', 'a'],
    c: ['ς', 'c'],
    h: ['ℏ', 'h'],
    l: ['1', '|', 'l'],
  };

  function glitchFrame() {
    const chars = original.split('').map(ch => {
      if (Math.random() < 0.2 && alikes[ch]) {
        const opts = alikes[ch];
        return opts[Math.floor(Math.random() * opts.length)];
      }
      return ch;
    });
    el.textContent = chars.join('');
  }

  function restore() { el.textContent = original; }

  function runGlitch(frames) {
    let i = 0;
    const iv = setInterval(() => {
      if (i % 2 === 0) glitchFrame(); else restore();
      i++;
      if (i >= frames * 2) { clearInterval(iv); restore(); }
    }, 65);
  }

  function scheduleGlitch() {
    const delay = 6000 + Math.random() * 8000;
    setTimeout(() => { runGlitch(4 + Math.floor(Math.random() * 4)); scheduleGlitch(); }, delay);
  }

  el.addEventListener('mouseenter', () => runGlitch(8));

  scheduleGlitch();
}());

// Conway's Game of Life — patterns embedded in the page, scroll with content
(function () {
  const CELL    = 8;
  const STEP_MS = 350;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;pointer-events:none;z-index:2;mix-blend-mode:difference;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const cols = () => Math.floor(canvas.width  / CELL);
  const rows = () => Math.floor(canvas.height / CELL);

  const BLOCK   = [[0,0],[1,0],[0,1],[1,1]];
  const BEEHIVE = [[1,0],[2,0],[0,1],[3,1],[1,2],[2,2]];
  const LOAF    = [[1,0],[2,0],[0,1],[3,1],[1,2],[3,2],[2,3]];
  const BOAT    = [[0,0],[1,0],[0,1],[2,1],[1,2]];
  const TUB     = [[1,0],[0,1],[2,1],[1,2]];
  const PENTA   = [[2,0],[2,1],[1,2],[3,2],[2,3],[2,4],[2,5],[2,6],[1,7],[3,7],[2,8],[2,9]];
  const GLIDER  = [[1,0],[2,1],[0,2],[1,2],[2,2]];

  let cells = new Set();
  let stepTimer = null;

  function place(pattern, oc, or_) {
    pattern.forEach(([dc, dr]) => cells.add(`${oc + dc},${or_ + dr}`));
  }

  function init() {
    canvas.width  = window.innerWidth;
    canvas.height = document.body.scrollHeight;

    cells = new Set();
    const cc = cols(), rr = rows();
    if (cc < 30 || rr < 20) return;

    const aboutEl = document.getElementById('about');
    const startR  = aboutEl ? Math.ceil(aboutEl.offsetTop / CELL) : Math.floor(rr * 0.2);
    const span    = rr - startR - 4;

    place(BLOCK,   cc - 8,                  startR + Math.floor(span * 0.05));
    place(TUB,     Math.floor(cc * 0.12),   startR + Math.floor(span * 0.12));
    place(PENTA,   cc - 22,                 startR + Math.floor(span * 0.28));
    place(BEEHIVE, cc - 14,                 startR + Math.floor(span * 0.45));
    place(LOAF,    4,                        startR + Math.floor(span * 0.55));
    place(BOAT,    cc - 8,                  startR + Math.floor(span * 0.72));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!cells.size) return;
    ctx.fillStyle = '#fff';
    const cc = cols(), rr = rows();
    cells.forEach(k => {
      const [c, r] = k.split(',').map(Number);
      if (c >= 0 && r >= 0 && c < cc && r < rr)
        ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
    });
  }

  function nextGen() {
    const counts = new Map();
    cells.forEach(k => {
      const [c, r] = k.split(',').map(Number);
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
        if (!dc && !dr) continue;
        const nk = `${c + dc},${r + dr}`;
        counts.set(nk, (counts.get(nk) || 0) + 1);
      }
    });
    const next = new Set();
    counts.forEach((n, k) => { if (n === 3 || (n === 2 && cells.has(k))) next.add(k); });
    return next;
  }

  function step() {
    cells = nextGen();
    draw();
    stepTimer = setTimeout(step, STEP_MS);
  }

  function spawnGlider() {
    const cc = cols(), rr = rows();
    const aboutEl = document.getElementById('about');
    const startR  = aboutEl ? Math.ceil(aboutEl.offsetTop / CELL) : Math.floor(rr * 0.2);
    const fromTop = Math.random() < 0.5;
    const sc = fromTop ? Math.floor(cc / 3 + Math.random() * cc / 3) : 0;
    const sr = fromTop ? startR : startR + Math.floor(Math.random() * (rr - startR - 4));
    place(GLIDER, sc, sr);
    setTimeout(spawnGlider, 120000 + Math.random() * 180000);
  }

  // Delay init slightly so fonts/layout have settled
  setTimeout(() => {
    init();
    step();
    setTimeout(spawnGlider, 120000 + Math.random() * 180000);
  }, 200);

  window.addEventListener('resize', () => { init(); });
}());
