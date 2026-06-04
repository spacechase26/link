# link

my link-in-bio page → https://spacechase26.github.io/link/

plain html/css/js, no build step. dark glass look, all the styling tokens
live at the top of `css/style.css` so it's easy to re-skin.

## structure
- `index.html` — the page (socials up top, projects below, footer)
- `css/style.css` — tokens + styles
- `js/main.js` — cursor spotlight on the cards
- `assets/` — avatar + favicon

## avatar
`assets/avatar.svg` is a placeholder. drop in a real photo and point the
`<img>` src in `index.html` at it (e.g. `assets/avatar.jpg`).

## deploy
pushes to `main` auto-deploy via github actions.
one-time: repo settings → pages → source = **GitHub Actions**.
