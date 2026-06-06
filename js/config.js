/* ============================================================================
   EDIT ME — this is the one file you change to update the page.
   Change a value, save, refresh the browser. Nothing else needs touching.
   (Keep the quotes and commas. Colors are hex like '#5cc6f5'.)
   ============================================================================ */
window.CFG = {

  /* ---------- header ---------- */
  name: 'spacechase',                                  // the big name up top
  subtitle: 'crew terminal // heading: tau ceti',      // the small line under it

  /* ---------- operator / profile ---------- */
  bio: 'i draw, game way too much, and build little apps i wish existed.',
  tags: [
    { label: 'art',       color: '#ff6fa5' },
    { label: 'games',     color: '#a679ff' },
    { label: 'night-owl', color: '#5cc6f5' },
    { label: 'coding',    color: '#5fd39b' },
  ],

  /* ---------- comms (your socials) ----------
     icon must be one of:
       instagram  x  twitch  discord  steam  xbox  spotify  reddit  github  mail
     add/remove/reorder rows freely — the numbering updates itself.            */
  socials: [
    { icon: 'instagram', name: 'instagram',     hint: '@spaced.out.spacechase', url: 'https://www.instagram.com/spaced.out.spacechase/', color: '#ff5c8a' },
    { icon: 'instagram', name: 'instagram · art', hint: '@spazechaze',           url: 'https://instagram.com/spazechaze',                 color: '#d471c4' },
    { icon: 'x',         name: 'x',              hint: '@zyxvana',               url: 'https://twitter.com/zyxvana',                      color: '#7aa2ff' },
    { icon: 'twitch',    name: 'twitch',         hint: 'spacechase26',           url: 'https://m.twitch.tv/spacechase26/home',            color: '#a679ff' },
    { icon: 'discord',   name: 'discord',        hint: 'profile',                url: 'https://discord.com/users/828589990853607464',     color: '#7d8bff' },
    { icon: 'steam',     name: 'steam',          hint: 'spacechase26',           url: 'https://steamcommunity.com/id/spacechase26/',      color: '#5cc6f5' },
    { icon: 'xbox',      name: 'xbox',           hint: 'spacechase26',           url: 'https://live.xbox.com/Profile?Gamertag=spacechase26', color: '#6fe07a' },
    { icon: 'spotify',   name: 'spotify',        hint: 'listen',                 url: 'https://open.spotify.com/user/lpy04bygcps82wc6tzfevtmjy', color: '#46d671' },
    { icon: 'reddit',    name: 'reddit',         hint: 'u/spacechase26',         url: 'https://www.reddit.com/user/spacechase26/',        color: '#ff7847' },
  ],

  /* ---------- payload (your projects) ---------- */
  projects: [
    { name: 'wordplay', desc: 'wordle, but you can play forever',        url: 'https://spacechase26.github.io/wordplay/', color: '#5fd39b' },
    { name: 'ca-inter', desc: 'a study companion i built for myself',    url: 'https://spacechase26.github.io/ca-inter/', color: '#5cc6f5' },
    { name: 'modelawn', desc: 'a launcher to help me stop doomscrolling', url: 'https://github.com/spacechase26/Modelawn', color: '#a679ff' },
    { name: 'tympeak',  desc: "an app i'm tinkering with",               url: 'https://github.com/spacechase26/Tympeak',  color: '#ff8a5c' },
  ],

  /* ---------- ship's log (recent notes) ---------- */
  log: [
    { date: '06.04.26', text: 'ditched linktree, built this from scratch' },
    { date: '05 · 26',  text: 'shipping updates to wordplay' },
    { date: "'26",      text: 'grinding ca inter — send focus' },
  ],

  /* ---------- footer ---------- */
  footer: {
    githubUrl: 'https://github.com/spacechase26',
    email: 'harendra12912@gmail.com',
    tagline: 'trust yourself',
  },

  /* ---------- rocky's lines (click the hologram to hear one) ---------- */
  rockyLines: [
    'good. good.', 'question?', '♪ amaze ♪', 'you. me. friend.', 'fist my bump',
    'happy.', 'sad. so sad.', 'cold? wear sweater.', 'science is good.',
    'sleep now, talk later.', 'careful, fragile human.', 'space is big. very big.',
  ],
  rockySecret: '♪✶♪ you poked me enough — secret chord unlocked, friend ♪✶♪',  // shows every 7th click

  /* ============================================================================
     LOOK & FEEL — tweak the vibe (numbers only).
     ============================================================================ */
  look: {
    hologramSpinSeconds: 19,   // seconds for rocky to spin once (lower = faster)
    cometEveryMin: 85,         // min frames between comets (lower = more comets)
    cometEveryMax: 195,        // max frames between comets
    starBrightness: 1.0,       // 0.6 = dim sky … 1.4 = bright sky
    redFadeSeconds: 2.0,       // how slowly the whole scene bleeds to/from blood red when you hover the galaxy
  },
};
