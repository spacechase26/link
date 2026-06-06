# the guide

everything you need to live with this page — what it is, how to change it, the
hidden bits, and how it ships. no build step, no framework. just html/css/js.

live at → https://spacechase26.github.io/link/

---

## the one file you actually edit: `js/config.js`

change a value, save, refresh. that's the whole workflow. keep the quotes and commas.

| field | what it is |
|---|---|
| `name` | the big wordmark up top |
| `subtitle` | the small line under it |
| `bio` | the operator blurb |
| `tags` | the little chips — `{ label, color }` (hex color) |
| `socials` | the comms list — `{ icon, name, hint, url, color }` |
| `projects` | the payload list — `{ name, desc, url, color }` |
| `log` | the ship's-log notes — `{ date, text }` |
| `footer` | `{ githubUrl, email, tagline }` |
| `rockyLines` | the lines rocky says when you click the hologram |
| `rockySecret` | the rare line (shows every 7th click) |

add / remove / reorder rows freely — the numbering (`01`, `02`, …) updates itself.

### social icons
`icon` has to be one of these (they live in the sprite `assets/icons.svg`):

`instagram` · `x` · `twitch` · `discord` · `steam` · `xbox` · `spotify` · `reddit` · `github` · `mail`

want a brand that isn't here? drop a new `<symbol id="i-yourname">…</symbol>` into
`assets/icons.svg`, then use `icon: 'yourname'`.

---

## the look knobs (`look` block, bottom of `config.js`)

numbers only — these just tune the vibe.

| knob | does |
|---|---|
| `hologramSpinSeconds` | seconds for rocky to spin once (lower = faster) |
| `cometEveryMin` / `cometEveryMax` | how often comets streak by (frames; lower = more) |
| `starBrightness` | `0.6` dim sky … `1.4` bright sky |
| `redFadeSeconds` | how slowly the whole scene bleeds to/from blood-red on the galaxy hover |

> the hologram's render rate (not its spin) is fixed in `js/main.js` — search for
> `t - lastT >= 62`. that `62` is ~16 fps; lower it for a smoother (heavier) hologram.

---

## hidden stuff (poke around)

- **hover the spinning galaxy** (lower-left) → the whole world slowly bleeds blood red. mouse only.
- **move the mouse** → a soft light follows the cursor.
- **click empty space** → fling a shooting star.
- **click the bright far star** (top-right glare) → a solar-flare burst.
- **click the small planets** (gas giant / moon / ringed world) → they glow.
- **click the hologram** → rocky talks. keep clicking — every 7th one is a secret line.
- **type `rocky`** anywhere → he says hi.
- **the konami code** (`↑ ↑ ↓ ↓ ← → ← → b a`) → meteor shower.
- the wordmark waves on load and when you hover it; a calibration line sweeps down once on boot.

## the live readouts (they're real)
- the header clock + "earth time" are live IST.
- **status** changes with the hour — cryo-sleep, caffeinating, heads-down, golden hour, night-owl.
- **sol** counts days since the mission epoch; **distance** keeps climbing at ~0.92c. it's flavor, but it ticks.

---

## the hologram (rocky)

the projection loads your model from `assets/rocky.json` (the mesh export of the
rocky model). that's the real thing on the live site.

if that file ever fails to load, the code draws a **procedural** eridian instead so the
projector is never empty — but with the model present, the model is what you see. keep
`assets/rocky.json` in the repo.

---

## performance (why it stays smooth)

built to run on weak phones too:
- the hologram and the signal-scope **stop rendering when scrolled off-screen** (nothing wasted while you read the links).
- the starfield is frame-capped (~35 fps) and uses cheap glows.
- the frosted-glass blur and the film grain **switch off on touch / low-end** devices.
- everything respects **reduce-motion** (animations off) — except the galaxy red hover, which still works.

so the default view (reading the links up top) is extremely light; the heavier hologram
only runs while you're actually looking at it.

---

## run it locally

no build. serve the folder and open it:

```bash
cd link
python3 -m http.server 8000
# open http://localhost:8000
```

(use a server, not a `file://` open — the hologram fetches `rocky.json` and the icon
sprite, which browsers block over `file://`.)

## deploy

push to `main` → github actions builds & ships to pages automatically (`.github/workflows/deploy.yml`).
no config needed; it auto-enables pages on first run. live within a minute or so at
`spacechase26.github.io/link/`.

## if something looks off
- **icons missing** → `assets/icons.svg` must be present (it's committed; don't delete it).
- **hologram is a generic blob, not the model** → `assets/rocky.json` didn't load — make sure it's in the repo and returns 200.
- **hologram feels choppy** → bump the fps (`t - lastT >= 62` in `main.js`, lower the number) or speed the spin (`hologramSpinSeconds`).
