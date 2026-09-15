// LootCave hub data - mod sites, downloader tools, essential software.
// Same pattern as directory.js: copy a line, paste under the right game /
// group, save, refresh. Nothing else to touch.

export const MOD_GAMES = [
  {
    game: 'FiveM (GTA RP)', desc: 'Servers, scripts, cars and maps for FiveM roleplay. Stick to the official forum + big releases.',
    sites: [
      { name: 'Cfx.re Forum - Releases', url: 'https://forum.cfx.re/c/development/releases/7', desc: 'Official FiveM forum. Free scripts, maps, vehicles from the community.' },
      { name: 'GTA5-Mods.com', url: 'https://www.gta5-mods.com', desc: 'Huge GTA V mod library - many car/map mods work as FiveM resources.' },
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
    game: 'GTA V (story mode)', desc: 'Script mods, cars, graphics overhauls. Story mode / FiveM only - modding gets you banned in GTA Online.',
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
      { name: 'SKSE', url: 'https://skse.silverlock.org', desc: 'Skyrim Script Extender - half of all Skyrim mods need this.' },
      { name: 'F4SE', url: 'https://f4se.silverlock.org', desc: 'Same deal for Fallout 4. Check version match after game updates.' },
      { name: 'Wabbajack', url: 'https://www.wabbajack.org', desc: 'One-click auto-installed modlists. Insanely good, free.' },
    ],
  },
  {
    game: 'The Sims 4', desc: 'Custom content, script mods and builds.',
    sites: [
      { name: 'The Sims Resource', url: 'https://www.thesimsresource.com', desc: 'Largest Sims CC library: hair, clothes, lots, makeup.' },
      { name: 'ModTheSims', url: 'https://modthesims.info', desc: 'Long-running community hub for mods and tuning.' },
      { name: 'CurseForge - Sims 4', url: 'https://www.curseforge.com/sims4', desc: 'Newer official-style hub with app support.' },
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
      { name: 'Vivaldi', url: 'https://vivaldi.com', desc: 'Insanely customizable Chromium with mail, calendar and tab stacks built in.' },
      { name: 'LibreWolf', url: 'https://librewolf.net', desc: 'Firefox hardened for privacy out of the box. No telemetry, ever.' },
      { name: 'Floorp', url: 'https://floorp.app', desc: 'Privacy-first Firefox fork with deep customization. Japanese polish.' },
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
      { name: 'MusicBee', url: 'https://getmusicbee.com', desc: 'The best local music library on Windows. Light and gorgeous.' },
      { name: 'Kdenlive', url: 'https://kdenlive.org', desc: 'Free pro-grade video editor. Open source.' },
      { name: 'MPC-HC', url: 'https://github.com/clsid2/mpc-hc', desc: 'Tiny legendary video player, still maintained by the community.' },
      { name: 'LosslessCut', url: 'https://github.com/mifi/losslesscut', desc: 'Trim videos instantly with zero re-encoding. Open source.' },
    ],
  },
  {
    group: 'Create', desc: 'Pro-grade creative tools that cost $0.',
    apps: [
      { name: 'Blender', url: 'https://www.blender.org', desc: 'Full 3D suite: modeling, animation, VFX. Free forever.' },
      { name: 'GIMP', url: 'https://www.gimp.org', desc: 'Free Photoshop alternative for raster editing.' },
      { name: 'Inkscape', url: 'https://inkscape.org', desc: 'Free vector editor, the Illustrator alternative.' },
      { name: 'Krita', url: 'https://krita.org', desc: 'Digital painting studio. Free, artist-loved.' },
      { name: 'Shotcut', url: 'https://www.shotcut.org', desc: 'Free cross-platform video editor. No watermark.' },
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
      { name: 'WizTree', url: 'https://diskanalyzer.com', desc: "Find what's eating your disk in seconds. Absurdly fast." },
      { name: 'Greenshot', url: 'https://getgreenshot.org', desc: 'Lightweight screenshots with instant annotate and upload.' },
      { name: 'Ditto', url: 'https://github.com/sabrogden/Ditto', desc: 'Clipboard history that actually works. Paste anything you copied today.' },
      { name: 'Bulk Crap Uninstaller', url: 'https://www.bcuninstaller.com', desc: 'Nuke bloatware in bulk, including stubborn leftovers. Free.' },
      { name: 'Patch My PC Home', url: 'https://patchmypc.com/home-updater', desc: 'Update all your apps in one click. Free for home use.' },
      { name: 'Chocolatey', url: 'https://chocolatey.org', desc: 'The Windows package manager. Install apps from the terminal.' },
      { name: 'Scoop', url: 'https://scoop.sh', desc: 'Minimal package manager for dev tools. No admin needed.' },
      { name: 'Rufus', url: 'https://rufus.ie', desc: 'Make bootable USB drives in seconds. Tiny and free.' },
      { name: 'Ventoy', url: 'https://www.ventoy.net', desc: 'One USB, many ISOs. Boot anything from a menu.' },
      { name: 'Windhawk', url: 'https://windhawk.net', desc: 'Tiny mods that fix Windows: taskbar, explorer, everything.' },
      { name: 'ExplorerPatcher', url: 'https://github.com/valinet/ExplorerPatcher', desc: 'Bring back the Windows 10 taskbar and more on Win11.' },
      { name: 'TranslucentTB', url: 'https://github.com/TranslucentTB/TranslucentTB', desc: 'Transparent taskbar. From the Microsoft Store, free.' },
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
      { name: 'GitHub Desktop', url: 'https://desktop.github.com', desc: 'Git with buttons. The perfect first client.' },
      { name: 'Postman', url: 'https://www.postman.com', desc: 'Test APIs without writing code. Free tier.' },
      { name: 'DBeaver', url: 'https://dbeaver.io', desc: 'Free universal database tool, Postgres to SQLite.' },
      { name: 'Neovim', url: 'https://neovim.io', desc: 'Hyperextensible Vim-based editor. Free forever.' },
      { name: 'Docker Desktop', url: 'https://www.docker.com/products/docker-desktop/', desc: 'Run anything in containers. Free for personal use.' },
      { name: 'Insomnia', url: 'https://insomnia.rest', desc: 'Beautiful API client. Free tier covers most testing.' },
      { name: 'Bruno', url: 'https://www.usebruno.com', desc: 'Open-source API client, Git-friendly. Postman alternative.' },
      { name: 'LazyGit', url: 'https://github.com/jesseduffield/lazygit', desc: 'Git with a terminal UI you will actually enjoy.' },
      { name: 'Oh My Posh', url: 'https://ohmyposh.dev', desc: 'Pretty prompt themes for any shell.' },
      { name: 'fnm', url: 'https://github.com/Schniz/fnm', desc: 'Fast Node version manager. nvm without the lag.' },
    ],
  },
  {
    group: 'Gaming', desc: 'Stores and library managers.',
    apps: [
      { name: 'Steam', url: 'https://store.steampowered.com/about/', desc: 'The PC game store. Wishlist everything, buy on seasonal sales.' },
      { name: 'Heroic Launcher', url: 'https://heroicgameslauncher.com', desc: 'Open-source Epic + GOG launcher for Windows and Linux.' },
      { name: 'Playnite', url: 'https://playnite.link', desc: 'Every game library in one pretty shelf. Free, open source.' },
      { name: 'GOG Galaxy', url: 'https://www.gog.com/galaxy', desc: 'DRM-free store client that also imports your other libraries.' },
      { name: 'itch.io app', url: 'https://itch.io/app', desc: 'Indie games with an open-source desktop app.' },
      { name: 'Lutris', url: 'https://lutris.net', desc: 'Open gaming platform for Linux. Every emulator, one library.' },
      { name: 'RetroArch', url: 'https://www.retroarch.com', desc: 'All-in-one retro emulation frontend. Legal software, bring your own dumps.' },
      { name: 'Millennium', url: 'https://steambrew.app', desc: 'Themes, plugins and custom CSS for the Steam client itself. Open source.' },
    ],
  },
  {
    group: 'Chat & mail', desc: 'Talk to humans.',
    apps: [
      { name: 'Discord', url: 'https://discord.com/download', desc: 'Voice, servers, streaming. Where every community lives.' },
      { name: 'Thunderbird', url: 'https://www.thunderbird.net', desc: 'Free desktop email that respects you. Handles all providers.' },
      { name: 'Element', url: 'https://element.io', desc: 'Chat on the open Matrix network. Discord-style, decentralized.' },
      { name: 'Session', url: 'https://getsession.org', desc: 'Private messenger with no phone number required.' },
      { name: 'Vencord', url: 'https://vencord.dev', desc: 'The Discord client mod: themes, plugins, Spotify controls. Against ToS on paper, bans unheard of - your call.' },
      { name: 'Vesktop', url: 'https://vesktop.dev', desc: 'Standalone Discord desktop app with Vencord baked in. Open source.' },
    ],
  },
  {
    group: 'Security', desc: 'Second opinions for your PC.',
    apps: [
      { name: 'Malwarebytes Free', url: 'https://www.malwarebytes.com/mwb-download', desc: 'On-demand malware scans. Free tier is enough as backup.' },
      { name: 'AdwCleaner', url: 'https://www.malwarebytes.com/adwcleaner', desc: 'Removes adware and browser hijackers. Free, no install.' },
      { name: 'ClamAV', url: 'https://www.clamav.net', desc: 'Open-source antivirus engine. Free, cross-platform.' },
      { name: 'KeePassXC', url: 'https://keepassxc.org', desc: 'Offline password manager. Your vault never touches a cloud.' },
      { name: 'VeraCrypt', url: 'https://www.veracrypt.fr', desc: 'Encrypt entire drives. Audited, free, serious.' },
    ],
  },
]

// Harmless prank kit - batch files and CMD one-liners that LOOK scary
// but do nothing. Every one is reversible by closing the window (or the
// abort command for the shutdown scare). Never anything destructive.
export const PRANKS = [
  {
    title: 'Matrix rain',
    kind: 'Batch file',
    desc: 'Endless green falling numbers. Looks elite, does absolutely zero.',
    code: '@echo off\ntitle MATRIX\ncolor 02\n:start\necho %random% %random% %random% %random% %random%\ngoto start',
    note: 'Stop it by closing the window.',
  },
  {
    title: 'Fake hacker terminal',
    kind: 'Batch file',
    desc: 'Prints a dramatic "hacking" sequence with pauses, ends with ACCESS GRANTED.',
    code: '@echo off\ntitle SECURE CONNECTION\ncolor 0a\necho Initializing hack sequence...\nping localhost -n 3 >nul\necho Bypassing firewall... DONE\nping localhost -n 2 >nul\necho Cracking passwords... DONE\necho.\necho ACCESS GRANTED. Just kidding - close this window.\npause',
    note: 'The ping lines are just sleep timers. Nothing connects anywhere.',
  },
  {
    title: 'Totally legit virus scan',
    kind: 'Batch file',
    desc: 'A red "antivirus" scan that finds exactly one gullible friend.',
    code: '@echo off\ntitle ANTIVIRUS PRO 3000\ncolor 0c\necho Scanning C:\\ for viruses...\nping localhost -n 3 >nul\necho Found 0 viruses and 1 gullible friend.\necho (This script does nothing. That is the joke.)\npause',
    note: 'Red text sells the panic. It touches no files.',
  },
  {
    title: 'Shutdown scare (+ abort)',
    kind: 'CMD one-liners',
    desc: 'Starts a 90-second shutdown countdown with a scary message. Fully cancellable.',
    code: 'shutdown -s -t 90 -c "Self-destruct in 90 seconds"',
    extra: 'shutdown -a',
    extraLabel: 'Abort (the antidote - always share this second)',
    note: 'Rule: never send the scare without the abort. Abort works any time before zero.',
  },
  {
    title: 'Drive tree flex',
    kind: 'CMD one-liner',
    desc: 'Prints the entire drive as a giant scrolling tree. Looks insanely technical.',
    code: 'tree C:\\ /f | more',
    note: 'Press any key to scroll, Ctrl+C to stop. Read-only.',
  },
  {
    title: 'Trace the internet',
    kind: 'CMD one-liner',
    desc: 'Shows every hop between you and Google. Movie-hacker vibes, totally legit tool.',
    code: 'tracert 8.8.8.8',
    note: 'tracert is a real diagnostic every admin uses.',
  },
  {
    title: 'Hacker prompt makeover',
    kind: 'CMD one-liners',
    desc: 'Turns a boring terminal green with a HACKER prompt. Pure costume.',
    code: 'title HACKER TERMINAL\ncolor 0a\nprompt HACKER$G',
    note: 'Type `prompt` alone to change it back. Cosmetic only.',
  },
  {
    title: 'Popup message bomb',
    kind: 'LAN (same Wi-Fi)',
    desc: 'Pops a message box on another PC on your network. Classic lab prank.',
    code: 'msg /server:THEIR-PC-NAME * "You have been hacked (not really). Check the Pranks tab."',
    note: 'Find targets with arp -a below. Works on home networks you control - consent only, never strangers or work PCs.',
  },
  {
    title: 'Remote shutdown scare',
    kind: 'LAN (same Wi-Fi)',
    desc: 'Starts a shutdown countdown ON their PC. They can cancel it.',
    code: 'shutdown -m \\\\THEIR-PC-NAME -s -t 60 -c "Virus detected, goodbye"',
    extra: 'shutdown -m \\\\THEIR-PC-NAME -a',
    extraLabel: 'Remote abort (antidote)',
    note: 'Needs admin rights on their PC - so basically your own second PC or a friend who set it up with you. Always pair with the abort.',
  },
  {
    title: "Who's on my Wi-Fi?",
    kind: 'CMD one-liner',
    desc: 'Lists every device on your network. Find prank targets (that you own).',
    code: 'arp -a',
    note: 'Read-only recon. Pair with the lookup below for PC names.',
  },
  {
    title: 'PC name lookup',
    kind: 'CMD one-liner',
    desc: 'Turns an IP from arp -a into a PC name for the popup/shutdown pranks.',
    code: 'nbtstat -A 192.168.1.20',
    note: 'Swap in an IP from your own arp -a list.',
  },
  {
    title: 'Popup spam finale',
    kind: 'LAN (same Wi-Fi)',
    desc: 'Twenty message boxes in a row on their screen. Annoying, dismissible, unforgettable.',
    code: 'for /L %i in (1,1,20) do msg /server:THEIR-PC * "Friendly reminder %i of 20: lock your PC next time"',
    note: 'Paste into CMD (not a .bat - single % works in CMD). Every box closes with one click.',
  },
  {
    title: 'Fake Windows update',
    kind: 'Batch file',
    desc: 'A blue "99% complete, do not turn off" screen. Nothing is updating.',
    code: '@echo off\ntitle Windows Update\ncolor 1f\nmode con cols=80 lines=25\necho.\necho        Working on updates  99%% complete\necho        Do not turn off your PC. (Or do. Nothing is happening.)\necho.\necho        This will take a while. Just kidding - close me.\npause',
    note: 'The %% becomes a single % on screen. Close the window to "finish updating".',
  },
  {
    title: 'Fake blue screen',
    kind: 'Batch file',
    desc: 'The scary blue text of doom. Followed immediately by the punchline.',
    code: '@echo off\ntitle BlueScreen\ncolor 1f\necho A problem has been detected and Windows has been shut down\necho to prevent damage to your computer. Just kidding - nothing happened.\necho.\necho Press any key to "restart" (closes this window).\npause',
    note: 'Only run where the joke lands. Never on someone mid-deadline.',
  },
  {
    title: 'Disk tray poltergeist',
    kind: 'Batch file',
    desc: 'Opens their CD tray on a loop. Ancient magic, still hilarious.',
    code: '@echo off\n:loop\npowershell -c "(New-Object -ComObject WMPlayer.OCX).cdromCollection.item(0).eject()"\nping localhost -n 4 >nul\ngoto loop',
    note: 'Only works on PCs with an actual disk drive. Close the window to exorcise.',
  },
  {
    title: 'Speaker symphony',
    kind: 'PowerShell',
    desc: 'Plays an irritating little jingle on their speakers. Paste into PowerShell.',
    code: '[console]::beep(523,200); [console]::beep(523,200); [console]::beep(523,200); [console]::beep(659,400); [console]::beep(784,400)',
    note: 'Check their volume first if you value the friendship. Frequencies are Hz, second number is ms.',
  },
  {
    title: 'Taskbar vanish',
    kind: 'LAN (same Wi-Fi)',
    desc: 'Kills explorer on their PC: taskbar and desktop icons gone. Fully restorable.',
    code: 'taskkill /s THEIR-PC /im explorer.exe /f',
    extra: 'wmic /node:THEIR-PC process call create "explorer.exe"',
    extraLabel: 'Restore taskbar',
    note: 'Needs admin on their PC and will prompt for credentials. Reboot also fixes everything. Consent only.',
  },
  {
    title: 'Fake format scare',
    kind: 'Batch file',
    desc: 'A red "Formatting C:" progress bar that stalls at 99%. Then the truth.',
    code: '@echo off\ntitle Format C:\ncolor 0c\necho Formatting C:\\ ... 12%% complete\nping localhost -n 2 >nul\necho Formatting C:\\ ... 47%% complete\nping localhost -n 2 >nul\necho Formatting C:\\ ... 99%% complete\nping localhost -n 3 >nul\necho Just kidding. Your files are fine. Close me.\npause',
    note: 'Zero files touched - it only prints text. Reveal the joke fast on nervous victims.',
  },
  {
    title: 'Instant rickroll',
    kind: 'CMD one-liner',
    desc: 'Opens the sacred video in their default browser. A classic for a reason.',
    code: 'start https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    note: 'Needs internet. Combine with the msg popup for a guided tour.',
  },
]

// Temporary file hosts - upload once, share the link, gone on a timer.
// `keep` is the retention badge shown on each card.
export const TEMP_FILES = [
  { name: 'Litterbox', url: 'https://litterbox.catbox.moe', desc: 'Temporary files up to 1GB, no account. The temp-file gold standard.', keep: '72 hours' },
  { name: 'tmpfiles.org', url: 'https://tmpfiles.org', desc: 'One-click uploads, nothing to configure. Blink and it is gone.', keep: '60 minutes' },
  { name: 'Uguu', url: 'https://uguu.se', desc: 'Dead-simple temp uploads with a clean interface.', keep: '3 hours' },
  { name: 'File.io', url: 'https://www.file.io', desc: 'Self-destructs after a single download. Perfect for secrets.', keep: '1 download' },
  { name: '0x0.st', url: 'https://0x0.st', desc: 'Minimalist host straight from the terminal with curl. Tiny files live longest.', keep: '30+ days' },
  { name: 'Gofile', url: 'https://gofile.io', desc: 'Free 10GB shares with no account. Generous and fast.', keep: '10 days idle' },
  { name: 'SwissTransfer', url: 'https://www.swisstransfer.com', desc: 'Up to 50GB free with Swiss privacy. The heavy lifter.', keep: '30 days' },
  { name: 'Catbox', url: 'https://catbox.moe', desc: 'Permanent free hosting, no account. The internet’s junk drawer.', keep: 'permanent' },
]

// Community events shown on the About page. Edit freely: title, date, desc.
export const EVENTS = [
  { title: 'Game night #1', date: 'TBD - vote in Discord', desc: 'First community game night. Game and date get voted in #general.' },
  { title: 'Tool drop Friday', date: 'Every Friday', desc: 'New sites and tools land on LootCave. Fuel comes from the Recommend tab.' },
]

// GTA mod -> FiveM converters and map tools. Verified working, legit sources.
export const FIVEM_CONVERTERS = [
  { name: 'ZeroDream Converter', url: 'https://convert.cfx.rs/en', desc: 'By Akkariin: GTA5-Mods straight to FiveM-ready zips, online. Also a userscript for one-click convert on gta5-mods pages. Start here.', tag: 'online - recommended' },
  { name: 'ThomasCreasey Converter', url: 'https://github.com/ThomasCreasey/FiveM-GTA5Mods-Converter', desc: 'Open-source vehicle converter (beta): paste a GTA5-Mods link + spawn code, get a resource folder.' },
  { name: 'vscorpio AddOn Converter', url: 'https://forum.cfx.re/t/gta5-mods-to-fivem-addon-converter/1142154', desc: 'Desktop vehicle converter with a vMenu addons.json helper. Needs your GTA folder set.' },
  { name: 'YMAP Props Converter', url: 'https://github.com/LegendsTeamDev/YMAP-to-FiveM-quant-Converter', desc: 'Node tool: turns YMAP XML into prop tables for scripts.' },
  { name: 'OpenIV', url: 'https://openiv.com', desc: 'Extract mod archives before converting anything. Required first step.' },
  { name: 'CodeWalker', url: 'https://github.com/dexyfex/CodewalkerRPF', desc: 'Map editor for custom MLOs and map mods. For builders.' },
]

// Real FXServer / txAdmin console commands for the cheat sheet + practice terminal.
export const FIVEM_COMMANDS = [
  { cmd: 'help', desc: 'List all console commands.' },
  { cmd: 'restart <resource>', desc: 'Restart a resource (txAdmin Resources tab does this too).' },
  { cmd: 'ensure <resource>', desc: 'Start it if stopped, restart it if running.' },
  { cmd: 'stop <resource> / start <resource>', desc: 'Unload / load a resource.' },
  { cmd: 'refresh', desc: 'Rescan the resources folder for new folders.' },
  { cmd: 'say <message>', desc: 'Broadcast to in-game chat.' },
  { cmd: 'kick <id> [reason]', desc: 'Kick a player by server ID.' },
  { cmd: 'ban <id> [reason]', desc: 'Ban a player.' },
  { cmd: 'save', desc: 'Save current config state.' },
  { cmd: 'status', desc: 'Hostname, players, uptime.' },
  { cmd: 'heartbeat', desc: 'Force a server-list heartbeat.' },
  { cmd: 'set <key> <value>', desc: 'Change a convar live, e.g. set sv_hostname "New Name".' },
  { cmd: 'exec <file>', desc: 'Execute a cfg file.' },
  { cmd: 'quit', desc: 'Stop the server (console only).' },
]
