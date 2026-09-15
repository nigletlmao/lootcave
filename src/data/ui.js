// LootCave UI config - tabs, descriptions, themes.
// Edit labels/descriptions freely. Icons come from lucide.dev (see package.json: lucide-react).
import {
  BookOpen, Bot, Car, Coffee, Download, FileJson, FileUp, Flower2, Gamepad2, Globe, HardDrive, Home, Hourglass, IdCard, Images, Info, KeyRound, Laptop, Laugh, LayoutGrid, ListMusic, Lock, Mail,
  Map, MessageCircle, Moon, Package, Palette, Pencil, Pickaxe, Rocket, ScanSearch, Send, Server, ServerCog, Settings, ShieldCheck, Smartphone, Snowflake, Sparkles, Star, Sun, Sunset, Swords, Terminal,
  TriangleAlert, Tv, Users, Waves, Wrench, Zap,
} from 'lucide-react'

export const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'email', label: 'Temp Email', icon: Mail },
  { id: 'numbers', label: 'Temp Numbers', icon: Smartphone },
  { id: 'ids', label: 'Fake IDs', icon: IdCard },
  { id: 'tempfiles', label: 'Temp Files', icon: FileUp },
  { id: 'sites', label: 'Cool Sites', icon: Globe },
  { id: 'mods', label: 'Mods', icon: Gamepad2 },
  { id: 'fivem', label: 'Server Maker', icon: ServerCog },
  { id: 'download', label: 'Downloader', icon: Download },
  { id: 'playlists', label: 'Playlists', icon: ListMusic },
  { id: 'software', label: 'Software', icon: Laptop },
  { id: 'recommend', label: 'Recommend', icon: Send },
  { id: 'pranks', label: 'Pranks', icon: Laugh },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'tools', label: 'Mini Tools', icon: Wrench },
  { id: 'ai', label: 'AI Helper', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'admin', label: 'Admin', icon: Lock },
  { id: 'about', label: 'About', icon: Info },
  { id: 'system', label: 'System', icon: Server },
  { id: 'guide', label: 'Server Kit', icon: BookOpen },
]

export const NAV_GROUPS = [
  { label: 'Temp stuff', ids: ['email', 'numbers', 'ids', 'tempfiles'] },
  { label: 'Discover', ids: ['sites', 'software', 'mods', 'fivem', 'download', 'playlists'] },
  { label: 'Toolbox', ids: ['tools', 'pranks', 'ai'] },
  { label: 'Community', ids: ['chat', 'guide'] },
  { label: 'System', ids: ['system', 'admin'] },
]

export const TAB_BLURBS = {
  home: 'Start here - what lootcave is, quick jumps to every tool, and the house rules.',
  email: 'A real disposable inbox in your browser (via 1secmail) + backup providers. Copy an address, receive mail, no signup.',
  numbers: 'Free public SMS receivers for throwaway OTPs + paid private rentals. Read the safety warning first.',
  ids: 'One-click fake identities for testing signups. Generated locally - nothing leaves your browser.',
  tempfiles: 'Files that expire: upload once, share the link, gone on a timer. No accounts.',
  sites: 'Hand-picked directory: security, adblock, sims, design, learning, Reddit gems, hosting, AI, utils + legal streaming. You can add your own.',
  mods: 'Mod hubs for FiveM, Minecraft, GTA V, Bethesda games, Sims and more - plus the managers that install them.',
  fivem: 'Build a FiveM server: setup guide, cfg and fxmanifest generators, converters, log doctor, practice console.',
  download: 'YouTube and media downloading: copy-paste yt-dlp commands for MP3/MP4 plus the best no-install tools.',
  playlists: 'Move music between apps: auto-read YouTube playlists, convert any track list, export anywhere.',
  software: 'Essential free software everyone should have - browsers, media, utilities, dev tools, launchers.',
  recommend: 'Found something cool? Send it in - your suggestion lands in the owner inbox.',
  pranks: 'Harmless CMD troll kit: matrix rain, fake hacker terminals, shutdown scare with antidote.',
  chat: 'Live public chat over free Nostr relays. Pick a nickname, no signup.',
  tools: 'Tiny offline-first utilities: password generator with charset control, UUID, QR codes, Base64.',
  ai: 'A free AI helper that runs in your browser: chat, coding help, copy-paste code blocks.',
  settings: 'Make it yours - themes, font size, default tab, inbox refresh speed. Saved in your browser.',
  admin: 'Behind the scenes - login required. Stats, API health checks, event log, and data controls.',
  about: 'What LootCave is, who runs it, the rules, and how to join the community.',
  system: 'Live system status: API health, relay latency, storage breakdown, browser info.',
  guide: 'Steal-worthy Discord building blocks: example layouts, rules, roles and bots for your own server.',
}

export const THEMES = [
  { id: 'midnight', name: 'Midnight', icon: Moon, desc: 'Default dark. Easy on the eyes.', preview: { bg: '#0b0e14', panel: '#131926', border: '#233044', head: '#f2f6fc', muted: '#8b98ad', accent: '#7c5cff' } },
  { id: 'light', name: 'Light', icon: Sun, desc: 'Clean bright mode for daytime.', preview: { bg: '#f4f6fb', panel: '#ffffff', border: '#d8dee9', head: '#101828', muted: '#6b7689', accent: '#5b3df5' } },
  { id: 'neon', name: 'Neon', icon: Zap, desc: 'Cyberpunk pink + cyan on black.', preview: { bg: '#08060f', panel: '#120e24', border: '#3b2568', head: '#ffffff', muted: '#9a86c8', accent: '#ff2fb3' } },
  { id: 'terminal', name: 'Terminal', icon: Terminal, desc: 'Green-on-black hacker mono.', preview: { bg: '#000000', panel: '#061006', border: '#1d4020', head: '#d6ffd6', muted: '#5f9e63', accent: '#22ff55' } },
  { id: 'ocean', name: 'Ocean', icon: Waves, desc: 'Deep blue, calm vibes.', preview: { bg: '#04121f', panel: '#0a2236', border: '#174a6b', head: '#f0faff', muted: '#7ba7c2', accent: '#1e90ff' } },
  { id: 'sunset', name: 'Sunset', icon: Sunset, desc: 'Warm orange dusk tones.', preview: { bg: '#1a0e14', panel: '#2b1620', border: '#5c2b3e', head: '#fff5ee', muted: '#c08a7d', accent: '#ff6b35' } },
  { id: 'dracula', name: 'Dracula', icon: Sparkles, desc: 'The famous purple-on-dark editor theme.', preview: { bg: '#282a36', panel: '#343746', border: '#44475a', head: '#f8f8f2', muted: '#8b90b3', accent: '#bd93f9' } },
  { id: 'nord', name: 'Nord', icon: Snowflake, desc: 'Frosty arctic blues, calm and crisp.', preview: { bg: '#2e3440', panel: '#3b4252', border: '#4c566a', head: '#eceff4', muted: '#8b98ad', accent: '#88c0d0' } },
  { id: 'coffee', name: 'Coffee', icon: Coffee, desc: 'Warm sepia browns for late nights.', preview: { bg: '#1d130e', panel: '#2a1d14', border: '#4a3527', head: '#f7ead9', muted: '#a08066', accent: '#d4a373' } },
  { id: 'rose', name: 'Rose', icon: Flower2, desc: 'Soft light-pink daytime theme.', preview: { bg: '#fdf0f4', panel: '#ffffff', border: '#efc3d4', head: '#381522', muted: '#a97b8f', accent: '#e75480' } },
  { id: 'fmhy', name: 'FMHY', icon: Rocket, desc: 'Wiki-style flagship: sky accents, docs energy.', preview: { bg: '#14161b', panel: '#1d2027', border: '#2e333d', head: '#f2f5f9', muted: '#7d8694', accent: '#7bc5e4' } },
]

export const CAT_META = {
  'Security': { icon: ShieldCheck, color: '#D05A6E' },
  'Adblock & Privacy': { icon: TriangleAlert, color: '#f17c67' },
  'VPN & Privacy Net': { icon: KeyRound, color: '#7aa2f7' },
  'OSINT (legal)': { icon: ScanSearch, color: '#91989F' },
  'Simulators & Playgrounds': { icon: Gamepad2, color: '#49d3e9' },
  'Reddit Gems': { icon: MessageCircle, color: '#FB9966' },
  'Free Hosting': { icon: HardDrive, color: '#BEC23F' },
  'Free AI': { icon: Sparkles, color: '#8A6BBE' },
  'Everyday Utils': { icon: Wrench, color: '#A8D8B9' },
  'Files': { icon: FileJson, color: '#7c82fe' },
  'Dev': { icon: Terminal, color: '#eab308' },
  'Media': { icon: Images, color: '#3ccd93' },
  'Watch (legal)': { icon: Tv, color: '#38bdf8' },
  'Shops & Deals': { icon: Star, color: '#f59e0b' },
  'Create & Design': { icon: Palette, color: '#f472b6' },
  'Learn': { icon: BookOpen, color: '#c084fc' },
  'My Stuff': { icon: Pencil, color: '#94a3b8' },
}

export const GAME_META = {
  'FiveM (GTA RP)': { icon: Car, color: '#ff6b6b' },
  'Minecraft': { icon: Pickaxe, color: '#3ccd93' },
  'GTA V (story mode)': { icon: Map, color: '#f59e0b' },
  'Bethesda (Skyrim, Fallout)': { icon: Swords, color: '#8A6BBE' },
  'The Sims 4': { icon: Users, color: '#f472b6' },
  'Everything else': { icon: LayoutGrid, color: '#38bdf8' },
  'Mod managers': { icon: Package, color: '#BEC23F' },
}

export const GROUP_META = {
  'Browsers': { icon: Globe, color: '#7aa2f7' },
  'Media': { icon: Images, color: '#3ccd93' },
  'Utilities': { icon: Wrench, color: '#A8D8B9' },
  'Dev tools': { icon: Terminal, color: '#eab308' },
  'Gaming': { icon: Gamepad2, color: '#49d3e9' },
  'Chat & mail': { icon: MessageCircle, color: '#FB9966' },
  'Security': { icon: ShieldCheck, color: '#D05A6E' },
  'Create': { icon: Palette, color: '#f472b6' },
}

export const TEMP_META = { icon: Hourglass, color: '#00e5cc' }
export const SMS_META = { icon: Smartphone, color: '#7aa2f7' }
