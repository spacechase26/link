const tilt = document.getElementById('tilt');
const flipper = document.getElementById('flipper');
const hint = document.getElementById('hint');

const MAX = 12;          // max tilt in degrees
let down = null;         // pointer-down position (to tell taps from drags)
let dragged = false;

function setVars(x, y, rect) {
  const px = (x - rect.left) / rect.width;   // 0..1
  const py = (y - rect.top) / rect.height;   // 0..1
  tilt.style.setProperty('--rx', `${(px - 0.5) * 2 * MAX}deg`);
  tilt.style.setProperty('--ry', `${(0.5 - py) * 2 * MAX}deg`);
  tilt.style.setProperty('--px', `${px * 100}%`);
  tilt.style.setProperty('--py', `${py * 100}%`);
  tilt.style.setProperty('--bx', `${px * 100}%`);
  tilt.style.setProperty('--by', `${py * 100}%`);
}

tilt.addEventListener('pointermove', (e) => {
  setVars(e.clientX, e.clientY, tilt.getBoundingClientRect());
  if (down && (Math.abs(e.clientX - down.x) > 8 || Math.abs(e.clientY - down.y) > 8)) dragged = true;
});

tilt.addEventListener('pointerenter', () => {
  tilt.classList.add('live');
  tilt.style.setProperty('--active', '1');
});

tilt.addEventListener('pointerleave', () => {
  tilt.classList.remove('live');
  tilt.style.setProperty('--active', '0.22');
  tilt.style.setProperty('--rx', '0deg');
  tilt.style.setProperty('--ry', '0deg');
});

tilt.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; dragged = false; });

// tap the card (or a flip button) to flip; let real links through
tilt.addEventListener('click', (e) => {
  if (e.target.closest('a')) return;        // social / project link → open it
  if (dragged) { dragged = false; return; } // that was a tilt drag, not a tap
  flipper.classList.toggle('flipped');
  hideHint();
});

function hideHint() { if (hint) hint.classList.add('gone'); }
tilt.addEventListener('pointerenter', hideHint, { once: true });
