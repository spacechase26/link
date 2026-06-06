const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const pn = { x: 0, y: 0 }; // normalised pointer for parallax

/* always open at the top, even on refresh / back-forward cache restore */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
addEventListener('load', () => window.scrollTo(0, 0));
addEventListener('pageshow', () => window.scrollTo(0, 0));

/* ---- config (js/config.js) with safe fallbacks ---- */
const CFG = window.CFG || {};
const LOOK = Object.assign({
  hologramSpinSeconds: 19, cometEveryMin: 85, cometEveryMax: 195,
  starBrightness: 1, redFadeSeconds: 2
}, CFG.look || {});
document.documentElement.style.setProperty('--planet-fade', LOOK.redFadeSeconds + 's');

/* fill the page text/links from config (leaves the static HTML as a no-JS fallback) */
(function renderContent() {
  try {
    const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
    const q = (s) => document.querySelector(s);
    const pad = (n) => String(n).padStart(2, '0');
    if (CFG.name) { const n = q('#name'); if (n) { n.textContent = CFG.name; n.setAttribute('aria-label', CFG.name); } }
    if (CFG.subtitle) { const s = q('.hdr .sub'); if (s) s.innerHTML = esc(CFG.subtitle).replace('//', '&nbsp;//&nbsp;'); }
    if (CFG.bio) { const b = q('.profile .bio'); if (b) b.textContent = CFG.bio; }
    if (Array.isArray(CFG.tags)) { const ul = q('.tags'); if (ul) ul.innerHTML = CFG.tags.map((t) => `<li style="--c:${esc(t.color)}">${esc(t.label)}</li>`).join(''); }
    if (Array.isArray(CFG.socials)) {
      const ch = q('.channels');
      if (ch) ch.innerHTML = `<p class="mod-head"><span>comms</span><span class="idx">[${pad(CFG.socials.length)}]</span></p>` +
        CFG.socials.map((s, i) => `<a class="ch" style="--c:${esc(s.color)}" href="${esc(s.url)}" target="_blank" rel="noopener"><span class="ch-i">${pad(i + 1)}</span><svg class="ci" aria-hidden="true"><use href="assets/icons.svg#i-${esc(s.icon)}"/></svg><span class="ch-n">${esc(s.name)}</span><span class="ch-h">${esc(s.hint)}</span><span class="ch-go">→</span></a>`).join('');
    }
    if (Array.isArray(CFG.projects)) {
      const bd = q('.builds');
      if (bd) bd.innerHTML = `<p class="mod-head"><span>payload</span><span class="idx">[${pad(CFG.projects.length)}]</span></p>` +
        CFG.projects.map((p) => `<a class="bd" style="--c:${esc(p.color)}" href="${esc(p.url)}" target="_blank" rel="noopener"><span class="sw"></span><span class="txt"><span class="bd-n">${esc(p.name)}</span><span class="bd-d">${esc(p.desc)}</span></span><span class="ch-go">→</span></a>`).join('');
    }
    if (Array.isArray(CFG.log)) {
      const lg = q('.log');
      if (lg) lg.innerHTML = '<p class="mod-head"><span>ship\'s log</span><span class="idx">recent</span></p><ul class="log-list">' +
        CFG.log.map((l) => `<li><span class="log-d">${esc(l.date)}</span><span class="log-t">${esc(l.text)}</span></li>`).join('') + '</ul>';
    }
    if (CFG.footer) {
      const f = CFG.footer, a = document.querySelectorAll('.ftr-l a');
      if (a[0] && f.githubUrl) a[0].href = f.githubUrl;
      if (a[1] && f.email) a[1].href = 'mailto:' + f.email;
      const r = q('.ftr-r'); if (r && f.tagline) r.innerHTML = esc(f.tagline) + ' <span class="tw">✦</span>';
    }
  } catch (e) { /* keep the static HTML if anything in config is malformed */ }
})();

/* ---- power-on: calibration line sweeps down once ---- */
const bootEl = document.getElementById('boot');
if (bootEl && !reduced) { bootEl.classList.add('run'); setTimeout(() => bootEl.remove(), 2800); }

/* ---- staggered reveal ---- */
if (!reduced) {
  document.querySelectorAll('.hdr, .row2, .systems, .channels, .builds, .log, .ftr').forEach((el, i) => {
    el.style.animationDelay = (i * 0.12) + 's';
  });
}

/* ---- pointer: cursor light + parallax ---- */
const spot = document.getElementById('spot');
const galaxyEl = document.querySelector('.galaxy');
// galaxy red-hover works even with "reduce motion" on (it's an interaction, not ambient motion);
// the cursor light + starfield parallax stay gated behind !reduced
if (fine) {
  let raf = 0, mx = 0, my = 0;
  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    pn.x = (mx / innerWidth) * 2 - 1; pn.y = (my / innerHeight) * 2 - 1;
    if (!raf) raf = requestAnimationFrame(() => {
      if (spot && !reduced) { spot.style.transform = `translate(${mx}px, ${my}px)`; spot.style.opacity = '1'; }
      // hovering the galaxy (generous hit area) bleeds blood red across the whole scene
      if (galaxyEl) {
        const gr = galaxyEl.getBoundingClientRect(), pad = 30;
        document.body.classList.toggle('redalert', mx >= gr.left - pad && mx <= gr.right + pad && my >= gr.top - pad && my <= gr.bottom + pad);
      }
      raf = 0;
    });
  }, { passive: true });
  addEventListener('pointerleave', () => { if (spot) spot.style.opacity = '0'; document.body.classList.remove('redalert'); });
}

/* ---- starfield: layered, coloured, drifting + comets & shooting stars ---- */
const starCv = document.getElementById('stars');
const stx = starCv.getContext('2d');
const STAR_COLS = [[255,255,255],[245,249,255],[205,225,255],[178,205,255],[224,234,255],[255,236,212],[255,220,188]];
let sw, sh, sdpr, stars = [], shots = [], comets = [], nextShot = 120, nextComet = 36, lastSW = -1, lastStar = 0;
function ssize() {
  sdpr = Math.min(window.devicePixelRatio || 1, 1.5);
  sw = innerWidth; sh = innerHeight;
  starCv.width = sw * sdpr; starCv.height = sh * sdpr; starCv.style.width = sw + 'px'; starCv.style.height = sh + 'px';
  stx.setTransform(sdpr, 0, 0, sdpr, 0, 0);
  // only re-seed stars when the WIDTH changes — on phones the URL bar shows/hides (height only) and shouldn't reshuffle the sky
  if (sw !== lastSW || !stars.length) {
    lastSW = sw;
    const n = Math.min(170, Math.round((sw * sh) / 9000));
    stars = Array.from({ length: n }, () => { const z = Math.random();
      return { x: Math.random() * sw, y: Math.random() * sh, z, r: 0.45 + z * 1.8, a: (0.42 + z * 0.78) * LOOK.starBrightness,
        tw: Math.random() * 6.28, spd: 0.7 + Math.random() * 1.5, rgb: STAR_COLS[(Math.random() * STAR_COLS.length) | 0], bright: z > 0.74, hero: z > 0.9 }; });
  }
}
ssize(); addEventListener('resize', ssize);

function spawnComet() {
  // streak across the open upper sky so it isn't hidden behind the console
  // start just off the left edge so it's already bright as it enters the visible left side
  comets.push({ x: -30 - Math.random() * 40, y: sh * (0.05 + Math.random() * 0.5), vx: 0.8 + Math.random() * 0.8, vy: 0.25 + Math.random() * 0.5,
    life: 0, max: 620 + Math.random() * 420, len: 230 + Math.random() * 190, r: 1.8 + Math.random() * 1.6 });
}

function starLoop(t) {
  requestAnimationFrame(starLoop);
  if (t - lastStar < 28) return;   // cap to ~35fps — the sky drifts slowly, so low-end gpus get a break
  lastStar = t;
  stx.clearRect(0, 0, sw, sh);
  // stars (with slow drift + parallax + twinkle; brightest get diffraction spikes)
  for (const s of stars) {
    s.x += 0.02 + s.z * 0.05; if (s.x > sw + 3) s.x = -3;
    const tw = 0.5 + 0.5 * Math.sin(t * 0.0016 * s.spd + s.tw);
    const px = s.x + pn.x * (5 + s.z * 22), py = s.y + pn.y * (5 + s.z * 22);
    const a = s.a * tw, c = s.rgb;
    if (s.bright) {
      stx.globalCompositeOperation = 'lighter';
      if (s.hero) {   // soft bloom via two stacked additive discs — far cheaper than a per-frame gradient
        stx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a * 0.14})`;
        stx.beginPath(); stx.arc(px, py, s.r * 5, 0, 6.2832); stx.fill();
        stx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a * 0.2})`;
        stx.beginPath(); stx.arc(px, py, s.r * 2.6, 0, 6.2832); stx.fill();
      }
      const L = s.r * (5 + tw * 4.5);
      stx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a * 0.78})`; stx.lineWidth = 0.9;
      stx.beginPath(); stx.moveTo(px - L, py); stx.lineTo(px + L, py); stx.moveTo(px, py - L); stx.lineTo(px, py + L); stx.stroke();
      if (s.hero) {   // faint diagonal sparkle -> 8-point twinkle
        const D = L * 0.5;
        stx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a * 0.34})`; stx.lineWidth = 0.7;
        stx.beginPath(); stx.moveTo(px - D, py - D); stx.lineTo(px + D, py + D); stx.moveTo(px - D, py + D); stx.lineTo(px + D, py - D); stx.stroke();
      }
      stx.globalCompositeOperation = 'source-over';
    }
    stx.globalAlpha = a; stx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
    stx.beginPath(); stx.arc(px, py, s.r, 0, 6.2832); stx.fill();
  }
  stx.globalAlpha = 1; stx.globalCompositeOperation = 'lighter'; stx.lineCap = 'round';

  // comets — glowing head + long fading tail, gliding slowly
  if (fine && innerWidth > 720 && --nextComet <= 0) { nextComet = LOOK.cometEveryMin + Math.floor(Math.random() * Math.max(1, LOOK.cometEveryMax - LOOK.cometEveryMin)); spawnComet(); }
  for (let i = comets.length - 1; i >= 0; i--) {
    const c = comets[i]; c.x += c.vx; c.y += c.vy; c.life++;
    const f = Math.min(1, c.life / 14) * Math.min(1, (c.max - c.life) / 80);
    if (c.life > c.max || c.x > sw + 120 || c.y > sh + 120) { comets.splice(i, 1); continue; }
    const h = Math.hypot(c.vx, c.vy), ux = c.vx / h, uy = c.vy / h, nx = -uy, ny = ux;
    const ex = c.x - ux * c.len, ey = c.y - uy * c.len, wdt = c.r * 3.2;
    // broad, soft dust tail (cool white, fans out behind the head)
    const dg = stx.createLinearGradient(c.x, c.y, ex, ey);
    dg.addColorStop(0, `rgba(226,238,255,${0.62 * f})`); dg.addColorStop(1, 'rgba(180,210,255,0)');
    stx.fillStyle = dg; stx.beginPath();
    stx.moveTo(c.x + nx * c.r, c.y + ny * c.r); stx.lineTo(ex + nx * wdt, ey + ny * wdt);
    stx.lineTo(ex - nx * wdt, ey - ny * wdt); stx.lineTo(c.x - nx * c.r, c.y - ny * c.r); stx.closePath(); stx.fill();
    // thin, straight ion tail (blue, slightly longer)
    const ix = c.x - ux * c.len * 1.28, iy = c.y - uy * c.len * 1.28;
    const ig = stx.createLinearGradient(c.x, c.y, ix, iy);
    ig.addColorStop(0, `rgba(160,206,255,${0.95 * f})`); ig.addColorStop(1, 'rgba(120,170,255,0)');
    stx.strokeStyle = ig; stx.lineWidth = 1.4; stx.beginPath(); stx.moveTo(c.x, c.y); stx.lineTo(ix, iy); stx.stroke();
    // bright coma (head glow)
    const hg = stx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 6.5);
    hg.addColorStop(0, `rgba(246,251,255,${f})`); hg.addColorStop(0.38, `rgba(195,222,255,${0.5 * f})`); hg.addColorStop(1, 'rgba(170,205,255,0)');
    stx.fillStyle = hg; stx.beginPath(); stx.arc(c.x, c.y, c.r * 6.5, 0, 6.2832); stx.fill();
  }

  // shooting stars — fast, rare
  if (--nextShot <= 0) {
    nextShot = 240 + Math.floor(Math.random() * 320);
    shots.push({ x: Math.random() * sw * 0.7, y: Math.random() * sh * 0.4, vx: 7 + Math.random() * 5, vy: 2.6 + Math.random() * 2.8, life: 0, max: 56 + Math.random() * 24, len: 90 + Math.random() * 80 });
  }
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]; s.x += s.vx; s.y += s.vy; s.life++;
    const f = 1 - s.life / s.max;
    if (f <= 0 || s.x > sw + 120) { shots.splice(i, 1); continue; }
    const h = Math.hypot(s.vx, s.vy), tx = s.x - s.vx / h * s.len, ty = s.y - s.vy / h * s.len;
    const g = stx.createLinearGradient(s.x, s.y, tx, ty);
    g.addColorStop(0, `rgba(255,228,185,${0.85 * f})`); g.addColorStop(1, 'rgba(255,228,185,0)');
    stx.strokeStyle = g; stx.lineWidth = 1.6; stx.beginPath(); stx.moveTo(s.x, s.y); stx.lineTo(tx, ty); stx.stroke();
  }
  stx.globalCompositeOperation = 'source-over'; stx.globalAlpha = 1;
}
if (!reduced) requestAnimationFrame(starLoop);
else { stx.clearRect(0, 0, sw, sh); for (const s of stars) { const c = s.rgb; stx.globalAlpha = s.a; stx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; stx.beginPath(); stx.arc(s.x, s.y, s.r, 0, 6.2832); stx.fill(); } }

/* ---- live readouts: earth time, status, SOL ---- */
const clockEl = document.getElementById('clock');
const timeEl = document.getElementById('time2');
const moodEl = document.getElementById('mood');
const solEl = document.getElementById('sol');
const velEl = document.getElementById('vel');
const distEl = document.getElementById('dist');
const LAUNCH = Date.UTC(2023, 0, 1); // mission epoch
const C_KMS = 299792.458;            // speed of light · km/s
const CRUISE = 0.92;                 // cruise velocity · fraction of c (relativistic)
let dist = 12420000000;              // km from earth, climbing
function tick() {
  let full, short, hr;
  try {
    full  = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
    short = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }).toLowerCase();
    hr    = +new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }).slice(0, 2);
  } catch (e) { return; }
  if (clockEl) clockEl.textContent = `${short} ist`;
  if (timeEl) timeEl.textContent = full;
  let mood = 'night owl hours';
  if (hr >= 2 && hr < 6)  mood = 'cryo-sleep';
  else if (hr >= 6 && hr < 12)  mood = 'caffeinating';
  else if (hr >= 12 && hr < 17) mood = 'heads-down';
  else if (hr >= 17 && hr < 21) mood = 'golden hour';
  if (moodEl) moodEl.textContent = mood;
  if (solEl) solEl.textContent = String(Math.floor((Date.now() - LAUNCH) / 86400000));
  if (velEl) velEl.textContent = (CRUISE + (Math.random() - 0.5) * 0.0006).toFixed(4) + ' c';
  if (distEl) { dist += CRUISE * C_KMS + (Math.random() - 0.5) * 800; distEl.textContent = Math.floor(dist).toLocaleString('en-US') + ' km'; }
}

/* boot: readouts scramble then lock in */
if (!reduced) {
  const G = '0123456789:abcdefghijklmnopqrstuvwxyz';
  const targets = [clockEl, timeEl, moodEl, solEl, velEl, distEl].filter(Boolean);
  const lens = targets.map((t) => (t.textContent || '').length || 6);
  let f = 0;
  const bi = setInterval(() => {
    f++;
    targets.forEach((t, i) => { let s = ''; for (let k = 0; k < lens[i]; k++) s += G[(Math.random() * G.length) | 0]; t.textContent = s; });
    if (f > 20) { clearInterval(bi); tick(); }
  }, 55);
} else { tick(); }
setInterval(tick, 1000);

/* ---- live "signal" waveform: glowing oscilloscope trace + scrolling grid ---- */
const sc = document.getElementById('spark');
if (sc && !reduced) {
  const sx = sc.getContext('2d');
  const dprS = Math.min(window.devicePixelRatio || 1, 1.5);
  const cw = 104, ch = 22;
  sc.width = cw * dprS; sc.height = ch * dprS; sx.scale(dprS, dprS);
  const GRN = '#5fe0a0';
  const N = 60, data = Array.from({ length: N }, () => 0.5);
  let ph = 0, grid = 0, fr = 0, sparkRaf = 0, sparkVis = true;
  const clamp = (v) => v < 0.08 ? 0.08 : v > 0.92 ? 0.92 : v;
  // the fill gradient never changes — build it once instead of allocating one every frame
  const fillGrad = sx.createLinearGradient(0, 0, 0, ch);
  fillGrad.addColorStop(0, 'rgba(95,224,160,.32)'); fillGrad.addColorStop(1, 'rgba(95,224,160,0)');
  function draw() {
    sparkRaf = sparkVis ? requestAnimationFrame(draw) : 0;
    if (!sparkVis) return;
    // advance the trace every 3rd frame for a calm, slow scroll
    if (fr++ % 3 === 0) {
      ph += 0.11; grid = (grid + 0.7) % 12;
      data.shift();
      // breathing carrier + harmonics, with the occasional transmission blip
      const blip = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.55 : 0;
      data.push(clamp(0.5 + 0.24 * Math.sin(ph) + 0.09 * Math.sin(ph * 2.7 + 1) + blip + (Math.random() - 0.5) * 0.05));
    }
    sx.clearRect(0, 0, cw, ch);

    // faint scrolling baseline grid
    sx.strokeStyle = 'rgba(95,224,160,.12)'; sx.lineWidth = 1;
    for (let x = -grid; x < cw; x += 12) { sx.beginPath(); sx.moveTo(x, 0); sx.lineTo(x, ch); sx.stroke(); }
    sx.beginPath(); sx.moveTo(0, ch / 2); sx.lineTo(cw, ch / 2); sx.stroke();

    const pts = [];
    for (let i = 0; i < N; i++) pts.push([(i / (N - 1)) * cw, ch - data[i] * ch]);

    // filled area under the trace
    sx.beginPath(); sx.moveTo(0, ch);
    for (const p of pts) sx.lineTo(p[0], p[1]);
    sx.lineTo(cw, ch); sx.closePath();
    sx.fillStyle = fillGrad; sx.fill();

    // trace (no canvas shadowBlur — it's a costly per-stroke effect on weak gpus)
    sx.beginPath();
    for (let i = 0; i < pts.length; i++) i ? sx.lineTo(pts[i][0], pts[i][1]) : sx.moveTo(pts[i][0], pts[i][1]);
    sx.strokeStyle = GRN; sx.lineWidth = 1.4; sx.lineJoin = 'round'; sx.lineCap = 'round'; sx.stroke();

    // leading scan dot
    const last = pts[pts.length - 1];
    sx.beginPath(); sx.arc(last[0] - 0.6, last[1], 1.7, 0, 6.2832);
    sx.fillStyle = '#c8ffe6'; sx.fill();
  }
  // stop drawing the scope entirely while it's scrolled out of view
  new IntersectionObserver((es) => { sparkVis = es[0].isIntersecting; if (sparkVis && !sparkRaf) sparkRaf = requestAnimationFrame(draw); }, { rootMargin: '80px' }).observe(sc);
  sparkRaf = requestAnimationFrame(draw);
}

/* ---- split wordmark into letters (hover wave) ---- */
const name = document.getElementById('name');
if (name) {
  const txt = name.textContent;
  name.textContent = '';
  [...txt].forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch; s.style.setProperty('--i', i);
    name.appendChild(s);
  });
  // wave ripples on load and once per hover — always plays through to the end, even if the cursor leaves mid-run
  if (!reduced) {
    let waving = false;
    const total = 800 + 60 * txt.length + 120;
    const runWave = () => {
      if (waving) return;
      waving = true; name.classList.add('wave');
      setTimeout(() => { name.classList.remove('wave'); waving = false; }, total);
    };
    name.addEventListener('mouseenter', runWave);
    setTimeout(runWave, 750); // greet on load / refresh as the header settles in
  }
}

/* ---- hidden konami easter egg → meteor shower ---- */
const cv = document.getElementById('sparkles');
const ctx = cv.getContext('2d');
const COLORS = ['#ffffff', '#ffc16b', '#ff9a5a', '#cfe0ff', '#5fe0a0'];
let w, h, dpr, parts = [], running = false;
function csize() {
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  w = innerWidth; h = innerHeight;
  cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
csize(); addEventListener('resize', csize);
function starShape(r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (Math.PI / 4) * i, rad = i % 2 ? r * 0.34 : r; const px = Math.cos(a) * rad, py = Math.sin(a) * rad; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath();
}
function shower() {
  for (let i = 0; i < 90; i++) parts.push({ x: Math.random() * w, y: -20 - Math.random() * h * 0.6,
    vx: (Math.random() - 0.5) * 1.2, vy: 2 + Math.random() * 4, g: 0.06, life: 0, max: 70 + Math.random() * 40,
    size: 3 + Math.random() * 5, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, c: COLORS[(Math.random() * COLORS.length) | 0] });
  if (!running) { running = true; requestAnimationFrame(cloop); }
}
function cloop() {
  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.rot += p.vr; p.life++;
    const f = 1 - p.life / p.max;
    if (f <= 0 || p.y > h + 40) { parts.splice(i, 1); continue; }
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = f;
    ctx.fillStyle = p.c; starShape(p.size * (0.4 + f * 0.6)); ctx.fill(); ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
  if (parts.length) requestAnimationFrame(cloop); else running = false;
}
if (!reduced) {
  const SEQ = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
  let idx = 0;
  addEventListener('keydown', (e) => {
    const k = (e.key || '').toLowerCase();
    if (k === SEQ[idx]) { if (++idx === SEQ.length) { idx = 0; shower(); } }
    else { idx = k === SEQ[0] ? 1 : 0; }
  });
}

/* ---- hidden: type "rocky" ---- */
const toastEl = document.getElementById('toast');
function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg; toastEl.classList.add('show');
  clearTimeout(toastEl._h); toastEl._h = setTimeout(() => toastEl.classList.remove('show'), 3400);
}
let buf = '';
addEventListener('keydown', (e) => {
  if (!e.key || e.key.length !== 1) return;
  buf = (buf + e.key.toLowerCase()).slice(-6);
  if (buf.includes('rocky')) { buf = ''; toast('♪ amaze ♪  ·  question? answer? good.'); }
});

/* ---- easy easter eggs (no guidebook needed) ---- */
const flareEl = document.querySelector('.flare');
// glow a body in and out WITHOUT touching its transform (so the float never snaps -> no position jump)
const pulse = (el) => {
  if (!el || !el.animate) return;
  el.animate([
    { filter: 'brightness(1) blur(.3px)' },
    { filter: 'brightness(1.7) blur(.3px) drop-shadow(0 0 18px rgba(160,220,255,.92))', offset: 0.5 },
    { filter: 'brightness(1) blur(.3px)' }
  ], { duration: 1400, easing: 'ease-in-out' });
};
// 1) click the open sky -> fling a shooting star; click near the distant star -> a solar-flare burst
addEventListener('click', (e) => {
  if (e.target.closest('.panel, a, button, input, textarea, .gas, .moon, .exo')) return;
  if (flareEl) {
    const r = flareEl.getBoundingClientRect(), fx = r.left + r.width / 2, fy = r.top + r.height / 2;
    if (Math.hypot(e.clientX - fx, e.clientY - fy) < 64) {     // generous hit area around the tiny star
      pulse(flareEl);
      for (let k = 0; k < 4; k++) {
        const a = 0.5 + k * 0.55 + Math.random() * 0.3, sp = 7 + Math.random() * 4;
        shots.push({ x: fx, y: fy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 48 + Math.random() * 24, len: 80 + Math.random() * 60 });
      }
      return;
    }
  }
  const ang = -0.4 + Math.random() * 0.8, sp = 8 + Math.random() * 4;
  shots.push({ x: e.clientX, y: e.clientY, vx: Math.cos(ang) * sp + 3.5, vy: Math.sin(ang) * sp + 2,
    life: 0, max: 58 + Math.random() * 26, len: 90 + Math.random() * 70 });
});
// 2) click the hologram -> rocky talks (+ a secret line every so often)
(function () {
  const stage = document.querySelector('.holo-stage');
  if (!stage) return;
  const lines = (Array.isArray(CFG.rockyLines) && CFG.rockyLines.length) ? CFG.rockyLines : ['good. good.', 'question?', '♪ amaze ♪'];
  const secret = CFG.rockySecret || '♪ secret chord ♪';
  let li = (Math.random() * lines.length) | 0, clicks = 0;
  stage.addEventListener('click', () => {
    clicks++;
    if (clicks % 7 === 0) { toast(secret); return; }
    toast(lines[li % lines.length]); li++;
  });
})();
// 3) click a planet -> it slowly glows in and out
['.gas', '.moon', '.exo'].forEach((sel) => {
  const el = document.querySelector(sel);
  if (!el) return;
  el.style.pointerEvents = 'auto'; el.style.cursor = 'pointer';
  el.addEventListener('click', () => pulse(el));
});

/* ---- eridian hologram: rocky (modeled from PHM reference) ---- */
(function () {
  const cv = document.getElementById('holo');
  if (!cv) return;
  const g = cv.getContext('2d');
  const TAU = Math.PI * 2, N = 5, PH = 0.32;
  const SPIN_RATE = TAU / (Math.max(1, LOOK.hologramSpinSeconds) * 1000);   // one turn per configured seconds
  let W = 0, H = 0, DPR = 1, CX = 0, originY = 0, UNIT = 0;
  let MUNIT = 0, MoriginY = 0;       // framing for the loaded mesh (different scale)

  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const r = cv.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    CX = W / 2;
    // scale by height, but never wider than the canvas can hold (keeps legs/arm on-screen on narrow phones)
    UNIT = Math.min((H - 70) / 2.7, (W - 24) / 3.9);
    originY = H / 2 - 0.15 * UNIT;
    MUNIT = Math.min((H - 70) / 2.6, (W - 24) / 3.9);
    MoriginY = H / 2 - 0.04 * MUNIT;
  }

  // ---- helpers ----
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const hash = (i) => { const x = Math.sin(i * 127.13 + 11.7) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
  const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  const stony = (lit) => `rgba(${44 + 70 * lit | 0},${150 + 78 * lit | 0},${190 + 60 * lit | 0},${0.6 + 0.36 * lit})`;

  // ---- faceted rock carapace: a flattened, lumpy spheroid (flat-shaded) ----
  const BCY = 0.46, BRX = 0.98, BRY = 0.50;       // body centre-y, horizontal & vertical radius (compact)
  const ML = 10, RL = 5;                            // longitudes, latitude rings (chunkier facets)
  const verts = [];
  for (let l = 0; l <= RL; l++) {
    const phi = -1.18 + (l / RL) * 2.46;            // leave small openings at poles
    const cz = Math.cos(phi), sz = Math.sin(phi);
    for (let m = 0; m < ML; m++) {
      const th = (m / ML) * TAU;
      const lump = 1 + 0.12 * Math.cos(5 * th + 0.6);     // gentle 5-fold (pentaradial)
      const n = hash(l * 31.7 + m * 7.3);
      const rr = BRX * cz * lump * (1 + 0.10 * n);
      const yy = BCY + BRY * sz + 0.06 * n;
      verts.push([Math.cos(th) * rr, yy, Math.sin(th) * rr]);
    }
  }
  const TOPC = verts.length; verts.push([0, BCY + BRY * 1.05, 0]);   // top-centre cap vertex
  const idx = (l, m) => l * ML + (m % ML);
  const center = [0, BCY, 0];
  const faces = [];
  const addFace = (ia, ib, ic) => {
    const a = verts[ia], b = verts[ib], c = verts[ic];
    let nrm = norm(cross(sub(b, a), sub(c, a)));
    const cx = (a[0] + b[0] + c[0]) / 3 - center[0], cy = (a[1] + b[1] + c[1]) / 3 - center[1], cz2 = (a[2] + b[2] + c[2]) / 3 - center[2];
    if (nrm[0] * cx + nrm[1] * cy + nrm[2] * cz2 < 0) nrm = [-nrm[0], -nrm[1], -nrm[2]];   // orient outward
    faces.push({ v: [ia, ib, ic], n: nrm });
  };
  for (let l = 0; l < RL; l++) for (let m = 0; m < ML; m++) {
    addFace(idx(l, m), idx(l, m + 1), idx(l + 1, m + 1));
    addFace(idx(l, m), idx(l + 1, m + 1), idx(l + 1, m));
  }
  for (let m = 0; m < ML; m++) addFace(idx(RL, m), idx(RL, m + 1), TOPC);
  const gems = [idx(3, 1), idx(4, 6), idx(3, 9), idx(5, 3), idx(2, 12)];   // teal mineral veins

  // ---- camera: yaw + fixed downward pitch + idle bob ----
  const camZ = 8.0, PITCH = 0.30, cp = Math.cos(PITCH), sp = Math.sin(PITCH);
  const McamZ = 3.8, MPITCH = 0.08, Mcp = Math.cos(MPITCH), Msp = Math.sin(MPITCH);
  let MESH = null;                   // {verts, faces, normals} once rocky.json loads
  let YAW = 0, BOB = 0;
  const rot = (p) => {
    const cy = Math.cos(YAW), sy = Math.sin(YAW), py = p[1] + BOB;
    const x = p[0] * cy - p[2] * sy, zr = p[0] * sy + p[2] * cy;
    return [x, py * cp - zr * sp, py * sp + zr * cp];
  };
  const rotN = (d) => {
    const cy = Math.cos(YAW), sy = Math.sin(YAW);
    const x = d[0] * cy - d[2] * sy, zr = d[0] * sy + d[2] * cy;
    return [x, d[1] * cp - zr * sp, d[1] * sp + zr * cp];
  };
  const scr = (rv) => { const s = (UNIT * camZ) / (camZ - rv[2]); return [CX + rv[0] * s, originY - rv[1] * s, rv[2]]; };
  const project = (p) => scr(rot(p));

  // ---- legs: four planted blades + one raised three-finger arm ----
  const ARM = 0;
  const LIGHT = norm([-0.34, 0.72, 0.6]);
  function legJoints(k, wave) {
    const a = PH + (k / N) * TAU, c = Math.cos(a), s = Math.sin(a);
    const hip = [c * 0.80, 0.42, s * 0.80];
    if (k === ARM) {
      const sway = Math.sin(wave) * 0.16;
      const elbow = [c * 1.10, 0.78, s * 1.10];
      const hand = [c * 1.30 - s * sway, 1.20 + Math.sin(wave * 0.7) * 0.06, s * 1.30 + c * sway];
      return { hip, elbow, foot: hand, arm: true };
    }
    // bent crab-leg: thigh juts out to a bulky knee, then shin drops nearly straight down to the foot
    return { hip, elbow: [c * 1.80, 0.22, s * 1.80], foot: [c * 1.62, -0.95, s * 1.62], arm: false };
  }
  const blade = (p1, p2, w1, w2) => {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    return [[p1[0] + nx * w1, p1[1] + ny * w1], [p2[0] + nx * w2, p2[1] + ny * w2],
            [p2[0] - nx * w2, p2[1] - ny * w2], [p1[0] - nx * w1, p1[1] - ny * w1]];
  };
  const poly = (pts) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); };

  const motes = Array.from({ length: 38 }, (_, i) => ({
    a: i / 38 * TAU, r: 0.15 + Math.random() * 1.7, y: Math.random() * 2 - 0.9,
    sp: 0.0014 + Math.random() * 0.0036, ph: Math.random() * TAU, sz: 0.45 + Math.random() * 0.7
  }));

  function homageFrame(t) {
    YAW = reduced ? 0.6 : t * SPIN_RATE;
    BOB = reduced ? 0 : Math.sin(t * 0.0012) * 0.03;
    const wave = t * 0.003;
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    const fl = reduced ? 1 : 0.86 + 0.10 * Math.sin(t * 0.012) + (Math.random() < 0.045 ? -0.14 : 0);
    g.globalAlpha = Math.max(0.58, fl);

    const baseY = H - 30, footY = scr(rot([0, -0.95, 0]))[1], coneTop = originY - 1.05 * UNIT;

    // projector light cone
    const cg = g.createLinearGradient(0, baseY, 0, coneTop);
    cg.addColorStop(0, 'rgba(150,232,255,0.20)'); cg.addColorStop(1, 'rgba(150,232,255,0)');
    g.fillStyle = cg;
    g.beginPath();
    g.moveTo(CX - 9, baseY); g.lineTo(CX - UNIT * 1.75, coneTop); g.lineTo(CX + UNIT * 1.75, coneTop); g.lineTo(CX + 9, baseY);
    g.closePath(); g.fill();

    // rising motes
    for (const m of motes) {
      if (!reduced) { m.y += m.sp; if (m.y > 1.1) { m.y = -0.9; m.r = 0.2 + Math.random() * 1.6; } }
      const ang = m.a + t * 0.0003;
      const p = scr([Math.cos(ang) * m.r, m.y, Math.sin(ang) * m.r]);
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.004 + m.ph));
      g.fillStyle = `rgba(184,242,255,${0.4 * tw})`;
      g.beginPath(); g.arc(p[0], p[1], 1.1, 0, TAU); g.fill();
    }

    // body core glow + ground ring
    const cc = project([0, BCY, 0]);
    const rgl = g.createRadialGradient(cc[0], cc[1], 0, cc[0], cc[1], UNIT * 1.4);
    rgl.addColorStop(0, 'rgba(120,220,255,0.13)'); rgl.addColorStop(1, 'rgba(120,220,255,0)');
    g.fillStyle = rgl; g.beginPath(); g.arc(cc[0], cc[1], UNIT * 1.4, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(150,232,255,0.4)'; g.lineWidth = 1.3;
    g.beginPath(); g.ellipse(CX, footY, UNIT * 1.7, UNIT * 0.27, 0, 0, TAU); g.stroke();

    // ---- body faces + leg blades -> one depth-sorted solid ----
    g.globalCompositeOperation = 'source-over';
    const sv = verts.map(rot), ss = sv.map(scr);
    const draw = [];
    for (const f of faces) {
      const i0 = f.v[0], i1 = f.v[1], i2 = f.v[2];
      const z = (sv[i0][2] + sv[i1][2] + sv[i2][2]) / 3;
      const nc = rotN(f.n);
      const diff = Math.max(0, nc[0] * LIGHT[0] + nc[1] * LIGHT[1] + nc[2] * LIGHT[2]);
      const facing = nc[2];
      const rim = Math.pow(1 - Math.min(1, Math.abs(facing)), 2.4);
      const val = Math.min(1, 0.26 + 0.74 * diff);
      const r = Math.min(255, 36 + 96 * val + rim * 70), gg = Math.min(255, 150 + 92 * val + rim * 105), b = Math.min(255, 196 + 56 * val + rim * 130);
      const a = facing >= 0 ? 0.6 + 0.36 * val : 0.26;
      draw.push({ pts: [ss[i0], ss[i1], ss[i2]], z, fill: `rgba(${r | 0},${gg | 0},${b | 0},${a})`, seam: facing >= 0 });
    }
    const legs = [];
    for (let k = 0; k < N; k++) legs.push(legJoints(k, wave));
    for (const lg of legs) {
      const rh = rot(lg.hip), re = rot(lg.elbow), rf = rot(lg.foot);
      const h = scr(rh), e = scr(re), f = scr(rf);
      const wHip = UNIT * (lg.arm ? 0.11 : 0.15), wElb = UNIT * (lg.arm ? 0.13 : 0.18), wFoot = UNIT * (lg.arm ? 0.05 : 0.05);
      const lit1 = clamp01((((rh[2] + re[2]) / 2) + 1.6) / 3.2), lit2 = clamp01((((re[2] + rf[2]) / 2) + 1.6) / 3.2);
      draw.push({ pts: blade(h, e, wHip, wElb), z: (rh[2] + re[2]) / 2, fill: stony(lit1), leg: true });
      draw.push({ pts: blade(e, f, wElb, wFoot), z: (re[2] + rf[2]) / 2, fill: stony(lit2), leg: true, end: f, dir: [f[0] - e[0], f[1] - e[1]], arm: lg.arm });
    }
    draw.sort((p, q) => p.z - q.z);
    for (const d of draw) {
      g.fillStyle = d.fill; poly(d.pts); g.fill();
      if (d.seam) { g.lineWidth = 0.7; g.strokeStyle = 'rgba(150,224,255,0.12)'; poly(d.pts); g.stroke(); }
      if (d.leg) { g.lineWidth = 1; g.strokeStyle = 'rgba(150,226,255,0.34)'; poly(d.pts); g.stroke(); }
      if (d.arm && d.end) {                                   // three-finger claw on the raised hand
        const L = Math.hypot(d.dir[0], d.dir[1]) || 1, ux = d.dir[0] / L, uy = d.dir[1] / L;
        for (const off of [-0.5, 0, 0.5]) {
          const ca = Math.cos(off), sa = Math.sin(off);
          const fx = ux * ca - uy * sa, fy = ux * sa + uy * ca;
          const tip = [d.end[0] + fx * UNIT * 0.22, d.end[1] + fy * UNIT * 0.22];
          g.fillStyle = stony(0.85); poly(blade(d.end, tip, UNIT * 0.055, UNIT * 0.014)); g.fill();
        }
      }
    }

    // ---- glow pass: teal veins, joints, scan sweep ----
    g.globalCompositeOperation = 'lighter';
    for (const gi of gems) {
      const rv = sv[gi]; if (rv[2] < -0.2) continue;
      const p = scr(rv), a = 0.6 * Math.max(0.15, (rv[2] + 1.6) / 3.2), rad = UNIT * 0.12;
      const gg = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], rad);
      gg.addColorStop(0, `rgba(116,255,212,${a})`); gg.addColorStop(1, 'rgba(116,255,212,0)');
      g.fillStyle = gg; g.beginPath(); g.arc(p[0], p[1], rad, 0, TAU); g.fill();
    }
    for (const lg of legs) {
      const e = project(lg.elbow), f = project(lg.foot);
      g.fillStyle = 'rgba(150,232,255,0.5)'; g.beginPath(); g.arc(e[0], e[1], 2, 0, TAU); g.fill();
      g.fillStyle = lg.arm ? 'rgba(120,255,212,0.9)' : 'rgba(200,248,255,0.9)';
      g.beginPath(); g.arc(f[0], f[1], lg.arm ? 1.8 : 2.3, 0, TAU); g.fill();
    }
    if (!reduced) {
      const period = 5200, swp = (t % period) / period;
      if (swp < 0.5) {
        const sy = originY + 0.6 * UNIT - swp * 2 * (1.6 * UNIT);
        const grd = g.createLinearGradient(0, sy - 8, 0, sy + 8);
        grd.addColorStop(0, 'rgba(150,235,255,0)'); grd.addColorStop(0.5, 'rgba(172,242,255,0.5)'); grd.addColorStop(1, 'rgba(150,235,255,0)');
        g.fillStyle = grd; g.fillRect(CX - UNIT * 1.8, sy - 8, UNIT * 3.6, 16);
      }
    }

    // ---- chromatic glitch tear ----
    if (!reduced && Math.random() < 0.05) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'lighter';
      const sy = Math.random() * cv.height * 0.9, sh = (4 + Math.random() * 16) * DPR, dx = (Math.random() * 10 - 5) * DPR;
      try { g.globalAlpha = 0.5; g.drawImage(cv, 0, sy, cv.width, sh, dx, sy, cv.width, sh); g.globalAlpha = 1; } catch (e) {}
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  // ---- exact mesh path: render the loaded rocky.json model ----
  function buildMesh(m) {
    const V = m.verts, F = m.faces;
    const FN = F.map((f) => norm(cross(sub(V[f[1]], V[f[0]]), sub(V[f[2]], V[f[0]]))));
    // crease + boundary edges, built once at load (keeps the JSON small)
    const em = new Map();
    for (let fi = 0; fi < F.length; fi++) {
      const f = F[fi];
      for (let k = 0; k < 3; k++) {
        const a = f[k], b = f[(k + 1) % 3], key = a < b ? a + '_' + b : b + '_' + a;
        const e = em.get(key);
        if (!e) em.set(key, { a: Math.min(a, b), b: Math.max(a, b), f0: fi, f1: -1 }); else e.f1 = fi;
      }
    }
    const edges = [];
    em.forEach((e) => {
      let cr; if (e.f1 >= 0) { const p = FN[e.f0], q = FN[e.f1]; cr = (p[0] * q[0] + p[1] * q[1] + p[2] * q[2]) < 0.5; } else cr = true;
      edges.push([e.a, e.b, e.f0, e.f1, cr ? 1 : 0]);
    });
    MESH = { verts: V, faces: F, normals: FN, edges };
  }
  function meshFrame(t) {
    const YAW2 = reduced ? 0.7 : t * SPIN_RATE, BOB2 = reduced ? 0 : Math.sin(t * 0.0012) * 0.03;
    const cy = Math.cos(YAW2), sy = Math.sin(YAW2);
    const rot = (p) => { const x = p[0] * cy - p[2] * sy, zr = p[0] * sy + p[2] * cy, py = p[1] + BOB2; return [x, py * Mcp - zr * Msp, py * Msp + zr * Mcp]; };
    const rotN = (d) => { const x = d[0] * cy - d[2] * sy, zr = d[0] * sy + d[2] * cy; return [x, d[1] * Mcp - zr * Msp, d[1] * Msp + zr * Mcp]; };
    const scr = (rv) => { const s = (MUNIT * McamZ) / (McamZ - rv[2]); return [CX + rv[0] * s, MoriginY - rv[1] * s, rv[2]]; };

    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';        // whole figure is additive -> no per-frame depth sort
    g.globalAlpha = Math.max(0.6, reduced ? 1 : 0.9 + 0.08 * Math.sin(t * 0.012) + (Math.random() < 0.04 ? -0.12 : 0));

    // ---- projector beam (the upward hologram ray) + ambient ----
    const baseY = H - 30, footY = scr(rot([0, -0.95, 0]))[1], beamTop = MoriginY - 1.18 * MUNIT;
    const pulse = reduced ? 1 : 0.82 + 0.18 * Math.sin(t * 0.0045);
    const halfB = MUNIT * 1.95, baseHalf = 10;
    const beam = (hT, hB) => { g.beginPath(); g.moveTo(CX - hB, baseY); g.lineTo(CX - hT, beamTop); g.lineTo(CX + hT, beamTop); g.lineTo(CX + hB, baseY); g.closePath(); };
    // outer soft beam
    const bg1 = g.createLinearGradient(0, baseY, 0, beamTop);
    bg1.addColorStop(0, `rgba(70,140,255,${0.16 * pulse})`); bg1.addColorStop(0.55, `rgba(80,165,255,${0.07 * pulse})`); bg1.addColorStop(1, 'rgba(90,170,255,0)');
    g.fillStyle = bg1; beam(halfB, baseHalf); g.fill();
    // inner core beam
    const bg2 = g.createLinearGradient(0, baseY, 0, beamTop);
    bg2.addColorStop(0, `rgba(185,218,255,${0.5 * pulse})`); bg2.addColorStop(0.5, `rgba(120,180,255,${0.18 * pulse})`); bg2.addColorStop(1, 'rgba(120,180,255,0)');
    g.fillStyle = bg2; beam(MUNIT * 0.72, MUNIT * 0.05); g.fill();
    // energy bands rising through the beam
    if (!reduced) {
      const span = baseY - beamTop;
      for (let k = 0; k < 4; k++) {
        const fr = (t * 0.00018 + k / 4) % 1, yb = baseY - fr * span, hw = (baseHalf + (halfB - baseHalf) * fr) * 0.82;
        const aa = 0.22 * pulse * Math.sin(fr * Math.PI);
        if (aa <= 0.01) continue;
        g.fillStyle = `rgba(155,205,255,${aa.toFixed(3)})`; g.fillRect(CX - hw, yb - 1.5, hw * 2, 3);
      }
    }
    // beam edge glow + emitter hot-spot
    g.strokeStyle = `rgba(140,195,255,${0.35 * pulse})`; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(CX - baseHalf, baseY); g.lineTo(CX - halfB, beamTop); g.moveTo(CX + baseHalf, baseY); g.lineTo(CX + halfB, beamTop); g.stroke();
    const hs = g.createRadialGradient(CX, baseY, 0, CX, baseY, MUNIT * 0.95);
    hs.addColorStop(0, `rgba(195,222,255,${0.5 * pulse})`); hs.addColorStop(0.5, `rgba(110,170,255,${0.16 * pulse})`); hs.addColorStop(1, 'rgba(110,170,255,0)');
    g.fillStyle = hs; g.beginPath(); g.arc(CX, baseY, MUNIT * 0.95, 0, TAU); g.fill();
    // motes (halo + core, size variance)
    for (const m of motes) {
      if (!reduced) { m.y += m.sp; if (m.y > 1.1) { m.y = -0.9; m.r = 0.15 + Math.random() * 1.7; } }
      const ang = m.a + t * 0.0003, px = CX + Math.cos(ang) * m.r * MUNIT, py = MoriginY - m.y * MUNIT;
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.004 + m.ph)), rr = m.sz * (0.55 + 0.35 * tw);
      g.fillStyle = `rgba(165,200,255,${0.05 * tw})`; g.beginPath(); g.arc(px, py, rr * 2.0, 0, TAU); g.fill();
      g.fillStyle = `rgba(200,225,255,${0.28 * tw})`; g.beginPath(); g.arc(px, py, rr, 0, TAU); g.fill();
    }
    // core glow + double ground ring
    const cc = scr(rot([0, 0, 0]));
    const rgl = g.createRadialGradient(cc[0], cc[1], 0, cc[0], cc[1], MUNIT * 1.5);
    rgl.addColorStop(0, `rgba(90,160,255,${0.12 * pulse})`); rgl.addColorStop(1, 'rgba(90,160,255,0)');
    g.fillStyle = rgl; g.beginPath(); g.arc(cc[0], cc[1], MUNIT * 1.5, 0, TAU); g.fill();
    g.strokeStyle = `rgba(140,195,255,${0.4 * pulse})`; g.lineWidth = 1.4;
    g.beginPath(); g.ellipse(CX, footY, MUNIT * 1.55, MUNIT * 0.25, 0, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(120,175,255,0.2)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(CX, footY, MUNIT * 1.95, MUNIT * 0.32, 0, 0, TAU); g.stroke();

    // ---- the mesh: translucent ghost shell + glowing contour lines + depth cue ----
    if (MESH) {
    const MV = MESH.verts, MF = MESH.faces, MN = MESH.normals, ME = MESH.edges;
    const sv = MV.map(rot), ss = sv.map(scr);
    let zmn = 1e9, zmx = -1e9; for (const v of sv) { if (v[2] < zmn) zmn = v[2]; if (v[2] > zmx) zmx = v[2]; }
    const zrg = zmx - zmn || 1;
    const fnz = new Float32Array(MF.length);
    for (let i = 0; i < MF.length; i++) {
      const f = MF[i], nc = rotN(MN[i]); fnz[i] = nc[2];
      const rim = Math.pow(1 - Math.min(1, Math.abs(nc[2])), 2.0);
      const diff = Math.abs(nc[0] * LIGHT[0] + nc[1] * LIGHT[1] + nc[2] * LIGHT[2]);
      const fzc = (sv[f[0]][2] + sv[f[1]][2] + sv[f[2]][2]) / 3, dep = 0.5 + 0.7 * ((fzc - zmn) / zrg);
      const a = (0.05 + 0.16 * rim + 0.05 * diff) * dep;
      if (a < 0.012) continue;
      const ty = ((MV[f[0]][1] + MV[f[1]][1] + MV[f[2]][1]) / 3 + 0.95) / 1.9;   // 0 feet .. 1 top: blue rises
      const cR = Math.min(255, 44 + 26 * (1 - ty) + 150 * rim) | 0;
      const cG = Math.min(255, 116 + 80 * (1 - ty) + 112 * rim) | 0;
      const cB = Math.min(255, 240 + 15 * rim) | 0;
      g.fillStyle = `rgba(${cR},${cG},${cB},${a.toFixed(3)})`;
      g.beginPath(); g.moveTo(ss[f[0]][0], ss[f[0]][1]); g.lineTo(ss[f[1]][0], ss[f[1]][1]); g.lineTo(ss[f[2]][0], ss[f[2]][1]); g.closePath(); g.fill();
    }
    g.lineCap = 'round';
    for (const e of ME) {
      const f1 = e[3], sil = f1 < 0 ? true : (fnz[e[2]] < 0) !== (fnz[f1] < 0);
      if (!(e[4] || sil)) continue;
      const A = ss[e[0]], B = ss[e[1]], mz = (sv[e[0]][2] + sv[e[1]][2]) / 2, dep = 0.5 + 0.7 * ((mz - zmn) / zrg);
      g.strokeStyle = `rgba(${sil ? '180,215,255' : '120,175,255'},${Math.min(0.95, (sil ? 0.6 : 0.32) * dep).toFixed(3)})`;
      g.lineWidth = sil ? 1.5 : 1;
      g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
    }
    }   // end if (MESH)

    // scan sweep + glitch tear
    if (!reduced) {
      const period = 5200, swp = (t % period) / period;
      if (swp < 0.5) {
        const ySweep = MoriginY + 0.9 * MUNIT - swp * 2 * (1.9 * MUNIT);
        const grd = g.createLinearGradient(0, ySweep - 8, 0, ySweep + 8);
        grd.addColorStop(0, 'rgba(150,235,255,0)'); grd.addColorStop(0.5, 'rgba(172,242,255,0.4)'); grd.addColorStop(1, 'rgba(150,235,255,0)');
        g.fillStyle = grd; g.fillRect(CX - MUNIT * 1.7, ySweep - 8, MUNIT * 3.4, 16);
      }
      if (Math.random() < 0.05) {
        g.setTransform(1, 0, 0, 1, 0, 0);
        const sy2 = Math.random() * cv.height * 0.9, sh = (4 + Math.random() * 16) * DPR, dx = (Math.random() * 10 - 5) * DPR;
        try { g.globalAlpha = 0.5; g.drawImage(cv, 0, sy2, cv.width, sh, dx, sy2, cv.width, sh); g.globalAlpha = 1; } catch (e) {}
        g.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  let activeFrame = meshFrame;       // shows the projector beam right away; the mesh pops in once loaded
  size();
  window.addEventListener('resize', size);
  if (typeof fetch === 'function') {
    fetch('assets/rocky.json').then((r) => r.ok ? r.json() : null).then((m) => {
      if (m && m.verts && m.faces) buildMesh(m); else activeFrame = homageFrame;
      if (reduced) activeFrame(800);
    }).catch(() => { activeFrame = homageFrame; if (reduced) activeFrame(800); });
  } else { activeFrame = homageFrame; }
  if (reduced) activeFrame(800);
  else {
    // the hologram is by far the heaviest render here (a full ~1000-face mesh). throttle it to
    // ~16fps (it rotates once per ~19s, so the per-frame step is tiny and the low cadence even
    // reads as a "projected hologram" flicker) and fully idle it whenever it's scrolled
    // off-screen — no sense rendering rocky while you're reading the links up top.
    let lastT = -999, holoRaf = 0, holoVis = true;
    function loop(t) {
      if (!holoVis) { holoRaf = 0; return; }
      holoRaf = requestAnimationFrame(loop);
      if (t - lastT >= 62) { activeFrame(t); lastT = t; }
    }
    new IntersectionObserver((es) => { holoVis = es[0].isIntersecting; if (holoVis && !holoRaf) holoRaf = requestAnimationFrame(loop); }, { rootMargin: '160px' }).observe(cv);
    holoRaf = requestAnimationFrame(loop);
  }
})();
