import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Binary, CaseSensitive, ClipboardList, Clock, Coffee, Copy, Dices, Download, ExternalLink,
  Fingerprint, FileJson, Flower2, Gamepad2, Gem, Globe, HardDrive, Hash, Home as HomeIcon, IdCard, KeyRound,
  Laptop, Link2, Lock, Mail, Moon, MousePointerClick, Music, Palette, Pencil, Plus, QrCode,
  RefreshCw, RotateCcw,   Ruler, Scale, ScanSearch, Settings as SettingsIcon, ShieldCheck, Smartphone, Snowflake, Sparkles,
  Star, Sun, Sunset, Target, Terminal, TextQuote, Timer, TriangleAlert, Tv, Waves, Wifi, Wrench, Zap,
} from 'lucide-react'
import './App.css'

const TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'email', label: 'Temp Email', icon: Mail },
  { id: 'numbers', label: 'Temp Numbers', icon: Smartphone },
  { id: 'ids', label: 'Fake IDs', icon: IdCard },
  { id: 'sites', label: 'Cool Sites', icon: Globe },
  { id: 'mods', label: 'Mods', icon: Gamepad2 },
  { id: 'download', label: 'Downloader', icon: Download },
  { id: 'software', label: 'Software', icon: Laptop },
  { id: 'tools', label: 'Mini Tools', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'admin', label: 'Admin', icon: Lock },
]

const TAB_BLURBS = {
  home: 'Start here — what lootcave is, quick jumps to every tool, and the house rules.',
  email: 'A real disposable inbox in your browser (via 1secmail) + backup providers. Copy an address, receive mail, no signup.',
  numbers: 'Free public SMS receivers for throwaway OTPs + paid private rentals. Read the safety warning first.',
  ids: 'One-click fake identities for testing signups. Generated locally — nothing leaves your browser.',
  sites: 'Hand-picked directory: security, adblock, sims, design, learning, Reddit gems, hosting, AI, utils + legal streaming. You can add your own.',
  mods: 'Mod hubs for FiveM, Minecraft, GTA V, Bethesda games, Sims and more — plus the managers that install them.',
  download: 'YouTube & media downloading: copy-paste yt-dlp commands for MP3/MP4 plus the best no-install tools.',
  software: 'Essential free software everyone should have — browsers, media, utilities, dev tools, launchers.',
  tools: 'Tiny offline-first utilities: password generator with charset control, UUID, QR codes, Base64.',
  settings: 'Make it yours — themes, font size, default tab, inbox refresh speed. Saved in your browser.',
  admin: 'Behind the scenes — login required. Stats, API health checks, event log, and data controls.',
}

const THEMES = [
  { id: 'midnight', name: 'Midnight', icon: Moon, desc: 'Default dark. Easy on the eyes.' },
  { id: 'light', name: 'Light', icon: Sun, desc: 'Clean bright mode for daytime.' },
  { id: 'neon', name: 'Neon', icon: Zap, desc: 'Cyberpunk pink + cyan on black.' },
  { id: 'terminal', name: 'Terminal', icon: Terminal, desc: 'Green-on-black hacker mono.' },
  { id: 'ocean', name: 'Ocean', icon: Waves, desc: 'Deep blue, calm vibes.' },
  { id: 'sunset', name: 'Sunset', icon: Sunset, desc: 'Warm orange dusk tones.' },
  { id: 'dracula', name: 'Dracula', icon: Sparkles, desc: 'The famous purple-on-dark editor theme.' },
  { id: 'nord', name: 'Nord', icon: Snowflake, desc: 'Frosty arctic blues, calm and crisp.' },
  { id: 'coffee', name: 'Coffee', icon: Coffee, desc: 'Warm sepia browns for late nights.' },
  { id: 'rose', name: 'Rose', icon: Flower2, desc: 'Soft light-pink daytime theme.' },
]

const DEFAULT_SETTINGS = {
  theme: 'midnight',
  fontScale: 'medium',
  defaultTab: 'home',
  refreshSec: 12,
  compact: false,
  pwLength: 20,
  pwUpper: true,
  pwLower: true,
  pwNumbers: true,
  pwSymbols: true,
  excludeAmbiguous: true,
  accent: '',
  reduceMotion: false,
  hideBlurbs: false,
  autoCopyPw: false,
}

function loadSettings() {
  try {
    const raw = localStorage.getItem('lootbox-settings')
    if (!raw) return DEFAULT_SETTINGS
    const s = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    // sanitize — a bad stored value must never nuke the theme
    if (!THEMES.some((t) => t.id === s.theme)) s.theme = 'midnight'
    if (!['small', 'medium', 'large'].includes(s.fontScale)) s.fontScale = 'medium'
    if (!TABS.some((t) => t.id === s.defaultTab)) s.defaultTab = 'home'
    s.refreshSec = Math.min(120, Math.max(5, +s.refreshSec || 12))
    return s
  } catch {
    return DEFAULT_SETTINGS
  }
}

function loadCustomSites() {
  try {
    return JSON.parse(localStorage.getItem('lootbox-custom-sites') || '[]')
  } catch {
    return []
  }
}

/* ---------- Event log (ring buffer in localStorage, surfaced in Admin) ---------- */
function logEvent(type, msg) {
  try {
    const arr = JSON.parse(localStorage.getItem('lootbox-events') || '[]')
    arr.push({ t: new Date().toISOString(), type, msg: String(msg).slice(0, 300) })
    localStorage.setItem('lootbox-events', JSON.stringify(arr.slice(-100)))
  } catch { /* storage full/blocked — ignore */ }
}
function getEvents() {
  try {
    return JSON.parse(localStorage.getItem('lootbox-events') || '[]').reverse()
  } catch {
    return []
  }
}

/* ---------- 1secmail fetch with automatic route fallback ----------
   Why: 1secmail sends no CORS headers (it's built for servers), so a
   browser page on localhost gets blocked calling it directly. We retry
   the same GET through public CORS proxies. 1secmail GETs carry no
   secrets, so proxying them is acceptable for throwaway mail. */
const MAIL_ROUTES = [
  { id: 'direct', label: 'direct', wrap: (u) => u },
  { id: 'allorigins', label: 'allorigins proxy', wrap: (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u) },
  { id: 'corsproxy', label: 'corsproxy.io', wrap: (u) => 'https://corsproxy.io/?url=' + encodeURIComponent(u) },
]

async function fetch1sec(path) {
  const base = 'https://www.1secmail.com/api/v1/' + path
  const errors = []
  for (const r of MAIL_ROUTES) {
    const t0 = performance.now()
    try {
      const res = await fetch(r.wrap(base))
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      return { data, route: r.label, ms: Math.round(performance.now() - t0) }
    } catch (e) {
      errors.push(`${r.label}: ${e.message}`)
      logEvent('net', `1secmail [${path}] via ${r.label} failed: ${e.message}`)
    }
  }
  throw new Error(errors.join('  |  '))
}

const SMS_SITES = [
  { name: 'Receive SMSS', url: 'https://receive-smss.com', desc: 'Free public numbers across USA / UK / EU. Pick a number, read SMS in browser. No signup.', tags: 'free usa uk' },
  { name: 'SMS Receive Free', url: 'https://smsreceivefree.com', desc: 'Disposable US/CA numbers refreshed hourly. Good for one-off verifications.', tags: 'free usa' },
  { name: 'Receive SMS Online', url: 'https://www.receive-sms-online.info', desc: 'Big country list, decent for OTPs that accept public numbers.', tags: 'free otp' },
  { name: 'FreePhoneNum', url: 'https://freephonenum.com', desc: 'Temporary numbers aimed at verification codes, simple UI.', tags: 'free verification' },
  { name: 'SMS-Activate (paid)', url: 'https://sms-activate.io', desc: 'Rent a PRIVATE number per-service from ~$0.10. Top up balance, get OTPs nobody else sees.', tags: 'paid private api' },
  { name: '5SIM (paid)', url: 'https://5sim.net', desc: 'Private activations for 180+ services with API support. Pay per SMS.', tags: 'paid private' },
  { name: 'Quackr', url: 'https://quackr.io', desc: 'Directory of free + temporary numbers with per-number inboxes.', tags: 'free directory' },
  { name: 'Anonym SMS', url: 'https://anonymsms.com', desc: 'Anonymous free receivers, no account needed.', tags: 'free anonymous' },
]

const EMAIL_PROVIDERS = [
  { name: 'Temp-Mail', url: 'https://temp-mail.org', desc: 'The classic disposable inbox. Instant address, auto-refresh.' },
  { name: 'Guerrilla Mail', url: 'https://www.guerrillamail.com', desc: 'Disposable inbox with scrambled-address option for extra privacy.' },
  { name: '10 Minute Mail', url: 'https://10minutemail.com', desc: 'Self-destructing inbox — perfect for one confirmation link.' },
  { name: 'Mail.tm', url: 'https://mail.tm', desc: 'Free API-based temp mail with apps + multi-address support.' },
  { name: 'Mailinator', url: 'https://www.mailinator.com', desc: 'Public inbox anyone can check — use anything@mailinator.com.' },
]

const COOL_SITES = [
  // Security
  { name: 'Have I Been Pwned', url: 'https://haveibeenpwned.com', desc: 'Paste your email to see if it appeared in a data breach. Free, by Troy Hunt.', cat: 'Security' },
  { name: 'VirusTotal', url: 'https://www.virustotal.com', desc: 'Paste a shady link or upload a file — scans with 70+ antivirus engines.', cat: 'Security' },
  { name: 'Bitwarden', url: 'https://bitwarden.com', desc: 'Free open-source password manager. Stop reusing passwords.', cat: 'Security' },
  { name: '2FA Directory', url: 'https://2fa.directory', desc: 'Look up any site and see if it supports two-factor auth + how to enable it.', cat: 'Security' },
  // Adblock & privacy
  { name: 'uBlock Origin', url: 'https://ublockorigin.com', desc: 'The adblocker everyone recommends. Open-source, light on RAM, kills YouTube ads + trackers.', cat: 'Adblock & Privacy' },
  { name: 'AdGuard', url: 'https://adguard.com', desc: 'Blocks ads + trackers system-wide (apps too, not just browser). Free browser ext.', cat: 'Adblock & Privacy' },
  { name: 'Privacy Badger', url: 'https://privacybadger.org', desc: 'EFF tracker blocker that auto-learns who spies on you.', cat: 'Adblock & Privacy' },
  { name: 'FilterLists', url: 'https://filterlists.com', desc: 'Directory of 300+ blocklists — find lists for ads, crypto-miners, regions, annoying cookie popups.', cat: 'Adblock & Privacy' },
  { name: 'Adblock Tester', url: 'https://adblock-tester.com', desc: 'Scores your adblocker out of 100 with live tests. Run before/after tuning.', cat: 'Adblock & Privacy' },
  { name: 'Cover Your Tracks', url: 'https://coveryourtracks.eff.org', desc: "EFF test: how trackers see your browser, and whether you're fingerprintable.", cat: 'Adblock & Privacy' },
  { name: 'Proton Mail', url: 'https://proton.me/mail', desc: 'Free encrypted email from Switzerland. Good permanent inbox to pair with throwaways.', cat: 'Adblock & Privacy' },
  { name: 'Signal', url: 'https://signal.org', desc: 'Private messenger, no ads, no tracking. The default rec for sensitive chats.', cat: 'Adblock & Privacy' },
  { name: 'JustDeleteMe', url: 'https://justdeleteme.xyz', desc: 'Tells you exactly how to delete any account, with difficulty ratings.', cat: 'Adblock & Privacy' },
  // Simulators & playgrounds
  { name: 'Falstad Circuit Simulator', url: 'https://www.falstad.com/circuit/', desc: 'Legendary animated circuit sim — watch current flow as moving dots. No signup, fully free.', cat: 'Simulators & Playgrounds' },
  { name: 'Wokwi', url: 'https://wokwi.com', desc: 'Simulate Arduino, ESP32 and Pico firmware in the browser, Wi-Fi included. Free tier.', cat: 'Simulators & Playgrounds' },
  { name: 'Tinkercad Circuits', url: 'https://www.tinkercad.com/circuits', desc: 'Virtual breadboard + Arduino you can program in blocks or C++. Easiest start (Autodesk account).', cat: 'Simulators & Playgrounds' },
  { name: 'CircuitSim', url: 'https://circuitsim.com/', desc: 'Real SPICE engine in the browser with charts + 5000 parts. Free tier, no install.', cat: 'Simulators & Playgrounds' },
  { name: 'PhET Simulations', url: 'https://phet.colorado.edu', desc: '100+ free physics/chem/math sims from University of Colorado. Gold for homework intuition.', cat: 'Simulators & Playgrounds' },
  { name: 'Stellarium Web', url: 'https://stellarium-web.org', desc: 'Planetarium in your browser — point at the sky, identify stars and planets live.', cat: 'Simulators & Playgrounds' },
  { name: 'Radio Garden', url: 'https://radio.garden', desc: 'Spin a 3D globe and tune into live radio from anywhere on Earth.', cat: 'Simulators & Playgrounds' },
  { name: "Quick, Draw!", url: 'https://quickdraw.withgoogle.com', desc: "Google AI guesses your doodles in 20 seconds. Doodle dataset is open source.", cat: 'Simulators & Playgrounds' },
  { name: 'Hacker Typer', url: 'https://hackertyper.net', desc: 'Mash the keyboard, look like a movie hacker. Pure fun, great for demos.', cat: 'Simulators & Playgrounds' },
  // Reddit gems
  { name: 'r/selfhosted', url: 'https://www.reddit.com/r/selfhosted/', desc: 'Run your own services (media servers, clouds, bots). Tons of free project ideas.', cat: 'Reddit Gems' },
  { name: 'r/homelab', url: 'https://www.reddit.com/r/homelab/', desc: 'Home servers + networking on a budget. Great for learning infra.', cat: 'Reddit Gems' },
  { name: 'r/learnprogramming', url: 'https://www.reddit.com/r/learnprogramming/', desc: 'Beginner-friendly coding help + curated resources.', cat: 'Reddit Gems' },
  { name: 'r/webdev', url: 'https://www.reddit.com/r/webdev/', desc: 'Web dev news, showcases, and career advice.', cat: 'Reddit Gems' },
  { name: 'r/opensource', url: 'https://www.reddit.com/r/opensource/', desc: 'New free + open-source apps surface here daily.', cat: 'Reddit Gems' },
  { name: 'r/degoogle', url: 'https://www.reddit.com/r/degoogle/', desc: 'Escape big-tech tracking: free private alternatives to everything.', cat: 'Reddit Gems' },
  { name: 'r/privacy', url: 'https://www.reddit.com/r/privacy/', desc: 'Privacy news, breach alerts, and tool recommendations.', cat: 'Reddit Gems' },
  { name: 'r/freebies', url: 'https://www.reddit.com/r/freebies/', desc: 'Legit free stuff (trials, games, samples). Check pinned rules to avoid spam.', cat: 'Reddit Gems' },
  // Free hosting
  { name: 'Cloudflare Pages', url: 'https://pages.cloudflare.com', desc: 'Free static hosting + global CDN. Deploy this lootcave site here for free.', cat: 'Free Hosting' },
  { name: 'Netlify', url: 'https://www.netlify.com', desc: 'Free static hosting with 100GB bandwidth/mo. Drag-and-drop deploys.', cat: 'Free Hosting' },
  { name: 'Vercel', url: 'https://vercel.com', desc: 'Free frontend hosting, perfect for Vite/React. Git push = live URL.', cat: 'Free Hosting' },
  { name: 'GitHub Pages', url: 'https://pages.github.com', desc: 'Host a static site free straight from a GitHub repo.', cat: 'Free Hosting' },
  { name: 'Render', url: 'https://render.com', desc: 'Free tier for static sites + small web services and cron jobs.', cat: 'Free Hosting' },
  { name: 'Supabase', url: 'https://supabase.com', desc: 'Free Postgres DB + auth + storage. The free Firebase alternative.', cat: 'Free Hosting' },
  { name: 'Firebase', url: 'https://firebase.google.com', desc: 'Google free Spark plan: hosting, auth, Firestore DB for side projects.', cat: 'Free Hosting' },
  // Free AI
  { name: 'ChatGPT', url: 'https://chat.openai.com', desc: 'Free tier chatbot for writing, code, homework help.', cat: 'Free AI' },
  { name: 'Claude', url: 'https://claude.ai', desc: 'Free tier, excellent at code + long docs. Made by Anthropic.', cat: 'Free AI' },
  { name: 'Gemini', url: 'https://gemini.google.com', desc: "Google's free AI with live web + Gmail/Docs integration.", cat: 'Free AI' },
  { name: 'Hugging Face', url: 'https://huggingface.co', desc: 'Thousands of free models + Spaces apps + inference API. The GitHub of AI.', cat: 'Free AI' },
  { name: 'Groq', url: 'https://groq.com', desc: 'Ridiculously fast free LLM inference. Great playground for open models.', cat: 'Free AI' },
  { name: 'Perplexity', url: 'https://www.perplexity.ai', desc: 'AI search that cites sources. Free tier covers daily research.', cat: 'Free AI' },
  { name: 'Copilot (Microsoft)', url: 'https://copilot.microsoft.com', desc: 'Free GPT-powered assistant in Edge/Windows + web.', cat: 'Free AI' },
  // Everyday utils
  { name: 'TinyWow', url: 'https://tinywow.com', desc: 'Hundreds of free file tools (PDF, image, video, AI) with no signup.', cat: 'Everyday Utils' },
  { name: 'Wolfram Alpha', url: 'https://www.wolframalpha.com', desc: 'Computes answers — math, science, finance — instead of just linking pages.', cat: 'Everyday Utils' },
  { name: 'Remove.bg', url: 'https://remove.bg', desc: 'One-click AI background removal for photos.', cat: 'Everyday Utils' },
  { name: 'Ninite', url: 'https://ninite.com', desc: 'Batch-install Windows apps with one installer, zero junkware.', cat: 'Everyday Utils' },
  { name: 'Down For Everyone?', url: 'https://downforeveryoneorjustme.com', desc: 'Is the site down, or is it just you? One-click answer.', cat: 'Everyday Utils' },
  { name: 'Fast.com', url: 'https://fast.com', desc: "Netflix's one-click internet speed test.", cat: 'Everyday Utils' },
  { name: 'CamelCamelCamel', url: 'https://camelcamelcamel.com', desc: 'Amazon price history charts + drop alerts. Never overpay again.', cat: 'Everyday Utils' },
  { name: 'Wayback Machine', url: 'https://web.archive.org', desc: 'See any website as it looked years ago + archive pages yourself.', cat: 'Everyday Utils' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com', desc: 'Private search with no tracking + handy !bang shortcuts.', cat: 'Everyday Utils' },
  { name: 'JustWatch', url: 'https://www.justwatch.com', desc: 'Search any movie/show, see exactly which LEGAL service streams it.', cat: 'Everyday Utils' },
  { name: 'Rome2Rio', url: 'https://www.rome2rio.com', desc: 'Routes between any two places across bus, train, ferry and flights.', cat: 'Everyday Utils' },
  { name: 'Coolors', url: 'https://coolors.co', desc: 'Hit spacebar, get a color palette. Export to CSS/Figma in one click.', cat: 'Everyday Utils' },
  { name: 'Desmos Calculator', url: 'https://www.desmos.com/calculator', desc: 'Gorgeous free graphing calculator that runs in the browser.', cat: 'Everyday Utils' },
  { name: 'Regex101', url: 'https://regex101.com', desc: 'Build + test regular expressions with live explanation of each token.', cat: 'Everyday Utils' },
  { name: 'Can I Use', url: 'https://caniuse.com', desc: 'Browser support tables for every web feature. Dev essential.', cat: 'Everyday Utils' },
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org', desc: 'The bible of HTML/CSS/JS reference. Accurate, example-rich.', cat: 'Everyday Utils' },
  { name: 'Khan Academy', url: 'https://www.khanacademy.org', desc: 'Free world-class lessons from math to art history.', cat: 'Everyday Utils' },
  { name: 'freeCodeCamp', url: 'https://www.freecodecamp.org', desc: 'Free project-based coding curriculum, beginner to job-ready.', cat: 'Everyday Utils' },
  { name: 'Privacy Guides', url: 'https://www.privacyguides.org', desc: 'Community-vetted privacy tools + how-tos. No sponsored picks.', cat: 'Everyday Utils' },
  // Files
  { name: 'File.io', url: 'https://www.file.io', desc: 'Upload a file, get a link that self-destructs after one download.', cat: 'Files' },
  { name: '0x0.st', url: 'https://0x0.st', desc: 'Nerd-favorite file host: upload straight from terminal with curl.', cat: 'Files' },
  { name: 'Privnote', url: 'https://privnote.com', desc: 'Send a note that destroys itself after being read once.', cat: 'Files' },
  // Dev
  { name: 'Roadmap.sh', url: 'https://roadmap.sh', desc: 'Step-by-step dev career roadmaps (frontend, backend, DevOps…).', cat: 'Dev' },
  { name: 'Excalidraw', url: 'https://excalidraw.com', desc: 'Hand-drawn-style whiteboard for diagrams + wireframes. Free.', cat: 'Dev' },
  { name: 'AlternativeTo', url: 'https://alternativeto.net', desc: 'Type any paid app, get the best free alternatives.', cat: 'Dev' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', desc: 'Search-first Q&A for every error message you will ever meet.', cat: 'Dev' },
  // Media
  { name: 'Photopea', url: 'https://www.photopea.com', desc: 'Full Photoshop clone in your browser. Opens PSD/XD/Sketch free.', cat: 'Media' },
  { name: 'Cobalt', url: 'https://cobalt.tools', desc: 'Paste a video/audio link, download cleanly without watermarks.', cat: 'Media' },
  // Legal streaming only — no pirate sites
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', desc: 'The legal anime home. Free ad-supported tier with huge catalog.', cat: 'Watch (legal)' },
  { name: 'Tubi', url: 'https://tubitv.com', desc: '100% free + legal movies and dubbed anime. No signup needed.', cat: 'Watch (legal)' },
  { name: 'Pluto TV', url: 'https://pluto.tv', desc: 'Free live channels + on-demand, including anime channels.', cat: 'Watch (legal)' },
  { name: 'RetroCrush', url: 'https://www.retrocrush.tv', desc: 'Free classic + retro anime, fully licensed.', cat: 'Watch (legal)' },
  { name: 'Plex Free', url: 'https://www.plex.tv', desc: 'Free legal movies/shows alongside its famous media-server app.', cat: 'Watch (legal)' },
  { name: 'buyelias.com', url: 'https://buyelias.com', desc: 'Indie storefront worth a look — small shops like this beat megastores for unique finds.', cat: 'Shops & Deals' },
  { name: 'Etsy', url: 'https://www.etsy.com', desc: 'Handmade, vintage and custom goods from independent sellers.', cat: 'Shops & Deals' },
  { name: 'Back Market', url: 'https://www.backmarket.com', desc: 'Refurbished phones, laptops and consoles with warranty. Cheaper + greener.', cat: 'Shops & Deals' },
  { name: 'GitHub', url: 'https://github.com', desc: 'Home of open source. Host code, ship Pages sites, find free tools.', cat: 'Dev' },
  { name: 'CodePen', url: 'https://codepen.io', desc: 'Try HTML/CSS/JS ideas live in the browser. Infinite tricks to learn from.', cat: 'Dev' },
  { name: 'Unsplash', url: 'https://unsplash.com', desc: 'Gorgeous free photos for wallpapers and projects.', cat: 'Create & Design' },
  { name: 'Pexels', url: 'https://www.pexels.com', desc: 'Free stock photos + videos, no attribution needed.', cat: 'Create & Design' },
  { name: 'TinyPNG', url: 'https://tinypng.com', desc: 'Shrinks PNG/JPG/WebP images smartly. Free batch uploads.', cat: 'Create & Design' },
  { name: 'Figma', url: 'https://www.figma.com', desc: 'Collaborative interface design in the browser. Generous free tier.', cat: 'Create & Design' },
  { name: 'Canva', url: 'https://www.canva.com', desc: 'Drag-and-drop designs, posters and thumbnails in minutes.', cat: 'Create & Design' },
  { name: 'Loom', url: 'https://www.loom.com', desc: 'Record screen + face, share with a link. Free tier included.', cat: 'Create & Design' },
  { name: 'ElevenLabs', url: 'https://elevenlabs.io', desc: 'Best-in-class AI voices. Free tier for voiceovers and fun.', cat: 'Create & Design' },
  { name: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu', desc: 'Real MIT lectures, notes and exams — free, all of it.', cat: 'Learn' },
  { name: 'Duolingo', url: 'https://www.duolingo.com', desc: 'Gamified language learning. Free tier teaches real basics.', cat: 'Learn' },
  { name: 'Project Gutenberg', url: 'https://www.gutenberg.org', desc: '60,000+ free classic ebooks. No account, no DRM.', cat: 'Learn' },
  { name: 'Brilliant', url: 'https://brilliant.org', desc: 'Interactive math, science and CS courses. Free intro content.', cat: 'Learn' },
  { name: 'Speedtest', url: 'https://www.speedtest.net', desc: 'Detailed internet speed diagnostics with history.', cat: 'Everyday Utils' },
  { name: 'WhatIsMyIPAddress', url: 'https://whatismyipaddress.com', desc: 'Your IP, location guess, plus VPN/proxy and blacklist check.', cat: 'Everyday Utils' },
  { name: 'Notion', url: 'https://www.notion.so', desc: 'Notes, docs and databases in one free workspace.', cat: 'Everyday Utils' },
  { name: 'Google Flights', url: 'https://www.google.com/travel/flights', desc: 'Fast fare search with flexible-date price views.', cat: 'Everyday Utils' },
  { name: 'Splitwise', url: 'https://www.splitwise.com', desc: 'Split bills with friends without the spreadsheet drama.', cat: 'Everyday Utils' },
  { name: 'OSINT Framework', url: 'https://osintframework.com', desc: 'The master index: hundreds of OSINT tools organized by category. Start every investigation here.', cat: 'OSINT (legal)' },
  { name: 'Shodan', url: 'https://www.shodan.io', desc: 'Search engine for internet-connected devices. Free tier shows what is exposed.', cat: 'OSINT (legal)' },
  { name: 'Censys', url: 'https://search.censys.io', desc: 'Internet-wide scan data: certificates, hosts, services. Free community tier.', cat: 'OSINT (legal)' },
  { name: 'urlscan.io', url: 'https://urlscan.io', desc: 'Scan any URL: see where it really goes and what it loads. Paste shady links here first.', cat: 'OSINT (legal)' },
  { name: 'crt.sh', url: 'https://crt.sh', desc: 'Certificate transparency search: every TLS cert ever issued for a domain.', cat: 'OSINT (legal)' },
  { name: 'DNSDumpster', url: 'https://dnsdumpster.com', desc: 'Free DNS recon: subdomains, MX and TXT records mapped visually.', cat: 'OSINT (legal)' },
  { name: 'MXToolbox', url: 'https://mxtoolbox.com', desc: 'DNS + mail diagnostics: blacklist, SPF and DMARC checks.', cat: 'OSINT (legal)' },
  { name: 'Epieos', url: 'https://epieos.com', desc: 'Free email/phone lookup that finds linked accounts, no signup.', cat: 'OSINT (legal)' },
  { name: 'WhatsMyName', url: 'https://whatsmyname.me', desc: 'Check a username across hundreds of sites in one click.', cat: 'OSINT (legal)' },
  { name: 'Sherlock', url: 'https://github.com/sherlock-project/sherlock', desc: 'Famous open-source username hunter. Terminal-based, free forever.', cat: 'OSINT (legal)' },
  { name: 'Holehe', url: 'https://github.com/megadose/holehe', desc: 'Checks if an email is registered on 120+ sites. Use on your own audits.', cat: 'OSINT (legal)' },
  { name: 'TinEye', url: 'https://tineye.com', desc: 'Reverse image search: find where a photo appeared online.', cat: 'OSINT (legal)' },
  { name: 'Yandex Images', url: 'https://yandex.com/images', desc: 'Often the strongest reverse image search for places and faces.', cat: 'OSINT (legal)' },
  { name: 'FotoForensics', url: 'https://fotoforensics.com', desc: 'Error-level analysis that reveals edited regions in photos.', cat: 'OSINT (legal)' },
  { name: 'Exif.tools', url: 'https://exif.tools', desc: 'Read photo metadata (camera, GPS) right in the browser.', cat: 'OSINT (legal)' },
  { name: 'FlightRadar24', url: 'https://www.flightradar24.com', desc: 'Live flight tracking worldwide. Generous free tier.', cat: 'OSINT (legal)' },
  { name: 'MarineTraffic', url: 'https://www.marinetraffic.com', desc: 'Live ship positions — FlightRadar for boats.', cat: 'OSINT (legal)' },
  { name: 'OpenCorporates', url: 'https://opencorporates.com', desc: 'Largest open company database: officers, filings, networks.', cat: 'OSINT (legal)' },
  { name: 'Hunter.io', url: 'https://hunter.io', desc: 'Find public work emails by domain. Free searches each month.', cat: 'OSINT (legal)' },
  { name: 'OTX AlienVault', url: 'https://otx.alienvault.com', desc: 'Open threat-intel sharing: IPs, domains and hashes with context.', cat: 'OSINT (legal)' },
  { name: 'AbuseIPDB', url: 'https://www.abuseipdb.com', desc: 'Check whether an IP is reported for abuse. Free lookups.', cat: 'OSINT (legal)' },
  { name: 'GreyNoise', url: 'https://viz.greynoise.io', desc: 'Tells you if an IP scanning you is background noise or targeted.', cat: 'OSINT (legal)' },
  { name: 'Google Advanced Search', url: 'https://www.google.com/advanced_search', desc: 'Point-and-click Google dorks: filetype, site: and date filters.', cat: 'OSINT (legal)' },
]

const CAT_DESC = {
  'Security': 'Stay safe: breach checks, malware scans, password managers, 2FA lookups.',
  'Adblock & Privacy': 'Kill ads + trackers, test your setup, and take back inbox and chats.',
  'Simulators & Playgrounds': 'Circuits, physics, space, radio — interactive toys that teach real things.',
  'Reddit Gems': 'Subreddits that actually teach you things or surface free stuff.',
  'Free Hosting': 'Ship your own site/app for $0 — all have real free tiers.',
  'Free AI': 'Chatbots, search, and model hubs you can use without paying.',
  'Everyday Utils': 'One-click problem solvers: files, math, prices, downtime, learning.',
  'Files': 'Share files and notes that delete themselves.',
  'Dev': 'Learn faster and sketch ideas for free.',
  'Media': 'Edit images and grab media without installs or watermarks.',
  'Watch (legal)': 'Free + licensed streaming only. No pirate sites here — they mean malware + takedowns.',
  'Shops & Deals': 'Spend smarter: indie storefronts, handmade goods and refurbished tech.',
  'Create & Design': 'Make things: design, photos, video, AI voices — free tiers that actually deliver.',
  'Learn': 'Free courses, lectures and books — from MIT lectures to Duolingo streaks.',
  'OSINT (legal)': 'Open-source intelligence with public data only — research, verification, CTFs. Get consent / check local law before looking up real people.',
  'My Stuff': 'Sites you added yourself. Stored in this browser only.',
}

function SectionHead({ title, desc }) {
  return (
    <div className="sectionHead">
      <h2>{title}</h2>
      <p>{desc}</p>
    </div>
  )
}

/* Hand-picked essentials — shown in a Recommended section on top of Cool Sites */
const RECOMMENDED = new Set([
  'uBlock Origin', 'Bitwarden', 'TinyWow', 'Photopea', 'Falstad Circuit Simulator',
  'Wokwi', 'Hugging Face', 'Cloudflare Pages', 'Wayback Machine', 'Radio Garden',
  'urlscan.io', 'Have I Been Pwned', 'buyelias.com', 'Modrinth', 'Cobalt',
])

function copy(text) {
  navigator.clipboard?.writeText(text).catch(() => {})
}

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]
const digits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('')

function makeIdentity() {
  const first = ['Alex', 'Maya', 'Leo', 'Zoe', 'Kai', 'Nova', 'Rex', 'Ivy', 'Jude', 'Luna', 'Milo', 'Aria']
  const last = ['Carter', 'Voss', 'Marsh', 'Quinn', 'Slater', 'Reyes', 'Frost', 'Hale', 'Draper', 'Stone']
  const cities = ['Austin TX', 'Berlin DE', 'Toronto CA', 'London UK', 'Miami FL', 'Amsterdam NL', 'Sydney AU']
  const streets = ['Maple Ave', 'Neon Blvd', 'Harbor St', 'Pixel Rd', 'Ghost Ln', 'Circuit Dr']
  const companies = ['Null Labs', 'Ghostware', 'PixelForge', 'Vapor Inc', 'Bitdrift', 'Lootworks']
  const f = rand(first)
  const l = rand(last)
  const user = `${f.toLowerCase()}${l.toLowerCase()}${Math.floor(Math.random() * 99)}`
  return {
    name: `${f} ${l}`,
    username: user,
    email: `${user}@1secmail.com`,
    password: Math.random().toString(36).slice(2, 6) + '!' + Math.random().toString(36).slice(2, 8) + digits(2),
    phone: `+1 (${digits(3)}) ${digits(3)}-${digits(4)}`,
    dob: `${1 + Math.floor(Math.random() * 12)}/${1 + Math.floor(Math.random() * 28)}/${1988 + Math.floor(Math.random() * 18)}`,
    address: `${100 + Math.floor(Math.random() * 8900)} ${rand(streets)}, ${rand(cities)}`,
    company: rand(companies),
    uuid: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  }
}

/* ---------- Home ---------- */
function Home({ go }) {
  return (
    <>
      <div className="hero card big">
        <h1>Welcome to lootcave</h1>
        <p>Your localhost stash of useful internet throwaways: disposable emails with a <b>live inbox</b>, public SMS receivers, fake test identities, a hand-picked directory of free tools, and tiny dev utilities. Static only — no backend, no tracking, runs with <code>npm run dev</code>.</p>
        <div className="btnRow">
          <button onClick={() => go('email')}><Mail size={15} className="btnIcon" /> Get temp email</button>
          <button className="ghost" onClick={() => go('numbers')}><Smartphone size={15} className="btnIcon" /> Find temp number</button>
          <button className="ghost" onClick={() => go('ids')}><IdCard size={15} className="btnIcon" /> Generate ID</button>
          <button className="ghost" onClick={() => go('settings')}><SettingsIcon size={15} className="btnIcon" /> Customize theme</button>
        </div>
      </div>
      <SectionHead title="What lives here" desc="Ten sections, each with its own job. Hover nothing — just click and go." />
      <div className="cards">
        <div className="card"><h3><Mail size={16} className="hicon" /> Temp Email</h3><p>Real 1secmail inbox in-browser with automatic proxy fallback. Copy an address, receive mail, refresh live.</p><button className="ghost" onClick={() => go('email')}>Open →</button></div>
        <div className="card"><h3><Smartphone size={16} className="hicon" /> Temp Numbers</h3><p>Free public SMS receivers for OTPs anyone can read, plus paid private rentals for sensitive codes. Safety notes included.</p><button className="ghost" onClick={() => go('numbers')}>Open →</button></div>
        <div className="card"><h3><IdCard size={16} className="hicon" /> Fake IDs</h3><p>One-click test identities (name, login, address, company). 100% local — for dev/test signups, never legal docs.</p><button className="ghost" onClick={() => go('ids')}>Open →</button></div>
        <div className="card"><h3><Globe size={16} className="hicon" /> Cool Sites</h3><p>A curated + searchable directory: adblock, sims, Reddit gems, free hosting, free AI, utils, legal streaming. Add your own entries.</p><button className="ghost" onClick={() => go('sites')}>Open →</button></div>
        <div className="card"><h3><Wrench size={16} className="hicon" /> Mini Tools</h3><p>Offline-first utilities: charset-controlled password generator, UUIDs, QR codes, Base64 encoding.</p><button className="ghost" onClick={() => go('tools')}>Open →</button></div>
        <div className="card"><h3><SettingsIcon size={16} className="hicon" /> Settings</h3><p>Ten themes, font sizes, compact mode, default tab, inbox refresh speed, password defaults. Auto-saved locally.</p><button className="ghost" onClick={() => go('settings')}>Open →</button></div>
        <div className="card"><h3><Lock size={16} className="hicon" /> Admin</h3><p>Password-gated behind-the-scenes: visit stats, API health checks, event log, storage + data controls.</p><button className="ghost" onClick={() => go('admin')}>Open →</button></div>
        <div className="card"><h3><Gamepad2 size={16} className="hicon" /> Mods</h3><p>Mod hubs for FiveM, Minecraft, GTA V, Bethesda, Sims + the managers that install them. Safety notes included.</p><button className="ghost" onClick={() => go('mods')}>Open →</button></div>
        <div className="card"><h3><Download size={16} className="hicon" /> Downloader</h3><p>YouTube MP3/MP4 via copy-paste yt-dlp commands + no-install tools like Cobalt.</p><button className="ghost" onClick={() => go('download')}>Open →</button></div>
        <div className="card"><h3><Laptop size={16} className="hicon" /> Software</h3><p>Essential free apps: Firefox, VLC, OBS, PowerToys, VS Code, Steam, Heroic and more.</p><button className="ghost" onClick={() => go('software')}>Open →</button></div>
      </div>
      <div className="card">
        <h3><ShieldCheck size={16} className="hicon" /> House rules</h3>
        <ul className="tips">
          <li><b>Public = public.</b> Free temp numbers and emails can be read by strangers — never banking, recovery, or sensitive accounts.</li>
          <li><b>Test IDs only.</b> Fake identities are for dev signups, never KYC or legal documents.</li>
          <li><b>Legal streaming only.</b> Pirate sites mean malware + takedowns, so the directory lists licensed free options instead.</li>
        </ul>
      </div>
    </>
  )
}

/* ---------- Temp Email (1secmail + automatic route fallback) ---------- */
function TempEmail({ refreshSec }) {
  const [mailbox, setMailbox] = useState('')
  const [messages, setMessages] = useState([])
  const [opened, setOpened] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [conn, setConn] = useState({ route: '…', ms: null, at: null })

  const [login, domain] = useMemo(() => {
    if (!mailbox || !mailbox.includes('@')) return ['', '']
    const [l, d] = mailbox.split('@')
    return [l, d]
  }, [mailbox])

  const newAddress = useCallback(async () => {
    setLoading(true)
    setError('')
    setOpened(null)
    setMessages([])
    try {
      const { data, route, ms } = await fetch1sec('?action=genRandomMailbox&count=1')
      setMailbox(data[0])
      setConn({ route, ms, at: new Date().toLocaleTimeString() })
      logEvent('mail', `new address ${data[0]} via ${route} (${ms}ms)`)
    } catch (e) {
      setError('All routes failed: ' + e.message)
      logEvent('mail', 'new address FAILED: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!login) return
    setLoading(true)
    setError('')
    try {
      const { data, route, ms } = await fetch1sec(`?action=getMessages&login=${login}&domain=${domain}`)
      setMessages(data)
      setConn({ route, ms, at: new Date().toLocaleTimeString() })
    } catch (e) {
      setError('All routes failed: ' + e.message)
      logEvent('mail', 'refresh FAILED: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [login, domain])

  const openMsg = async (id) => {
    try {
      const { data } = await fetch1sec(`?action=readMessage&login=${login}&domain=${domain}&id=${id}`)
      setOpened(data)
    } catch (e) {
      setError('Could not open message: ' + e.message)
    }
  }

  useEffect(() => { newAddress() }, [newAddress])
  useEffect(() => {
    if (!login) return
    const t = setInterval(refresh, Math.max(5, refreshSec) * 1000)
    return () => clearInterval(t)
  }, [login, refresh, refreshSec])

  return (
    <>
      <SectionHead title="Live disposable inbox" desc={`Powered by the free 1secmail API with automatic fallback (direct → CORS proxies) when your browser blocks the call. Inbox auto-refreshes every ${refreshSec}s. Addresses expire after about a day.`} />
      <div className={`connPill ${error ? 'bad' : 'ok'}`}>
        <span className="dotPulse" /> connection: <b>{conn.route}</b>
        {conn.ms != null && <span> · {conn.ms}ms · {conn.at}</span>}
      </div>
      <div className="grid2">
        <div className="card big">
          <div className="addrRow">
            <code className="addr">{mailbox || 'generating…'}</code>
            <button onClick={() => { copy(mailbox); setCopied(true); setTimeout(() => setCopied(false), 1200) }}><Copy size={14} className="btnIcon" /> {copied ? 'Copied!' : 'Copy'}</button>
            <button className="ghost" onClick={newAddress}><RotateCcw size={14} className="btnIcon" /> New address</button>
            <button className="ghost" onClick={refresh}>{loading ? '…' : <><RefreshCw size={14} className="btnIcon" /> Refresh now</>}</button>
          </div>
          {error && (
            <div className="errBox">
              <p className="err">{error}</p>
              <p className="muted">Likely causes: you're offline, a VPN/firewall blocks it, or your adblocker (uBlock/AdGuard) blocks temp-mail domains — pause it for localhost and hit New address. Details of every attempt are in the Admin event log.</p>
            </div>
          )}
          <div className="inbox">
            {messages.length === 0 && <p className="muted">No messages yet. Paste the address into any signup form, then hit refresh.</p>}
            {messages.map((m) => (
              <button key={m.id} className="msg" onClick={() => openMsg(m.id)}>
                <b>{m.from}</b>
                <span>{m.subject}</span>
                <i>{m.date}</i>
              </button>
            ))}
          </div>
          {opened && (
            <div className="opened">
              <h3>{opened.subject}</h3>
              <p className="muted">From: {opened.from}</p>
              <div className="body" dangerouslySetInnerHTML={{ __html: opened.htmlBody || opened.body || '(empty)' }} />
              <button className="ghost" onClick={() => setOpened(null)}>Close</button>
            </div>
          )}
        </div>
        <div className="card">
          <h2>More temp-email providers</h2>
          <p className="muted">If the live inbox won't connect at all, these are the best-known alternatives — all free, no signup.</p>
          {EMAIL_PROVIDERS.map((p) => (
            <a key={p.name} className="linkRow" href={p.url} target="_blank" rel="noreferrer">
              <b>{p.name}</b><span>{p.desc}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}

/* ---------- Temp Numbers ---------- */
function TempNumbers({ query }) {
  const q = query.toLowerCase()
  const list = SMS_SITES.filter((s) => (s.name + s.desc + s.tags).toLowerCase().includes(q))
  return (
    <>
      <SectionHead title="Temporary numbers" desc="Free sites give you PUBLIC numbers — anyone can open the same inbox. Great for spammy signups, terrible for banking. Pay a few cents for a private rental when it matters." />
      <div className="notice"><TriangleAlert size={15} className="hicon" /> Free = <b>public</b>. Never use these for banking, password recovery, or 2FA you care about. For private OTPs use a paid rental below.</div>
      <div className="cards">
        {list.map((s) => (
          <a key={s.name} className="card link" href={s.url} target="_blank" rel="noreferrer">
            <h3>{s.name} <ExternalLink size={13} className="hicon" /></h3>
            <p>{s.desc}</p>
            <code>{s.url.replace('https://', '')}</code>
          </a>
        ))}
        {list.length === 0 && <p className="muted">No matches. Try "free" or "paid".</p>}
      </div>
    </>
  )
}

/* ---------- Fake IDs ---------- */
function FakeIDs() {
  const [id, setId] = useState(() => makeIdentity())
  return (
    <>
      <SectionHead title="Fake identity generator" desc="One click builds a full test persona — name, login, email, password, phone, birthday, address, company. Everything is random and local to your browser." />
      <div className="grid2">
        <div className="card big">
          <div className="kv">
            {Object.entries(id).map(([k, v]) => (
              <div key={k} className="row">
                <span>{k}</span>
                <code>{v}</code>
                <button className="ghost sm" onClick={() => copy(v)}>copy</button>
              </div>
            ))}
          </div>
          <div className="btnRow">
          <button onClick={() => setId(makeIdentity())}><Dices size={15} className="btnIcon" /> Generate new</button>
          <button className="ghost" onClick={() => copy(Object.values(id).join('\n'))}><Copy size={15} className="btnIcon" /> Copy all</button>
          </div>
        </div>
        <div className="card">
          <h2>How to use + tips</h2>
          <ul className="tips">
            <li><b>Throwaway signups:</b> paste the email into Temp Email, the password straight into the form.</li>
            <li><b>Testing:</b> devs use these to fill forms without touching real data.</li>
            <li><b>Passwords:</b> always generate a unique one per site — or use Mini Tools for full control.</li>
            <li><b>Never</b> use fake details for KYC, banking, or legal documents. That's fraud.</li>
          </ul>
        </div>
      </div>
    </>
  )
}

/* ---------- Cool sites + custom entries ---------- */
function AddSiteForm({ onAdd, cats }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState('My Stuff')
  const [msg, setMsg] = useState('')
  const submit = () => {
    if (!name.trim() || !url.trim()) { setMsg('Need at least a name + URL.'); return }
    let u = url.trim()
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u
    try { new URL(u) } catch { setMsg('That URL looks invalid.'); return }
    onAdd({ name: name.trim(), url: u, desc: desc.trim() || 'Added by you. No description yet.', cat })
    logEvent('sites', `custom site added: ${name.trim()} (${cat})`)
    setName(''); setUrl(''); setDesc('')
    setMsg('Added! It lives under "' + cat + '" and stays in this browser.')
    setTimeout(() => setMsg(''), 2500)
  }
  return (
    <div className="card">
      <h3><Plus size={16} className="hicon" /> Add your own site</h3>
      <p className="muted">Save anything here — your favorite adblock list, subreddit, host, AI tool. Stored in localStorage, survives reloads.</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Utopia P2P)" />
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL (e.g. example.com)" />
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description — what is it, why is it cool?" />
      <label className="setRow">Category
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="My Stuff">My Stuff</option>
        </select>
      </label>
      <button onClick={submit}>Add site</button>
      {msg && <p className="muted">{msg}</p>}
    </div>
  )
}

function CoolSites({ query, customSites, onAdd, onDelete }) {
  const q = query.toLowerCase()
  const all = [...COOL_SITES.map((s) => ({ ...s, custom: false })), ...customSites.map((s) => ({ ...s, custom: true }))]
  const list = all.filter((s) => (s.name + s.desc + s.cat).toLowerCase().includes(q))
  const cats = [...new Set(all.map((s) => s.cat))]
  const shown = [...new Set(list.map((s) => s.cat))]
  const recs = list.filter((s) => RECOMMENDED.has(s.name))
  const siteCard = (s) => (
    <div key={s.name + s.url} className="card linkWrap">
      <a className="linkMain" href={s.url} target="_blank" rel="noreferrer">
                <h3>{s.name} {s.custom ? <Pencil size={13} className="hicon" /> : <ExternalLink size={13} className="hicon" />} {RECOMMENDED.has(s.name) && <span className="recBadge"><Star size={11} /> Recommended</span>}</h3>
        <p>{s.desc}</p>
      </a>
      {s.custom && <button className="ghost sm" onClick={() => onDelete(s.url)}>remove</button>}
    </div>
  )
  return (
    <>
      <SectionHead title="Cool sites directory" desc={`${all.length} entries and counting. Every entry has a description so you know WHY it's here. Search filters everything. Add your own at the bottom — custom entries are marked with a pencil and can be deleted.`} />
      <div className="notice"><Tv size={15} className="hicon" /> <b>Watch (legal)</b> = free & licensed streaming only. Pirate anime/streaming sites aren't listed — they're illegal and usually bundled with malware. Crunchyroll / Tubi / Pluto / RetroCrush cover most needs for $0.</div>
      {recs.length > 0 && (
        <div>
          <h3 className="cat"><Star size={15} className="hicon" /> Recommended — start with these</h3>
          <p className="catDesc">The essentials I'd install or bookmark first on a fresh machine.</p>
          <div className="cards">
            {recs.map(siteCard)}
          </div>
        </div>
      )}
      {shown.map((c) => (
        <div key={c}>
          <h3 className="cat">{c}</h3>
          <p className="catDesc">{CAT_DESC[c] || ''}</p>
          <div className="cards">
            {list.filter((s) => s.cat === c).map(siteCard)}
          </div>
        </div>
      ))}
      {list.length === 0 && <p className="muted">No matches. Try "free", "anime", "circuit", "host", or "ai".</p>}
      <AddSiteForm onAdd={onAdd} cats={cats.filter((c) => c !== 'My Stuff')} />
    </>
  )
}

/* ---------- Password generator ---------- */
function buildCharset({ pwUpper, pwLower, pwNumbers, pwSymbols, excludeAmbiguous }) {
  let s = ''
  if (pwUpper) s += excludeAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (pwLower) s += excludeAmbiguous ? 'abcdefghijkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz'
  if (pwNumbers) s += excludeAmbiguous ? '23456789' : '0123456789'
  if (pwSymbols) s += excludeAmbiguous ? '!@#$%^&*()-_=+[]{};:,.<>?' : '!@#$%^&*()-_=+[]{};:,.<>?\'"`|'
  if (!s) s = 'abcdefghijkmnpqrstuvwxyz'
  return s
}

function pwStrength(pw, charsetSize) {
  const bits = pw.length * Math.log2(Math.max(2, charsetSize))
  if (bits < 40) return { label: 'Weak — fine for throwaways, not real accounts', pct: 25, cls: 'weak' }
  if (bits < 70) return { label: 'Okay — decent for most logins', pct: 55, cls: 'okay' }
  if (bits < 100) return { label: 'Strong — good for email / banking', pct: 80, cls: 'strong' }
  return { label: 'Beast mode — overkill in the best way', pct: 100, cls: 'beast' }
}

function PasswordCard({ settings, update }) {
  const [pw, setPw] = useState('')
  const [copied, setCopied] = useState(false)
  const charset = useMemo(() => buildCharset(settings), [settings])
  const gen = useCallback(() => {
    const cs = buildCharset(settings)
    const arr = new Uint32Array(settings.pwLength)
    crypto.getRandomValues(arr)
    const p = Array.from(arr, (n) => cs[n % cs.length]).join('')
    setPw(p)
    if (settings.autoCopyPw) copy(p)
  }, [settings])
  useEffect(() => { gen() }, [gen])
  const st = pwStrength(pw, charset.length)
  const toggle = (key) => update({ [key]: !settings[key] })
  const opts = [
    ['pwUpper', 'A–Z', 'Uppercase letters — adds 26 chars to the pool.'],
    ['pwLower', 'a–z', 'Lowercase letters — the readable backbone.'],
    ['pwNumbers', '0–9', 'Numbers — required by most signup forms.'],
    ['pwSymbols', '!@#', 'Symbols — biggest entropy boost per character.'],
    ['excludeAmbiguous', 'No Il1O0', 'Drops look-alikes (I/l/1, O/0) so passwords are copy-safe.'],
  ]
  return (
    <div className="card big">
      <h3><KeyRound size={16} className="hicon" /> Password generator</h3>
      <p className="muted">Cryptographically random (WebCrypto), generated on your device. Toggle the character sets to match a site's rules — bigger pool + longer length = exponentially harder to crack.</p>
      <code className="pw">{pw}</code>
      <div className="meter"><div className={`fill ${st.cls}`} style={{ width: `${st.pct}%` }} /></div>
      <p className="muted">{st.label} · {pw.length} chars · ~{Math.round(pw.length * Math.log2(Math.max(2, charset.length)))} bits of entropy · pool of {charset.length}</p>
      <label className="sliderRow">Length: <b>{settings.pwLength}</b> — longer beats fancier every time.
        <input type="range" min="4" max="128" value={settings.pwLength} onChange={(e) => update({ pwLength: +e.target.value })} />
      </label>
      <div className="checks">
        {opts.map(([k, label, desc]) => (
          <label key={k} className="check" title={desc}><input type="checkbox" checked={settings[k]} onChange={() => toggle(k)} /> <b>{label}</b>&nbsp;{desc}</label>
        ))}
      </div>
      <div className="btnRow">
        <button onClick={gen}>Generate</button>
        <button className="ghost" onClick={() => { copy(pw); setCopied(true); setTimeout(() => setCopied(false), 1200) }}>{copied ? 'Copied!' : 'Copy'}</button>
      </div>
    </div>
  )
}

/* ---------- Extra mini tools (all local, no network) ---------- */
function JsonTool() {
  const [src, setSrc] = useState('{"name":"lootcave","tools":12,"cool":true}')
  const [out, setOut] = useState('')
  const [err, setErr] = useState('')
  const run = (min) => {
    try {
      const o = JSON.parse(src)
      setOut(min ? JSON.stringify(o) : JSON.stringify(o, null, 2))
      setErr('')
    } catch (e) {
      setErr(String(e.message).slice(0, 200))
      setOut('')
    }
  }
  useEffect(() => { run(false) }, [])
  return (
    <div className="card">
      <h3><FileJson size={16} className="hicon" /> JSON formatter</h3>
      <p className="muted">Paste messy JSON — pretty-print it, minify it, or find the syntax error.</p>
      <textarea rows="3" value={src} onChange={(e) => setSrc(e.target.value)} placeholder='{"paste": "json here"}' />
      <div className="btnRow">
        <button onClick={() => run(false)}>Format</button>
        <button className="ghost" onClick={() => run(true)}>Minify</button>
        {out && <button className="ghost" onClick={() => copy(out)}>Copy</button>}
      </div>
      {err && <p className="err">{err}</p>}
      {out && <pre className="dump">{out}</pre>}
    </div>
  )
}

function CaseTool() {
  const [txt, setTxt] = useState('hello cool lootcave site')
  const toTitle = (s) => s.toLowerCase().replace(/(?:^|\s|[._\-/])\S/g, (m) => m.toUpperCase())
  const words = txt.trim().split(/\s+/).filter(Boolean)
  const clean = words.join(' ').replace(/[^a-zA-Z0-9 ]/g, '')
  const cases = {
    UPPER: txt.toUpperCase(),
    lower: txt.toLowerCase(),
    Title: toTitle(txt),
    camel: clean.split(' ').map((w, i) => i === 0 ? w.toLowerCase() : w[0]?.toUpperCase() + w.slice(1).toLowerCase()).join(''),
    snake: clean.toLowerCase().split(' ').join('_'),
    kebab: clean.toLowerCase().split(' ').join('-'),
  }
  const [picked, setPicked] = useState('camel')
  return (
    <div className="card">
      <h3><CaseSensitive size={16} className="hicon" /> Case converter + stats</h3>
      <p className="muted">Variable names, slugs, titles — one click. Live word/char count included.</p>
      <textarea rows="2" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="type something…" />
      <div className="btnRow">
        {Object.keys(cases).map((k) => (
          <button key={k} className={picked === k ? '' : 'ghost sm'} onClick={() => setPicked(k)}>{k}</button>
        ))}
      </div>
      <code className="pw small">{cases[picked]}</code>
      <div className="btnRow">
        <button className="ghost sm" onClick={() => copy(cases[picked])}>Copy</button>
        <span className="muted">{words.length} words · {txt.length} chars · {txt.split('\n').length} lines · ~{Math.max(1, Math.ceil(words.length / 200))} min read</span>
      </div>
    </div>
  )
}

function TimeTool() {
  const [now, setNow] = useState(Date.now())
  const [val, setVal] = useState(String(Math.floor(Date.now() / 1000)))
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  let parsed = null
  const n = Number(val.trim())
  if (val.trim() && !isNaN(n)) {
    const ms = n < 1e12 ? n * 1000 : n
    const d = new Date(ms)
    if (!isNaN(d)) parsed = d
  } else if (val.trim()) {
    const d = new Date(val.trim())
    if (!isNaN(d)) parsed = d
  }
  return (
    <div className="card">
      <h3><Clock size={16} className="hicon" /> Timestamp converter</h3>
      <p className="muted">Unix time ↔ human date. Accepts seconds, ms, or ISO strings.</p>
      <p className="muted">now: <code>{Math.floor(now / 1000)}</code> <button className="ghost sm" onClick={() => { setVal(String(Math.floor(Date.now() / 1000))); copy(String(Math.floor(Date.now() / 1000))) }}>copy</button></p>
      <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="1726400000 or 2026-09-15T12:00:00Z" />
      {parsed
        ? <code className="pw small">{parsed.toLocaleString()} · UTC {parsed.toISOString()}</code>
        : <p className="err">Can't parse that as a date.</p>}
    </div>
  )
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(v, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)]
}

function ColorTool() {
  const [hex, setHex] = useState('#7c5cff')
  const valid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)
  const [r, g, b] = valid ? hexToRgb(hex) : [0, 0, 0]
  const [h, s, l] = valid ? rgbToHsl(r, g, b) : [0, 0, 0]
  return (
    <div className="card">
      <h3><Palette size={16} className="hicon" /> Color picker</h3>
      <p className="muted">Pick a color, get HEX / RGB / HSL for your CSS. Click a swatch to load it.</p>
      <div className="colorRow">
        <input type="color" value={valid ? hex : '#000000'} onChange={(e) => setHex(e.target.value)} />
        <input value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#7c5cff" />
        <span className="swatch" style={{ background: valid ? hex : 'transparent' }} />
      </div>
      {valid ? (
        <>
          <code className="pw small">rgb({r}, {g}, {b}) · hsl({h}, {s}%, {l}%)</code>
          <div className="btnRow">
            <button className="ghost sm" onClick={() => copy(hex)}>HEX</button>
            <button className="ghost sm" onClick={() => copy(`rgb(${r}, ${g}, ${b})`)}>RGB</button>
            <button className="ghost sm" onClick={() => copy(`hsl(${h}, ${s}%, ${l}%)`)}>HSL</button>
          </div>
        </>
      ) : <p className="err">Use #rgb or #rrggbb.</p>}
    </div>
  )
}

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
function LoremTool() {
  const [n, setN] = useState(3)
  const [out, setOut] = useState('')
  const gen = useCallback((k) => {
    const sents = LOREM.match(/[^.!?]+[.!?]+/g) || [LOREM]
    const paras = []
    for (let i = 0; i < k; i++) {
      const count = 3 + Math.floor(Math.random() * 3)
      let p = ''
      for (let j = 0; j < count; j++) p += sents[Math.floor(Math.random() * sents.length)].trim() + ' '
      paras.push(p.trim())
    }
    setOut(paras.join('\n\n'))
  }, [])
  useEffect(() => { gen(n) }, [gen])
  return (
    <div className="card">
      <h3><TextQuote size={16} className="hicon" /> Lorem ipsum</h3>
      <p className="muted">Placeholder text for mockups. <b>{n}</b> paragraph(s).</p>
      <input type="range" min="1" max="8" value={n} onChange={(e) => { setN(+e.target.value); gen(+e.target.value) }} />
      <pre className="dump lorem">{out}</pre>
      <button className="ghost sm" onClick={() => copy(out)}>Copy</button>
    </div>
  )
}

function UrlTool() {
  const [txt, setTxt] = useState('https://example.com/?q=hello world&x=1')
  const [mode, setMode] = useState('encode')
  const out = useMemo(() => {
    try {
      return mode === 'encode' ? encodeURIComponent(txt) : decodeURIComponent(txt)
    } catch {
      return '(invalid input for ' + mode + ')'
    }
  }, [txt, mode])
  return (
    <div className="card">
      <h3><Link2 size={16} className="hicon" /> URL encoder</h3>
      <p className="muted">Fix query strings with spaces + special chars, or decode %20 soup.</p>
      <input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="paste url or text…" />
      <div className="btnRow">
        <button className={mode === 'encode' ? '' : 'ghost sm'} onClick={() => setMode('encode')}>Encode</button>
        <button className={mode === 'decode' ? '' : 'ghost sm'} onClick={() => setMode('decode')}>Decode</button>
        <button className="ghost sm" onClick={() => copy(out)}>Copy</button>
      </div>
      <code className="pw small">{out}</code>
    </div>
  )
}

/* ---------- More mini tools (all local) ---------- */
function DiceTool() {
  const [sides, setSides] = useState(20)
  const [count, setCount] = useState(1)
  const [rolls, setRolls] = useState([])
  const roll = () => {
    const arr = new Uint32Array(count)
    crypto.getRandomValues(arr)
    setRolls(Array.from(arr, (n) => (n % sides) + 1))
  }
  useEffect(() => { roll() }, [])
  return (
    <div className="card">
      <h3><Dices size={16} className="hicon" /> Dice roller</h3>
      <p className="muted">Crypto-random rolls for D&D nights and decisions.</p>
      <div className="btnRow">
        {[4, 6, 8, 10, 12, 20, 100].map((d) => (
          <button key={d} className={sides === d ? '' : 'ghost sm'} onClick={() => setSides(d)}>d{d}</button>
        ))}
      </div>
      <label className="sliderRow">Dice: <b>{count}</b>
        <input type="range" min="1" max="10" value={count} onChange={(e) => setCount(+e.target.value)} />
      </label>
      <code className="pw">{rolls.join(' + ')}{rolls.length > 1 ? ` = ${rolls.reduce((a, b) => a + b, 0)}` : ''}</code>
      <button onClick={roll}>Roll {count}d{sides}</button>
    </div>
  )
}

function HashTool() {
  const [txt, setTxt] = useState('hello lootcave')
  const [algo, setAlgo] = useState('SHA-256')
  const [out, setOut] = useState('')
  useEffect(() => {
    let live = true
    crypto.subtle.digest(algo, new TextEncoder().encode(txt)).then((b) => {
      if (!live) return
      setOut([...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''))
    }).catch(() => setOut('(error)'))
    return () => { live = false }
  }, [txt, algo])
  return (
    <div className="card">
      <h3><Hash size={16} className="hicon" /> Hash generator</h3>
      <p className="muted">Fingerprint any text: verify downloads, compare files, store checksums.</p>
      <textarea rows="2" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="text to hash…" />
      <div className="btnRow">
        {['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map((a) => (
          <button key={a} className={algo === a ? '' : 'ghost sm'} onClick={() => setAlgo(a)}>{a.replace('SHA-', '')}</button>
        ))}
        <button className="ghost sm" onClick={() => copy(out)}>Copy</button>
      </div>
      <code className="pw small">{out}</code>
    </div>
  )
}

const UNITS = {
  Length: { base: 'm', units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 } },
  Weight: { base: 'kg', units: { g: 0.001, kg: 1, t: 1000, oz: 0.0283495, lb: 0.453592 } },
}
function UnitTool() {
  const [cat, setCat] = useState('Length')
  const [val, setVal] = useState('100')
  const [from, setFrom] = useState('cm')
  const [to, setTo] = useState('in')
  const [tempFrom, setTempFrom] = useState('C')
  const [tempTo, setTempTo] = useState('F')
  const toC = (v, u) => u === 'C' ? v : u === 'F' ? (v - 32) * 5 / 9 : v - 273.15
  const fromC = (v, u) => u === 'C' ? v : u === 'F' ? v * 9 / 5 + 32 : v + 273.15
  let result = '—'
  if (cat === 'Temp') {
    const v = parseFloat(val)
    if (!isNaN(v)) result = `${fromC(toC(v, tempFrom), tempTo).toFixed(2)} °${tempTo}`
  } else {
    const u = UNITS[cat].units
    const v = parseFloat(val)
    if (!isNaN(v) && u[from] && u[to]) result = `${(v * u[from] / u[to]).toPrecision(6)} ${to}`
  }
  return (
    <div className="card">
      <h3><Ruler size={16} className="hicon" /> Unit converter</h3>
      <p className="muted">Length, weight, temperature. No more googling "cm to inches".</p>
      <div className="btnRow">
        {['Length', 'Weight', 'Temp'].map((c) => (
          <button key={c} className={cat === c ? '' : 'ghost sm'} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="value" inputMode="decimal" />
      {cat === 'Temp' ? (
        <div className="btnRow">
          <select value={tempFrom} onChange={(e) => setTempFrom(e.target.value)}>{['C', 'F', 'K'].map((u) => <option key={u} value={u}>°{u}</option>)}</select>
          <span>→</span>
          <select value={tempTo} onChange={(e) => setTempTo(e.target.value)}>{['C', 'F', 'K'].map((u) => <option key={u} value={u}>°{u}</option>)}</select>
        </div>
      ) : (
        <div className="btnRow">
          <select value={from} onChange={(e) => setFrom(e.target.value)}>{Object.keys(UNITS[cat].units).map((u) => <option key={u} value={u}>{u}</option>)}</select>
          <span>→</span>
          <select value={to} onChange={(e) => setTo(e.target.value)}>{Object.keys(UNITS[cat].units).map((u) => <option key={u} value={u}>{u}</option>)}</select>
        </div>
      )}
      <code className="pw">{result}</code>
    </div>
  )
}

function TimerTool() {
  const [mins, setMins] = useState(25)
  const [left, setLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    if (left <= 0) {
      setRunning(false)
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const o = ctx.createOscillator()
        o.connect(ctx.destination)
        o.start()
        o.stop(ctx.currentTime + 0.6)
      } catch { /* no audio — fine */ }
      return
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [running, left])
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return (
    <div className="card">
      <h3><Timer size={16} className="hicon" /> Focus timer</h3>
      <p className="muted">Pomodoro-style countdown with a beep at zero. 25/5 is the classic.</p>
      <code className="pw big">{mm}:{ss}</code>
      <div className="btnRow">
        {[5, 10, 25, 45].map((m) => (
          <button key={m} className="ghost sm" onClick={() => { setMins(m); setLeft(m * 60); setRunning(false) }}>{m}m</button>
        ))}
      </div>
      <input type="range" min="1" max="120" value={mins} onChange={(e) => { setMins(+e.target.value); setLeft(+e.target.value * 60); setRunning(false) }} />
      <div className="btnRow">
        <button onClick={() => { if (left <= 0) setLeft(mins * 60); setRunning(!running) }}>{running ? 'Pause' : 'Start'}</button>
        <button className="ghost" onClick={() => { setRunning(false); setLeft(mins * 60) }}>Reset</button>
      </div>
    </div>
  )
}

function ChoiceTool() {
  const [opts, setOpts] = useState('pizza\nsushi\ntacos\nramen')
  const [pick, setPick] = useState('')
  const decide = () => {
    const list = opts.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!list.length) { setPick('(add some options first)'); return }
    const arr = new Uint32Array(1)
    crypto.getRandomValues(arr)
    setPick(list[arr[0] % list.length])
  }
  useEffect(() => { decide() }, [])
  return (
    <div className="card">
      <h3><Target size={16} className="hicon" /> Decision maker</h3>
      <p className="muted">Can't choose? List options, let fate decide. Crypto-random, no mercy.</p>
      <textarea rows="3" value={opts} onChange={(e) => setOpts(e.target.value)} placeholder="one option per line…" />
      <code className="pw">{pick || '…'}</code>
      <div className="btnRow">
        <button onClick={decide}>Decide for me</button>
        {pick && <button className="ghost sm" onClick={() => copy(pick)}>Copy</button>}
      </div>
    </div>
  )
}

function PwCheckTool() {
  const [txt, setTxt] = useState('')
  const pool = (/[a-z]/.test(txt) ? 26 : 0) + (/[A-Z]/.test(txt) ? 26 : 0) + (/\d/.test(txt) ? 10 : 0) + (/[^a-zA-Z0-9]/.test(txt) ? 32 : 0)
  const st = pwStrength(txt, pool || 2)
  return (
    <div className="card">
      <h3><ScanSearch size={16} className="hicon" /> Password strength check</h3>
      <p className="muted">Paste an existing password to grade it. Checked locally — it never leaves this page.</p>
      <input type="password" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="test a password…" autoComplete="off" />
      {txt ? (
        <>
          <div className="meter"><div className={`fill ${st.cls}`} style={{ width: `${st.pct}%` }} /></div>
          <p className="muted">{st.label} · ~{Math.round(txt.length * Math.log2(Math.max(2, pool || 2)))} bits</p>
        </>
      ) : <p className="muted">Waiting for input…</p>}
    </div>
  )
}

function Tools({ settings, update }) {
  const [qr, setQr] = useState('https://opencode.ai')
  const [b64in, setB64in] = useState('hello lootcave')
  const [b64mode, setB64mode] = useState('encode')
  const [uuid, setUuid] = useState('')
  useEffect(() => { setUuid(crypto.randomUUID ? crypto.randomUUID() : String(Date.now())) }, [])
  const b64 = useMemo(() => {
    try {
      return b64mode === 'encode' ? btoa(b64in) : atob(b64in)
    } catch { return '(invalid input for ' + b64mode + ')' }
  }, [b64in, b64mode])
  return (
    <>
      <SectionHead title="Mini tools" desc="Small utilities that run entirely in your browser. Passwords use crypto-random generation; QR codes render via a free image API; everything else never touches the network." />
      <PasswordCard settings={settings} update={update} />
      <div className="cards">
          <div className="card">
            <h3><Fingerprint size={16} className="hicon" /> UUID v4</h3>
            <p className="muted">Random unique IDs for database rows, test fixtures, filenames.</p>
            <code className="pw small">{uuid}</code>
            <div className="btnRow">
              <button onClick={() => setUuid(crypto.randomUUID())}>New</button>
              <button className="ghost" onClick={() => copy(uuid)}>Copy</button>
            </div>
          </div>
          <div className="card">
            <h3><QrCode size={16} className="hicon" /> QR code</h3>
            <p className="muted">Type any link or text — great for sharing localhost URLs to your phone.</p>
            <input value={qr} onChange={(e) => setQr(e.target.value)} placeholder="text or url" />
            {qr && <img className="qr" src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qr)}`} alt="qr" />}
          </div>
          <div className="card">
            <h3><Binary size={16} className="hicon" /> Base64 {b64mode}</h3>
            <p className="muted">Encode tokens and payloads — or paste Base64 back to decode it.</p>
            <input value={b64in} onChange={(e) => setB64in(e.target.value)} />
            <div className="btnRow">
              <button className={b64mode === 'encode' ? '' : 'ghost sm'} onClick={() => setB64mode('encode')}>Encode</button>
              <button className={b64mode === 'decode' ? '' : 'ghost sm'} onClick={() => setB64mode('decode')}>Decode</button>
              <button className="ghost sm" onClick={() => copy(b64)}>Copy</button>
            </div>
            <code className="pw small">{b64}</code>
          </div>
          <JsonTool />
          <CaseTool />
          <TimeTool />
          <ColorTool />
          <LoremTool />
          <UrlTool />
          <DiceTool />
          <HashTool />
          <UnitTool />
          <TimerTool />
          <ChoiceTool />
          <PwCheckTool />
      </div>
    </>
  )
}

/* ---------- Mods hub ---------- */
const MOD_GAMES = [
  {
    game: 'FiveM (GTA RP)', desc: 'Servers, scripts, cars and maps for FiveM roleplay. Stick to the official forum + big releases.',
    sites: [
      { name: 'Cfx.re Forum — Releases', url: 'https://forum.cfx.re/c/development/releases/7', desc: 'Official FiveM forum. Free scripts, maps, vehicles from the community.' },
      { name: 'GTA5-Mods.com', url: 'https://www.gta5-mods.com', desc: 'Huge GTA V mod library — many car/map mods work as FiveM resources.' },
      { name: 'FiveM Docs', url: 'https://docs.fivem.net', desc: 'Server setup + scripting reference for future server owners.' },
    ],
  },
  {
    game: 'Minecraft', desc: 'Mods, modpacks and loaders. Modrinth > CurseForge if you hate ads.',
    sites: [
      { name: 'Modrinth', url: 'https://modrinth.com/mods', desc: 'Open-source, no ads, fast. Mods, datapacks, shaders, plugins.' },
      { name: 'CurseForge', url: 'https://www.curseforge.com/minecraft', desc: 'The biggest catalog: mods + modpacks. Pair with the CurseForge app.' },
      { name: 'Planet Minecraft', url: 'https://www.planetminecraft.com', desc: 'Skins, texture packs, maps and builds from the community.' },
      { name: 'OptiFine', url: 'https://optifine.net/downloads', desc: 'FPS boost + shader support. Only download from the official site.' },
      { name: 'Fabric', url: 'https://fabricmc.net', desc: 'Lightweight modern mod loader. Check NeoForge too for 1.20+.' },
      { name: 'Sodium', url: 'https://modrinth.com/mod/sodium', desc: 'Massive FPS boost, open source. The modern OptiFine alternative.' },
      { name: 'Iris Shaders', url: 'https://irisshaders.net', desc: 'Beautiful shaders that pair perfectly with Sodium.' },
      { name: 'Lunar Client', url: 'https://www.lunarclient.com', desc: 'PvP-focused client with performance mods built in. Free.' },
      { name: 'Feed The Beast', url: 'https://www.feed-the-beast.com', desc: 'Legendary modpacks with their own launcher app.' },
      { name: 'Technic', url: 'https://www.technicpack.net', desc: 'Classic modpack platform, still kicking.' },
    ],
  },
  {
    game: 'GTA V (story mode)', desc: 'Script mods, cars, graphics overhauls. Story mode / FiveM only — modding gets you banned in GTA Online.',
    sites: [
      { name: 'GTA5-Mods.com', url: 'https://www.gta5-mods.com', desc: 'The GTA V mod home: scripts, vehicles, maps, visuals.' },
      { name: 'LCPDFR', url: 'https://www.lcpdfr.com', desc: 'Play as police: LSPDFR + ELS mods and support forums.' },
      { name: 'OpenIV', url: 'https://openiv.com', desc: 'Essential tool for browsing and editing GTA archives.' },
      { name: 'Script Hook V', url: 'http://dev-c.com/GTAV/scripthookv/', desc: "Alexander Blade's hook that .asi script mods require. Official mirror only." },
      { name: 'GTAForums', url: 'https://gtaforums.com', desc: 'Two decades of modding discussion, work-in-progress mods and releases.' },
    ],
  },
  {
    game: 'Bethesda (Skyrim, Fallout)', desc: 'The Nexus ecosystem. Use a real mod manager, not manual drops.',
    sites: [
      { name: 'Nexus Mods', url: 'https://www.nexusmods.com', desc: 'Millions of Skyrim/Fallout/Cyberpunk mods. Free account, optional premium.' },
      { name: 'Bethesda.net Mods', url: 'https://bethesda.net/en/mods', desc: 'Official in-game mod browser, console-friendly.' },
      { name: 'SKSE', url: 'https://skse.silverlock.org', desc: 'Skyrim Script Extender — half of all Skyrim mods need this.' },
      { name: 'F4SE', url: 'https://f4se.silverlock.org', desc: 'Same deal for Fallout 4. Check version match after game updates.' },
      { name: 'Wabbajack', url: 'https://www.wabbajack.org', desc: 'One-click auto-installed modlists. Insanely good, free.' },
    ],
  },
  {
    game: 'The Sims 4', desc: 'Custom content, script mods and builds.',
    sites: [
      { name: 'The Sims Resource', url: 'https://www.thesimsresource.com', desc: 'Largest Sims CC library: hair, clothes, lots, makeup.' },
      { name: 'ModTheSims', url: 'https://modthesims.info', desc: 'Long-running community hub for mods and tuning.' },
      { name: 'CurseForge — Sims 4', url: 'https://www.curseforge.com/sims4', desc: 'Newer official-style hub with app support.' },
      { name: "Carl's Guides", url: 'https://www.carls-sims-4-guide.com', desc: 'Best Sims 4 guides plus curated mod recommendations.' },
      { name: 'SimsVIP', url: 'https://simsvip.com', desc: 'News, patch notes and custom-content finds.' },
    ],
  },
  {
    game: 'Everything else', desc: 'Multi-game hubs covering thousands of titles.',
    sites: [
      { name: 'GameBanana', url: 'https://gamebanana.com', desc: 'Mods for CS, TF2, Zelda, Smash and hundreds more.' },
      { name: 'ModDB', url: 'https://www.moddb.com', desc: 'Classic hub: mods, indie games and addons since forever.' },
      { name: 'Steam Workshop', url: 'https://store.steampowered.com/about/workshops', desc: 'One-click subscribe mods inside Steam. Safest source for Steam games.' },
      { name: 'itch.io', url: 'https://itch.io', desc: 'Indie games, romhacks, fan games and moddable jam entries.' },
      { name: 'Thunderstore', url: 'https://thunderstore.io', desc: 'Modded servers + mods: Valheim, Lethal Company, Risk of Rain and more.' },
      { name: 'ModWorkshop', url: 'https://modworkshop.net', desc: 'Newer community hub covering various games.' },
    ],
  },
  {
    game: 'Mod managers', desc: 'Install these before touching a single zip. They handle load order, conflicts and uninstalls.',
    sites: [
      { name: 'Vortex (Nexus)', url: 'https://www.nexusmods.com/about/vortex/', desc: 'Beginner-friendly manager for Nexus games.' },
      { name: 'Mod Organizer 2', url: 'https://github.com/ModOrganizer2/modorganizer', desc: 'Power-user Bethesda manager. Keeps your game folder clean.' },
      { name: 'Prism Launcher', url: 'https://prismlauncher.org', desc: 'Open-source Minecraft launcher: instances, Modrinth + CurseForge built in.' },
      { name: 'CurseForge App', url: 'https://www.curseforge.com/download/app', desc: 'One-click Minecraft/WoW modpacks. Easiest start.' },
      { name: 'Modrinth App', url: 'https://modrinth.com/app', desc: 'Official open-source Minecraft launcher from the Modrinth team.' },
      { name: 'ATLauncher', url: 'https://atlauncher.com', desc: 'Classic Minecraft instances + modpacks, open source.' },
    ],
  },
]

function Mods({ query }) {
  const q = query.toLowerCase()
  const games = MOD_GAMES.map((g) => ({
    ...g,
    sites: g.sites.filter((s) => (g.game + s.name + s.desc).toLowerCase().includes(q)),
  })).filter((g) => g.sites.length > 0)
  return (
    <>
      <SectionHead title="Mod hubs" desc="Where to get mods for FiveM, Minecraft, GTA V and basically every moddable game — the communities everyone actually uses, not shady re-upload aggregators." />
      <div className="notice"><ShieldCheck size={15} className="hicon" /> <b>Mod safety:</b> download from the hubs below, never random Discord links. Scan archives (VirusTotal tab ↑), avoid any "mod" that is a <b>.exe</b>, back up saves first — and keep story-mode mods out of <b>GTA Online</b> unless you enjoy bans.</div>
      {games.map((g) => (
        <div key={g.game}>
          <h3 className="cat">{g.game}</h3>
          <p className="catDesc">{g.desc}</p>
          <div className="cards">
            {g.sites.map((s) => (
              <a key={s.name} className="card link" href={s.url} target="_blank" rel="noreferrer">
                <h3>{s.name} <ExternalLink size={13} className="hicon" /></h3>
                <p>{s.desc}</p>
              </a>
            ))}
          </div>
        </div>
      ))}
      {games.length === 0 && <p className="muted">No matches. Try "minecraft", "gta" or "manager".</p>}
    </>
  )
}

/* ---------- Downloader (yt-dlp command generator + tools) ---------- */
const DL_TOOLS = [
  { name: 'Cobalt', url: 'https://cobalt.tools', desc: 'Paste a link (YouTube, TikTok, X…), download MP4/MP3 in browser. No install, no watermark.' },
  { name: 'yt-dlp', url: 'https://github.com/yt-dlp/yt-dlp', desc: 'The command-line king: 1000+ sites, best quality, playlists, subs. Free forever.' },
  { name: '4K Video Downloader', url: 'https://www.4kdownload.com', desc: 'Desktop app with a simple paste-and-go UI. Free tier covers casual use.' },
  { name: 'MediaHuman', url: 'https://www.mediahuman.com', desc: 'Clean YouTube-to-MP3/MP4 converter app. No browser popups.' },
  { name: 'Seal (Android)', url: 'https://github.com/JunkFood02/Seal', desc: 'Free open-source Android downloader powered by yt-dlp.' },
]

function Downloader() {
  const [url, setUrl] = useState('')
  const [fmt, setFmt] = useState('mp3')
  const [copied, setCopied] = useState(false)
  const target = url.trim() || 'PASTE_URL_HERE'
  const cmds = {
    mp3: `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "%(title)s.%(ext)s" "${target}"`,
    mp4: `yt-dlp -f "bv*[height<=1080]+ba/b[height<=1080]/b" --merge-output-format mp4 -o "%(title)s.%(ext)s" "${target}"`,
    best: `yt-dlp --merge-output-format mp4 --playlist-items 1:20 -o "%(title)s.%(ext)s" "${target}"`,
  }
  const fmtDesc = {
    mp3: 'Best-quality MP3 audio. Needs ffmpeg installed (see setup below).',
    mp4: '1080p video + best audio merged to MP4. The everyday pick.',
    best: 'Best MP4 + first 20 playlist items — delete the playlist flag for single videos.',
  }
  const doCopy = () => { copy(cmds[fmt]); setCopied(true); setTimeout(() => setCopied(false), 1200) }
  return (
    <>
      <SectionHead title="Video and audio downloader" desc="A static site can't rip YouTube by itself — that needs real software. So this page gives you the next best thing: a command generator for yt-dlp (the best tool) plus no-install alternatives." />
      <div className="notice"><Scale size={15} className="hicon" /> <b>Keep it legal:</b> download your own uploads, Creative Commons, or royalty-free stuff. Ripping copyrighted music/videos breaks YouTube's ToS (and often the law).</div>
      <div className="grid2">
        <div className="card big">
          <h3><span className="step">1</span> Paste a link, pick a format</h3>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" />
          <div className="btnRow">
            {['mp3', 'mp4', 'best'].map((f) => (
              <button key={f} className={fmt === f ? '' : 'ghost sm'} onClick={() => setFmt(f)}>{f === 'mp3' ? <><Music size={14} className="btnIcon" /> MP3</> : f === 'mp4' ? 'MP4 1080p' : 'Playlist MP4'}</button>
            ))}
          </div>
          <p className="muted">{fmtDesc[fmt]}</p>
          <h3><span className="step">2</span> Run this in a terminal</h3>
          <code className="pw small">{cmds[fmt]}</code>
          <div className="btnRow">
            <button onClick={doCopy}>{copied ? 'Copied!' : 'Copy command'}</button>
          </div>
          <h3><span className="step">3</span> First-time setup (Windows, one time)</h3>
          <code className="pw small">winget install -e --id yt-dlp.yt-dlp</code>
          <code className="pw small">winget install -e --id Gyan.FFmpeg</code>
          <p className="muted">Install both, restart the terminal, then the commands above just work. Mac: <code>brew install yt-dlp ffmpeg</code>.</p>
        </div>
        <div className="card">
          <h3>No-install options</h3>
          <p className="muted">Don't want a terminal? These download straight from the browser or a simple app.</p>
          {DL_TOOLS.map((t) => (
            <a key={t.name} className="linkRow" href={t.url} target="_blank" rel="noreferrer">
              <b>{t.name}</b><span>{t.desc}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}

/* ---------- Essential software ---------- */
const SOFTWARE = [
  {
    group: 'Browsers', desc: 'Your window to the internet. Pick one that respects you.',
    apps: [
      { name: 'Firefox', url: 'https://www.mozilla.org/firefox/new/', desc: 'Independent, private, extension-friendly. The power-user default.' },
      { name: 'Brave', url: 'https://brave.com', desc: 'Chromium speed without Google + built-in adblock.' },
    ],
  },
  {
    group: 'Media', desc: 'Play, record and convert anything.',
    apps: [
      { name: 'VLC', url: 'https://www.videolan.org', desc: 'Plays literally everything. Free forever, no codecs needed.' },
      { name: 'OBS Studio', url: 'https://obsproject.com', desc: 'Record and stream like a pro. Free, open source.' },
      { name: 'Audacity', url: 'https://www.audacityteam.org', desc: 'Free audio editor for podcasts, memes and voiceovers.' },
      { name: 'ShareX', url: 'https://getsharex.com', desc: 'Screenshots, GIFs, screen recordings with instant upload. Windows power tool.' },
      { name: 'HandBrake', url: 'https://handbrake.fr', desc: 'Convert and shrink any video. Free and fast.' },
    ],
  },
  {
    group: 'Utilities', desc: 'Small apps that make Windows (or any OS) way better.',
    apps: [
      { name: 'Everything', url: 'https://www.voidtools.com', desc: 'Find any file on Windows instantly as you type.' },
      { name: 'PowerToys', url: 'https://github.com/microsoft/PowerToys', desc: "Microsoft's own power tools: FancyZones, PowerRename, color picker." },
      { name: '7-Zip', url: 'https://www.7-zip.org', desc: 'Open any archive. Tiny, free, no nag screens.' },
      { name: 'Notepad++', url: 'https://notepad-plus-plus.org', desc: 'Notepad on steroids for code, logs and quick notes.' },
      { name: 'EarTrumpet', url: 'https://github.com/File-New-Project/EarTrumpet', desc: 'Per-app volume control Windows should have built in.' },
      { name: 'AutoHotkey', url: 'https://www.autohotkey.com', desc: 'Automate keys and clicks with tiny scripts.' },
    ],
  },
  {
    group: 'Dev tools', desc: 'Write code, manage versions, run things.',
    apps: [
      { name: 'VS Code', url: 'https://code.visualstudio.com', desc: 'The editor everyone uses. Free with a huge extension market.' },
      { name: 'Git', url: 'https://git-scm.com', desc: 'Version control. Learn five commands and you are set.' },
      { name: 'Python', url: 'https://www.python.org/downloads/', desc: 'Easiest first language with libraries for everything.' },
      { name: 'Node.js', url: 'https://nodejs.org', desc: 'JavaScript outside the browser. Powers this very site.' },
      { name: 'Windows Terminal', url: 'https://github.com/microsoft/terminal', desc: 'Modern tabbed terminal. Grab it from the Microsoft Store.' },
    ],
  },
  {
    group: 'Gaming', desc: 'Stores and library managers.',
    apps: [
      { name: 'Steam', url: 'https://store.steampowered.com/about/', desc: 'The PC game store. Wishlist everything, buy on seasonal sales.' },
      { name: 'Heroic Launcher', url: 'https://heroicgameslauncher.com', desc: 'Open-source Epic + GOG launcher for Windows and Linux.' },
      { name: 'Playnite', url: 'https://playnite.link', desc: 'Every game library in one pretty shelf. Free, open source.' },
    ],
  },
  {
    group: 'Chat & mail', desc: 'Talk to humans.',
    apps: [
      { name: 'Discord', url: 'https://discord.com/download', desc: 'Voice, servers, streaming. Where every community lives.' },
      { name: 'Thunderbird', url: 'https://www.thunderbird.net', desc: 'Free desktop email that respects you. Handles all providers.' },
    ],
  },
  {
    group: 'Security', desc: 'Second opinions for your PC.',
    apps: [
      { name: 'Malwarebytes Free', url: 'https://www.malwarebytes.com/mwb-download', desc: 'On-demand malware scans. Free tier is enough as backup.' },
    ],
  },
]

function Software({ query }) {
  const q = query.toLowerCase()
  const groups = SOFTWARE.map((g) => ({
    ...g,
    apps: g.apps.filter((a) => (g.group + a.name + a.desc).toLowerCase().includes(q)),
  })).filter((g) => g.apps.length > 0)
  return (
    <>
      <SectionHead title="Essential software" desc="The free apps nearly everyone ends up installing: browsers, players, utilities, dev tools, launchers. All free tiers or fully free — no trials masquerading as freeware." />
      {groups.map((g) => (
        <div key={g.group}>
          <h3 className="cat">{g.group}</h3>
          <p className="catDesc">{g.desc}</p>
          <div className="cards">
            {g.apps.map((a) => (
              <a key={a.name} className="card link" href={a.url} target="_blank" rel="noreferrer">
                <h3>{a.name} <ExternalLink size={13} className="hicon" /></h3>
                <p>{a.desc}</p>
              </a>
            ))}
          </div>
        </div>
      ))}
      {groups.length === 0 && <p className="muted">No matches. Try "browser", "video" or "terminal".</p>}
    </>
  )
}

/* ---------- Settings ---------- */
function Settings({ settings, update, reset }) {
  return (
    <>
      <SectionHead title="Settings" desc="Everything here saves automatically to localStorage — no account, no server. Themes apply instantly across the whole site." />
      <div className="grid2">
        <div className="card big">
          <h3 className="cat">Theme — pick your vibe</h3>
          <div className="themeGrid">
            {THEMES.map((t) => {
              const Icon = t.icon
              return (
                <button key={t.id} className={settings.theme === t.id ? 'theme active' : 'theme'} onClick={() => update({ theme: t.id })}>
                  <b><Icon size={15} className="hicon" />{t.name}</b><span>{t.desc}</span>
                </button>
              )
            })}
          </div>
          <h3 className="cat">Appearance</h3>
          <label className="setRow">Font size — scales all text site-wide.
            <select value={settings.fontScale} onChange={(e) => update({ fontScale: e.target.value })}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
          <label className="setRow">Compact cards — denser grid, less padding.
            <input type="checkbox" checked={settings.compact} onChange={(e) => update({ compact: e.target.checked })} />
          </label>
          <label className="setRow">Custom accent color — overrides every theme's highlight.
            <span className="accentRow">
              <input type="color" value={settings.accent || '#7c5cff'} onChange={(e) => update({ accent: e.target.value })} />
              {settings.accent && <button className="ghost sm" onClick={() => update({ accent: '' })}>theme default</button>}
            </span>
          </label>
          <label className="setRow">Reduce motion — kills animations and transitions.
            <input type="checkbox" checked={settings.reduceMotion} onChange={(e) => update({ reduceMotion: e.target.checked })} />
          </label>
          <label className="setRow">Hide tab descriptions — cleaner header.
            <input type="checkbox" checked={settings.hideBlurbs} onChange={(e) => update({ hideBlurbs: e.target.checked })} />
          </label>
          <h3 className="cat">Behavior</h3>
          <label className="setRow">Default tab — what opens when you reload.
            <select value={settings.defaultTab} onChange={(e) => update({ defaultTab: e.target.value })}>
              {TABS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          <label className="setRow">Inbox auto-refresh (seconds) — how often Temp Email checks for mail.
            <input type="number" min="5" max="120" value={settings.refreshSec} onChange={(e) => update({ refreshSec: Math.min(120, Math.max(5, +e.target.value || 12)) })} />
          </label>
          <h3 className="cat">Mini Tools</h3>
          <label className="setRow">Auto-copy passwords — new password hits clipboard on generate.
            <input type="checkbox" checked={settings.autoCopyPw} onChange={(e) => update({ autoCopyPw: e.target.checked })} />
          </label>
          <div className="btnRow">
            <button className="ghost" onClick={reset}>Reset everything to defaults</button>
          </div>
        </div>
        <div className="card">
          <h2>Where things live</h2>
          <ul className="tips">
            <li><b>Settings</b> → <code>lootbox-settings</code> in localStorage.</li>
            <li><b>Your custom sites</b> → <code>lootbox-custom-sites</code> in localStorage.</li>
            <li><b>Password defaults</b> (length, A–Z, a–z, 0–9, symbols, ambiguous) persist too — set them in Mini Tools.</li>
            <li>Clear browser site data to wipe it all.</li>
          </ul>
        </div>
      </div>
    </>
  )
}

/* ---------- Admin (password-gated diagnostics) ---------- */
async function sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('lootbox-salt::' + s))
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

function storageBytes() {
  let n = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      n += (k?.length || 0) + (localStorage.getItem(k)?.length || 0)
    }
  } catch { /* ignore */ }
  return n
}

function Admin({ customSites, onDeleteSite, onWipe }) {
  const [authed, setAuthed] = useState(sessionStorage.getItem('lootbox-admin') === '1')
  const [username, setUsername] = useState('EllingsenSian')
  const [pw, setPw] = useState('')
  const [isSetup, setIsSetup] = useState(localStorage.getItem('lootbox-admin-user') == null)
  const [msg, setMsg] = useState('')
  const [events, setEvents] = useState(getEvents)
  const [health, setHealth] = useState({})
  const [checking, setChecking] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPw, setNewPw] = useState('')

  const fails = +(localStorage.getItem('lootbox-admin-fails') || 0)
  const lockedUntil = +(localStorage.getItem('lootbox-admin-lock') || 0)
  const locked = Date.now() < lockedUntil

  const login = async () => {
    if (locked) { setMsg('Locked — too many attempts. Wait a bit.'); return }
    const h = await sha256(username + '::' + pw)
    if (isSetup) {
      if (username.trim().length < 3) { setMsg('Username needs 3+ characters.'); return }
      if (pw.length < 4) { setMsg('Pick a password of at least 4 characters.'); return }
      localStorage.setItem('lootbox-admin-user', username.trim())
      localStorage.setItem('lootbox-admin-hash', h)
      setIsSetup(false)
      setAuthed(true)
      sessionStorage.setItem('lootbox-admin', '1')
      logEvent('admin', 'admin credentials created')
      setMsg('')
    } else if (username === localStorage.getItem('lootbox-admin-user') && h === localStorage.getItem('lootbox-admin-hash')) {
      localStorage.setItem('lootbox-admin-fails', '0')
      setAuthed(true)
      sessionStorage.setItem('lootbox-admin', '1')
      logEvent('admin', 'login ok')
      setMsg('')
    } else {
      const f = fails + 1
      localStorage.setItem('lootbox-admin-fails', String(f))
      if (f >= 5) {
        localStorage.setItem('lootbox-admin-lock', String(Date.now() + 30000))
        localStorage.setItem('lootbox-admin-fails', '0')
        setMsg('5 wrong tries — locked for 30s.')
      } else {
        setMsg(`Wrong username or password (${f}/5).`)
      }
      logEvent('admin', 'failed login attempt')
    }
    setPw('')
  }

  const logout = () => {
    setAuthed(false)
    sessionStorage.removeItem('lootbox-admin')
    logEvent('admin', 'logout')
  }

  const changeCreds = async () => {
    if (newUsername.trim().length < 3) { setMsg('New username needs 3+ characters.'); return }
    if (newPw.length < 4) { setMsg('New password needs 4+ characters.'); return }
    localStorage.setItem('lootbox-admin-user', newUsername.trim())
    localStorage.setItem('lootbox-admin-hash', await sha256(newUsername.trim() + '::' + newPw))
    setNewUsername('')
    setNewPw('')
    setMsg('Credentials updated — use them next login.')
    logEvent('admin', 'credentials changed')
  }

  const ping = async (key, fn) => {
    setHealth((h) => ({ ...h, [key]: { status: 'checking…' } }))
    const t0 = performance.now()
    try {
      const detail = await fn()
      setHealth((h) => ({ ...h, [key]: { status: 'ok', ms: Math.round(performance.now() - t0), detail } }))
    } catch (e) {
      setHealth((h) => ({ ...h, [key]: { status: 'fail', detail: String(e.message).slice(0, 160) } }))
    }
  }

  const runHealth = async () => {
    setChecking(true)
    await ping('1secmail (live inbox route)', async () => {
      const { route, ms } = await fetch1sec('?action=getDomainList')
      return `via ${route}, ${ms}ms`
    })
    await ping('mail.tm API', async () => {
      const r = await fetch('https://api.mail.tm/domains')
      if (!r.ok) throw new Error('HTTP ' + r.status)
      return 'reachable (browser CORS allowlisted to mail.tm only — expected fail here is normal)'
    }).catch(() => {})
    await ping('QR image API', async () => {
      await new Promise((res, rej) => {
        const img = new Image()
        img.onload = res
        img.onerror = () => rej(new Error('image failed to load'))
        img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=10x10&data=ping'
      })
      return 'image rendered'
    })
    setChecking(false)
    logEvent('admin', 'health check run')
    setEvents(getEvents())
  }

  if (!authed) {
    return (
      <>
        <SectionHead title="Admin area" desc="Everything behind this lock is local: stats, API health, the event log, and data controls. No server, no tracking — it just reads your own browser storage." />
        <div className="card lockWrap">
          <h2>{isSetup ? 'Create your admin login' : 'Admin login'}</h2>
          <p className="muted">{isSetup ? 'First visit — choose the username + password that will guard this page. Only a hash is stored, on this device only.' : 'Username + password required. Small-league security: it stops casual snoopers, not someone reading your files.'}</p>
          <div className="lockCol">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" autoComplete="username" />
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} placeholder={isSetup ? 'new password' : 'password'} autoComplete={isSetup ? 'new-password' : 'current-password'} />
            <button onClick={login} disabled={locked}>{isSetup ? 'Create + enter' : 'Unlock'}</button>
          </div>
          {msg && <p className="err">{msg}</p>}
          {locked && <p className="muted">Locked until {new Date(lockedUntil).toLocaleTimeString()}.</p>}
        </div>
      </>
    )
  }

  const visits = +(localStorage.getItem('lootbox-visits') || 0)
  const firstSeen = localStorage.getItem('lootbox-firstseen') || '—'
  const settings = loadSettings()

  return (
    <>
      <SectionHead title="Admin dashboard" desc="Live view of this site's local state. Everything here lives in your browser — nothing is sent anywhere." />
      <div className="btnRow">
        <button className="ghost" onClick={() => setEvents(getEvents())}><RefreshCw size={14} className="btnIcon" /> Refresh log</button>
        <button className="ghost" onClick={logout}>Lock page</button>
      </div>
      <div className="cards">
        <div className="card"><h3><MousePointerClick size={16} className="hicon" /> visits</h3><p className="bigNum">{visits}</p><p className="muted">page loads · first seen {firstSeen}</p></div>
        <div className="card"><h3><HardDrive size={16} className="hicon" /> storage</h3><p className="bigNum">{(storageBytes() / 1024).toFixed(1)} KB</p><p className="muted">localStorage used · {customSites.length} custom sites · {events.length} logged events</p></div>
        <div className="card"><h3><Palette size={16} className="hicon" /> theme</h3><p className="bigNum">{settings.theme}</p><p className="muted">font {settings.fontScale} · default tab {settings.defaultTab} · refresh {settings.refreshSec}s</p></div>
      </div>
      <div className="grid2">
        <div className="card big">
          <h3><Wifi size={16} className="hicon" /> API health {checking ? '(checking…)' : ''}</h3>
          <p className="muted">Runs real requests from your browser and reports what happens — including expected CORS blocks.</p>
          <div className="btnRow"><button onClick={runHealth} disabled={checking}>{checking ? 'Running…' : 'Run health check'}</button></div>
          {Object.entries(health).map(([k, v]) => (
            <div key={k} className="row healthRow">
              <span>{k}</span>
              <code className={v.status === 'ok' ? 'ok' : v.status === 'fail' ? 'bad' : ''}>{v.status}{v.ms != null ? ` · ${v.ms}ms` : ''}{v.detail ? ` — ${v.detail}` : ''}</code>
            </div>
          ))}
          {Object.keys(health).length === 0 && <p className="muted">Not run yet.</p>}
        </div>
        <div className="card">
          <h3><ClipboardList size={16} className="hicon" /> Event log</h3>
          <p className="muted">Last {events.length} events (network attempts, logins, site adds). Newest first.</p>
          <div className="logBox">
            {events.length === 0 && <p className="muted">Empty — generate an inbox or add a site.</p>}
            {events.map((e, i) => (
              <div key={i} className="logLine"><span>[{e.t.slice(11, 19)}]</span> <b>{e.type}</b> {e.msg}</div>
            ))}
          </div>
          <button className="ghost sm" onClick={() => { localStorage.removeItem('lootbox-events'); setEvents([]) }}>Clear log</button>
        </div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3><Globe size={16} className="hicon" /> Your custom sites ({customSites.length})</h3>
          {customSites.length === 0 && <p className="muted">None yet — add some from Cool Sites.</p>}
          {customSites.map((s) => (
            <div key={s.url} className="row">
              <span>{s.cat}</span>
              <code>{s.name}</code>
              <button className="ghost sm" onClick={() => onDeleteSite(s.url)}>remove</button>
            </div>
          ))}
        </div>
        <div className="card">
          <h3><SettingsIcon size={16} className="hicon" /> Raw settings</h3>
          <pre className="dump">{JSON.stringify(settings, null, 2)}</pre>
          <h3><KeyRound size={16} className="hicon" /> Change admin login</h3>
          <p className="muted">Signed in as <b>{localStorage.getItem('lootbox-admin-user')}</b>. Changing either field logs you out to the new credentials.</p>
          <div className="lockCol">
            <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="new username" autoComplete="username" />
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="new password" autoComplete="new-password" />
            <button onClick={changeCreds}>Update login</button>
          </div>
          {msg && <p className="muted">{msg}</p>}
          <h3><TriangleAlert size={16} className="hicon" /> Danger zone</h3>
          <div className="btnRow">
            <button className="ghost" onClick={() => onWipe('sites')}>Delete custom sites</button>
            <button className="ghost" onClick={() => onWipe('events')}>Clear event log</button>
            <button className="ghost" onClick={() => onWipe('all')}>Wipe ALL local data</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [tab, setTab] = useState(settings.defaultTab || 'home')
  const [query, setQuery] = useState('')
  const [customSites, setCustomSites] = useState(loadCustomSites)

  useEffect(() => {
    localStorage.setItem('lootbox-settings', JSON.stringify(settings))
    document.documentElement.dataset.theme = settings.theme
    document.documentElement.dataset.font = settings.fontScale
    document.documentElement.classList.toggle('compact', settings.compact)
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion)
    if (settings.accent) document.documentElement.style.setProperty('--accent', settings.accent)
    else document.documentElement.style.removeProperty('--accent')
  }, [settings])

  useEffect(() => {
    localStorage.setItem('lootbox-custom-sites', JSON.stringify(customSites))
  }, [customSites])

  useEffect(() => {
    try {
      localStorage.setItem('lootbox-visits', String(+(localStorage.getItem('lootbox-visits') || 0) + 1))
      if (!localStorage.getItem('lootbox-firstseen')) localStorage.setItem('lootbox-firstseen', new Date().toLocaleString())
    } catch { /* ignore */ }
  }, [])

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }))
  const go = (id) => { setTab(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const addSite = (s) => setCustomSites((arr) => [...arr.filter((x) => x.url !== s.url), s])
  const delSite = (url) => {
    setCustomSites((arr) => arr.filter((x) => x.url !== url))
    logEvent('sites', 'custom site removed: ' + url)
  }
  const wipe = (what) => {
    if (!confirm(`Really ${what === 'all' ? 'WIPE ALL local data' : 'delete ' + what}?`)) return
    if (what === 'sites' || what === 'all') setCustomSites([])
    if (what === 'events' || what === 'all') localStorage.removeItem('lootbox-events')
    if (what === 'all') {
      ['lootbox-settings', 'lootbox-custom-sites', 'lootbox-events', 'lootbox-admin-hash', 'lootbox-admin-user', 'lootbox-admin-fails', 'lootbox-admin-lock', 'lootbox-visits', 'lootbox-firstseen'].forEach((k) => localStorage.removeItem(k))
      sessionStorage.removeItem('lootbox-admin')
      location.reload()
    }
    logEvent('admin', 'wiped: ' + what)
  }

  return (
    <div className="app">
      <header className="top">
        <div className="logoRow">
          <div className="logo"><Gem size={30} className="logoIcon" /> loot<span>cave</span></div>
          <div className="themeQuick">
            {THEMES.map((t) => (
              <button
                key={t.id}
                title={`${t.name} — ${t.desc}`}
                className={settings.theme === t.id ? 'dot active' : 'dot'}
                data-dot={t.id}
                onClick={() => update({ theme: t.id })}
              />
            ))}
          </div>
        </div>
        <p className="tag">temp numbers · temp emails · fake ids · cool sites — localhost edition</p>
        <div className="searchRow">
          <input
            className="search"
            placeholder="Search numbers, sites, tools… (e.g. 'free', 'circuit', 'anime', 'host', 'ai')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <nav className="tabs">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)} title={TAB_BLURBS[t.id]}>
                <Icon size={15} className="tabIcon" /> {t.label}
              </button>
            )
          })}
        </nav>
        {!settings.hideBlurbs && <p className="tabBlurb">{TAB_BLURBS[tab]}</p>}
      </header>
      <main>
        {tab === 'home' && <Home go={go} />}
        {tab === 'email' && <TempEmail refreshSec={settings.refreshSec} />}
        {tab === 'numbers' && <TempNumbers query={query} />}
        {tab === 'ids' && <FakeIDs />}
        {tab === 'sites' && <CoolSites query={query} customSites={customSites} onAdd={addSite} onDelete={delSite} />}
        {tab === 'mods' && <Mods query={query} />}
        {tab === 'download' && <Downloader />}
        {tab === 'software' && <Software query={query} />}
        {tab === 'tools' && <Tools settings={settings} update={update} />}
        {tab === 'settings' && <Settings settings={settings} update={update} reset={() => setSettings(DEFAULT_SETTINGS)} />}
        {tab === 'admin' && <Admin customSites={customSites} onDeleteSite={delSite} onWipe={wipe} />}
      </main>
      <footer>runs on <code>npm run dev</code> · static only, no backend · stay safe out there</footer>
    </div>
  )
}
