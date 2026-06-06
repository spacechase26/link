# link

my little corner of the internet → https://spacechase26.github.io/link/

a hard-sci-fi "crew terminal" — project hail mary meets interstellar. a living
starfield you can drift through, a planet on the horizon, a spinning galaxy you can
poke, and a low-poly hologram down the bottom. all the actual links (socials +
projects) live inside the console. plain html/css/js, no build step.

## structure
- `index.html` — the console markup + an svg icon sprite
- `css/style.css` — design tokens up top, then the scene + module styles
- `js/config.js` — edit this one: name, links, projects, log, and the look knobs
- `js/main.js` — starfield, the live readouts, and the hologram renderer
- `assets/` — avatar, favicon, icon sprite

## make it yours
open `js/config.js` and change the values — name, socials, projects, the lot. the
visual knobs (star brightness, comet rate, hologram spin, red-fade) are in the
`look` block at the bottom of the same file.

## deploy
pushes to `main` auto-deploy via github actions → pages. heavy bits (the hologram,
the cursor flourishes) idle when off-screen or on touch/low-end devices so it stays
light.
