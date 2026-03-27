fetch('assets/ascii-art.txt')
  .then(r => r.text())
  .then(text => {
    const rawLines = text.split('\n');
    const first = rawLines.findIndex(l => l.trim() !== '');
    const last = rawLines.length - 1 - [...rawLines].reverse().findIndex(l => l.trim() !== '');
    const lines = rawLines.slice(first, last + 1).map(l => l.trimEnd());
    const minIndent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^\s*/)[0].length));
    const stripped = lines.map(l => l.slice(minIndent));
    const rows = stripped.length;
    const cols = Math.max(...stripped.map(l => l.length));

    const box = document.querySelector('.ascii-photo');

    const probe = document.createElement('pre');
    probe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;visibility:hidden;font-family:"JetBrains Mono",monospace;font-size:10px;line-height:1;white-space:pre;margin:0;padding:0;';
    probe.textContent = stripped.join('\n');
    document.body.appendChild(probe);
    const preW = probe.scrollWidth;
    const preH = probe.scrollHeight;
    document.body.removeChild(probe);

    const scale = Math.min(box.offsetWidth / preW, box.offsetHeight / preH);
    const charW = (preW / cols) * scale;
    const lineH = (preH / rows) * scale;
    const ox = (box.offsetWidth - preW * scale) / 2;
    const oy = (box.offsetHeight - preH * scale) / 2;
    const fontSize = 10 * scale;

    const rect = box.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const particles = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < stripped[r].length; c++) {
        const ch = stripped[r][c];
        if (ch === ' ') continue;
        // bottom row starts at 0, top row starts at 0.3 — each row travels for 0.7 of total
        const delay = (1 - r / (rows - 1)) * 0.3;
        particles.push({
          char: ch,
          // document-relative targets so scroll doesn't misplace them
          dtx: rect.left + window.scrollX + ox + c * charW,
          dty: rect.top + window.scrollY + oy + r * lineH,
          sx: Math.random() * vw,
          sy: Math.random() * vh,
          delay,
        });
      }
    }

    const dpr = window.devicePixelRatio || 1;

    // Full-viewport fixed canvas so particles aren't clipped by the box
    const canvas = document.createElement('canvas');
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    canvas.style.cssText = `position:fixed;top:0;left:0;width:${vw}px;height:${vh}px;pointer-events:none;z-index:50;`;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.textBaseline = 'top';

    const DURATION = 2400;
    const t0 = performance.now();
    function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; }

    function draw(now) {
      const t = Math.min((now - t0) / DURATION, 1);
      ctx.clearRect(0, 0, vw, vh);
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#fff';
      const scrollX = window.scrollX, scrollY = window.scrollY;
      for (const p of particles) {
        const le = easeInOut(Math.max(0, Math.min(1, (t - p.delay) / 0.7)));
        const tx = p.dtx - scrollX, ty = p.dty - scrollY;
        ctx.fillText(p.char, p.sx + (tx - p.sx) * le, p.sy + (ty - p.sy) * le);
      }
      if (t < 1) {
        requestAnimationFrame(draw);
      } else {
        canvas.remove();
        const bw = box.offsetWidth, bh = box.offsetHeight;
        const final = document.createElement('canvas');
        final.width = bw * dpr;
        final.height = bh * dpr;
        final.style.cssText = `position:absolute;top:0;left:0;width:${bw}px;height:${bh}px;display:block;`;
        box.appendChild(final);
        const fCtx = final.getContext('2d');
        fCtx.scale(dpr, dpr);
        fCtx.textBaseline = 'top';
        fCtx.font = `${fontSize}px "JetBrains Mono", monospace`;
        fCtx.fillStyle = '#fff';
        const finalRect = box.getBoundingClientRect();
        const fsX = window.scrollX, fsY = window.scrollY;
        for (const p of particles) {
          fCtx.fillText(p.char, p.dtx - fsX - finalRect.left, p.dty - fsY - finalRect.top);
        }
      }
    }
    requestAnimationFrame(draw);
  });

// Grid background
(function () {
  const canvas = document.getElementById('grid-bg');
  const ctx = canvas.getContext('2d');
  const CELL = 12;
  const RADIUS = 3;
  const MAX_OPACITY = 0.4;

  const FADE = 0.96;
  const FADE_OUT = 0.95;
  let cols, rows;
  let mouseX = -1000, mouseY = -1000;
  const cells = new Map(); // "c,r" → { c, r, opacity }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(window.innerWidth / CELL) + 1;
    rows = Math.ceil(window.innerHeight / CELL) + 1;
  }

  function getCellTargets(cx, cy) {
    const map = new Map();
    const range = Math.ceil(RADIUS);
    for (let dr = -range; dr <= range; dr++) {
      for (let dc = -range; dc <= range; dc++) {
        const c = Math.floor(cx) + dc;
        const r = Math.floor(cy) + dr;
        if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
        const dist = Math.sqrt((c + 0.5 - cx) ** 2 + (r + 0.5 - cy) ** 2);
        if (dist >= RADIUS) continue;
        map.set(`${c},${r}`, { c, r, opacity: MAX_OPACITY * (1 - dist / RADIUS) ** 2 });
      }
    }
    return map;
  }

  function draw() {
    const targets = getCellTargets(mouseX / CELL, mouseY / CELL);

    // Only raise opacity, never lower it — lets cells fade from peak brightness
    for (const [key, cell] of targets) {
      if (!cells.has(key) || cells.get(key).opacity < cell.opacity)
        cells.set(key, cell);
    }

    const fadeRate = mouseX >= 0 ? FADE : FADE_OUT;
    for (const [key, cell] of cells) {
      if (!targets.has(key)) {
        cell.opacity *= fadeRate;
        if (cell.opacity < 0.003) cells.delete(key);
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const [, { c, r, opacity }] of cells) {
      ctx.fillStyle = `rgba(255,255,255,${opacity})`;
      ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function resetMouse() { mouseX = -1000; mouseY = -1000; }
  window.addEventListener('mouseleave', resetMouse);
  document.documentElement.addEventListener('mouseleave', resetMouse);

  window.addEventListener('touchmove', e => {
    const t = e.touches[0];
    mouseX = t.clientX;
    mouseY = t.clientY;
  }, { passive: true });

  window.addEventListener('touchend', () => {
    mouseX = -1000; mouseY = -1000;
  });

  window.addEventListener('resize', resize);

  resize();
  requestAnimationFrame(draw);
})();

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&./+-';

function scramble(el, targetOverride, fast = false) {
  const target = targetOverride !== undefined ? targetOverride : el.dataset.text;
  if (!target) return;
  const ipc = fast ? 2 : 6;   // iterations per char
  const ms = fast ? 26 : 40; // interval ms
  let iteration = 0;
  const total = target.length * ipc;
  clearInterval(el._scrambleInterval);

  el._scrambleInterval = setInterval(() => {
    el.textContent = target
      .split('')
      .map((char, i) => {
        if (iteration / ipc > i) return char;
        if (char === ' ' || char === '↗') return char;
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      })
      .join('');

    if (iteration >= total) { clearInterval(el._scrambleInterval); el.textContent = target; }
    iteration++;
  }, ms);
}

document.querySelectorAll('.scramble').forEach((el, i) => {
  setTimeout(() => scramble(el), i * 120);
});

const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav nav');

hamburger.addEventListener('click', () => {
  navMenu.classList.toggle('open');
});

document.querySelectorAll('.nav a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    navMenu.classList.remove('open');
    document.querySelector(this.getAttribute("href"))
      .scrollIntoView({ behavior: "smooth" });
  });
});

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav a[href^="#"]');

function setActive(link, skipScramble = false) {
  navLinks.forEach(a => {
    a.classList.remove('active');
    clearInterval(a._scrambleInterval);
    a.textContent = a.dataset.text;
  });
  if (link) {
    link.classList.add('active');
    const activeText = link.dataset.text.replace(']', '*]');
    if (!skipScramble) scramble(link, activeText, true);
    else link.textContent = activeText;
  }
}

setActive(document.querySelector('.nav a[href="#home"]'));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const link = document.querySelector(`.nav a[href="#${entry.target.id}"]`);
      setActive(link);
      const h2 = entry.target.querySelector('h2[data-text]');
      if (h2) scramble(h2, undefined, true);
    }
  });
}, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

sections.forEach(s => observer.observe(s));
