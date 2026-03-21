fetch('assets/ascii-art.txt')
  .then(r => r.text())
  .then(text => {
    const lines = text.split('\n');
    const first = lines.findIndex(l => l.trim() !== '');
    const last = lines.length - 1 - [...lines].reverse().findIndex(l => l.trim() !== '');
    const trimmed = lines.slice(first, last + 1).map(l => l.trimEnd());

    const minIndent = Math.min(...trimmed.filter(l => l.trim()).map(l => l.match(/^\s*/)[0].length));
    const stripped = trimmed.map(l => l.slice(minIndent));

    const pre = document.createElement('pre');
    pre.textContent = stripped.join('\n');

    const box = document.querySelector('.ascii-photo');
    box.appendChild(pre);

    const scaleX = box.offsetWidth / pre.scrollWidth;
    const scaleY = box.offsetHeight / pre.scrollHeight;
    const scale = Math.min(scaleX, scaleY);
    const scaledW = pre.scrollWidth * scale;
    const scaledH = pre.scrollHeight * scale;
    const offsetX = (box.offsetWidth - scaledW) / 2;
    const offsetY = (box.offsetHeight - scaledH) / 2;
    pre.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  });

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&./+-';

function scramble(el, targetOverride, fast = false) {
  const target = targetOverride !== undefined ? targetOverride : el.dataset.text;
  if (!target) return;
  const ipc = fast ? 2 : 6;   // iterations per char
  const ms  = fast ? 13 : 40; // interval ms
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
