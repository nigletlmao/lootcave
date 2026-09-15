// LootCave UI config — tabs, descriptions, themes.
// Edit labels/descriptions freely. Icons come from lucide.dev (see package.json: lucide-react).
import {
  Coffee, Download, Flower2, Gamepad2, Globe, Home, IdCard, Laptop, Lock, Mail,
  Moon, Send, Settings, Smartphone, Snowflake, Sparkles, Sun, Sunset, Terminal,
  Waves, Wrench, Zap,
} from 'lucide-react'

export const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'email', label: 'Temp Email', icon: Mail },
  { id: 'numbers', label: 'Temp Numbers', icon: Smartphone },
  { id: 'ids', label: 'Fake IDs', icon: IdCard },
  { id: 'sites', label: 'Cool Sites', icon: Globe },
  { id: 'mods', label: 'Mods', icon: Gamepad2 },
  { id: 'download', label: 'Downloader', icon: Download },
  { id: 'software', label: 'Software', icon: Laptop },
  { id: 'recommend', label: 'Recommend', icon: Send },
  { id: 'tools', label: 'Mini Tools', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'admin', label: 'Admin', icon: Lock },
]

export const TAB_BLURBS = {
  home: 'Start here — what lootcave is, quick jumps to every tool, and the house rules.',
  email: 'A real disposable inbox in your browser (via 1secmail) + backup providers. Copy an address, receive mail, no signup.',
  numbers: 'Free public SMS receivers for throwaway OTPs + paid private rentals. Read the safety warning first.',
  ids: 'One-click fake identities for testing signups. Generated locally — nothing leaves your browser.',
  sites: 'Hand-picked directory: security, adblock, sims, design, learning, Reddit gems, hosting, AI, utils + legal streaming. You can add your own.',
  mods: 'Mod hubs for FiveM, Minecraft, GTA V, Bethesda games, Sims and more — plus the managers that install them.',
  download: 'YouTube & media downloading: copy-paste yt-dlp commands for MP3/MP4 plus the best no-install tools.',
  software: 'Essential free software everyone should have — browsers, media, utilities, dev tools, launchers.',
  recommend: 'Found something cool? Send it in — your suggestion lands in the owner inbox.',
  tools: 'Tiny offline-first utilities: password generator with charset control, UUID, QR codes, Base64.',
  settings: 'Make it yours — themes, font size, default tab, inbox refresh speed. Saved in your browser.',
  admin: 'Behind the scenes — login required. Stats, API health checks, event log, and data controls.',
}

export const THEMES = [
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
