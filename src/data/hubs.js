// LootCave hub data — mod sites, downloader tools, essential software.
// Same pattern as directory.js: copy a line, paste under the right game /
// group, save, refresh. Nothing else to touch.

export const MOD_GAMES = [
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

export const DL_TOOLS = [
  { name: 'Cobalt', url: 'https://cobalt.tools', desc: 'Paste a link (YouTube, TikTok, X…), download MP4/MP3 in browser. No install, no watermark.' },
  { name: 'yt-dlp', url: 'https://github.com/yt-dlp/yt-dlp', desc: 'The command-line king: 1000+ sites, best quality, playlists, subs. Free forever.' },
  { name: '4K Video Downloader', url: 'https://www.4kdownload.com', desc: 'Desktop app with a simple paste-and-go UI. Free tier covers casual use.' },
  { name: 'MediaHuman', url: 'https://www.mediahuman.com', desc: 'Clean YouTube-to-MP3/MP4 converter app. No browser popups.' },
  { name: 'Seal (Android)', url: 'https://github.com/JunkFood02/Seal', desc: 'Free open-source Android downloader powered by yt-dlp.' },
]

export const SOFTWARE = [
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
