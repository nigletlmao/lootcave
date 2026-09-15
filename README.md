# LootCave — temp emails, numbers, mods, tools & cool sites

Static React + Vite site. No backend, no tracking, everything free.

## Run it
```
npm install   # first time only
npm run dev   # → http://localhost:5173
npm run build # → dist/ (deploy this folder anywhere static)
npm run lint  # must show 0 errors before pushing
```

## Folder map (what to touch)
```
AI Website/
├── index.html          # page title + fallback background
├── package.json        # project name + dependencies (lucide-react for icons)
├── vite.config.js      # build config (you rarely need this)
├── public/             # favicon, static assets (copied to dist as-is)
├── dist/               # build output — generated, never edit, never commit
├── node_modules/       # dependencies — generated, never touch
└── src/
    ├── main.jsx        # entry point (leave alone)
    ├── index.css       # tiny global styles
    ├── App.jsx         # ALL page components (Home, Email, Tools, Admin…)
    ├── App.css         # ALL styling + the 10 themes
    └── data/           # ★ EDIT THESE to change site content
        ├── ui.js        # tabs, tab descriptions, themes
        ├── directory.js # SMS sites, email providers, cool sites, categories, recommended
        └── hubs.js      # mod games, downloader tools, software groups
```

## Adding a site (30 seconds)
1. Open `src/data/directory.js` (cool sites) or `src/data/hubs.js` (mods/software).
2. Copy any `{ name, url, desc, ... }` line, paste it under the right `// comment`, edit the text.
3. New category? Add the `cat: 'Name'` on your lines + one line in `CAT_DESC`.
4. Save → browser refreshes by itself → `git add -A && git commit -m "..." && git push` to go live.

## Deploy (Cloudflare Pages, free)
Push to GitHub, then Pages → Connect to Git → build `npm run build`, output `dist`.
Every push rebuilds the live site automatically.

## Rules of the cave
- Free + legal only: no pirate streams, no "free Robux" junk, no malware traps.
- Every directory entry needs a `desc` saying WHY it's there.
- `npm run lint` must pass with 0 errors before every push.
