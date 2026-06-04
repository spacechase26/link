# link

my link-in-bio → https://spacechase26.github.io/link/

it's a single **holographic trading card**: move your cursor to tilt it and
catch the foil/glare, tap it to flip — front is socials, back is the stuff i
build. plain html/css/js, no build step.

## structure
- `index.html` — the card markup + an svg icon sprite
- `css/style.css` — design tokens up top, then the card / holo / flip styles
- `js/main.js` — pointer tilt, holo tracking, tap-to-flip
- `assets/` — avatar + favicon

## restyle
everything tweakable lives in `:root` at the top of `css/style.css`
(`--holo` controls foil intensity, `--card-w` the size, plus the colors).

## avatar
`assets/avatar.svg` is a placeholder. drop in a real photo and point the
front `<img>` in `index.html` at it (e.g. `assets/avatar.jpg`).

## deploy
pushes to `main` auto-deploy via github actions → pages.
