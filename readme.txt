LOOTCAVE - SESSION HANDOFF (read this first in a new chat)
=====================================================
Last updated: 2026-09-15. User: Elling, 16, Founder/CEO (GitHub: nigletlmao).

WHAT THIS IS
------------
LootCave = free static toolbox + directory site (temp emails/numbers/IDs/files,
mods, FiveM server maker, downloader, playlist mover, 25 mini tools, pranks,
live chats, 200+ curated sites, OSINT hub, software list, admin, about).
Zero backend. Everything free. Title: "LootCave". Logo: "LootCave" + gem icon.

RUN IT
------
cd "C:\Users\siane\Desktop\AI Website"
npm run dev    -> http://localhost:5173 (workshop, needs PC on)
npm run build  -> dist/ (Cloudflare deploys this)
npm run lint   -> MUST be 0 errors before every push (warnings ok, all benign)
PUSH LIVE: git add -A / git commit -m "..." / git push (Cloudflare rebuilds ~1 min)
Always tell user to hard-refresh (Ctrl+Shift+R) after deploy (cache).

FOLDER MAP
----------
index.html          title "LootCave", dark fallback bg, svg+png favicon
package.json        name "lootcave". Deps: react, react-dom, lucide-react, nostr-tools
public/             favicon.svg (gem), lootcave-icon.png (512px Discord icon, GDI-drawn)
src/main.jsx        entry (leave alone)
src/index.css       tiny globals
src/App.jsx         ALL components (~3500 lines). Keep logic here.
src/App.css         ALL styles + 10 themes + animations
src/data/ui.js      TABS (17 tabs), TAB_BLURBS, THEMES (w/ preview hexes), NAV_GROUPS
src/data/directory.js  SMS_SITES, EMAIL_PROVIDERS, COOL_SITES (~200), CAT_DESC,
                       CAT_ORDER, OSINT_SUB + SUB_ORDER (16 OSINT subgroups), RECOMMENDED set
src/data/hubs.js    MOD_GAMES, DL_TOOLS, SOFTWARE, PRANKS (~19), TEMP_FILES, EVENTS,
                       FIVEM_CONVERTERS, FIVEM_COMMANDS
discord-server-template.md  owner's Discord manual (channels/roles/rules/Xenon bot)
README.md           short project readme. THIS FILE (readme.txt) = AI handoff.

TABS (sidebar groups in NAV_GROUPS; Recommend/About/Settings pinned at bottom)
------------------------------------------------------------------
home, email, numbers, ids, tempfiles | sites, software, mods, fivem, download,
playlists | tools, pranks, ai | chat, guide | system, admin (+pinned recommend/about/settings)

KEY INTEGRATIONS (all static-safe, verified by testing - do not "simplify")
---------------------------------------------------------------------------
- Temp inbox = 1secmail API. NO CORS headers + blocks curl, so calls go
  direct -> api.allorigins.win/raw -> corsproxy.io (fetch1sec). mail.tm is
  CORS-locked to mail.tm only - do NOT switch to it.
- Fake-ID emails (@1secmail.com/org/net, catch-all, no signup) open live in
  Temp Email via shared inboxAddress state ("inbox" button on email row).
- Nostr chat (#lootcave, relays damus/nos.lol/nostr.band) via nostr-tools.
  Public room. hack.chat fallback linked.
- AI Helper via Puter.js SDK (loaded dynamically). Pollinations = DEAD
  (budget exhausted + Turnstile). Duck.ai = DEAD (no CORS headers).
  Puter spends visitor's free allowance; may ask free sign-in once.
- Recommend form -> FormSubmit ajax to sianellingsen@gmail.com. ACTIVATED
  and working (test email received).
- QR = api.qrserver.com images. MC checker = Mojang + PlayerDB + Minetools
  + Crafty.gg voting (fetchStatusVia). YT playlists = Piped instances, then
  Invidious instances, then manual paste.
- FiveM tab: server.cfg + fxmanifest.lua generators (copy + .cfg/.lua
  download), ZeroDream converter link (convert.cfx.rs, verified), log doctor
  (11 regex rules), practice terminal (simulated, labeled), 14 real commands.
  NO live txAdmin console possible from static (runs on server box + login).
- Admin = username+password gate, SHA-256 hash only, setup-on-first-visit,
  5-tries lockout. Username field comes prefilled EllingsenSian.
  NEVER put the real admin password in code/files/chat logs.

SETTINGS KEYS (localStorage lootbox-settings - keys keep old prefix on purpose)
theme fontScale defaultTab refreshSec compact pwLength pwUpper pwLower
pwNumbers pwSymbols excludeAmbiguous accent reduceMotion hideBlurbs autoCopyPw
hiddenTabs uiSounds showClock customTagline emailAuto discordInvite
(Current invite wired: https://discord.gg/YWhFwTxP8h)

DEPLOY + DOMAINS + EMAIL (status)
---------------------------------
- GitHub: github.com/nigletlmao/lootcave (branch main). LIVE: Cloudflare
  workers.dev URL (user kept it instead of pages.dev - do NOT re-litigate
  unless asked; a duplicate Pages project may exist, ignore it).
- Free domain plan: lootcave.is-a.dev via github.com/is-a-dev/register PR
  (not done yet - check availability first).
- Custom email plan: needs a domain (~$1-2/yr .xyz, no free path). Then
  Zoho Forever Free RECOMMENDED (real mailbox) or Cloudflare Email Routing
  (forward-only). Full research done in chat 2026-09-15, not yet executed.
- Discord server NOT created yet. Owner has discord-server-template.md +
  in-site Server Kit tab. Xenon template pick: "Simple Server Template",
  /template load code r2uhQjNFKYHA (239k uses, verified).

HOUSE RULES FOR FUTURE SESSIONS
-------------------------------
- Lucide icons everywhere, never emojis in UI. No em/en dashes (- only).
- Every directory entry needs a why-is-it-here description.
- Free + legal only: no pirate streams, no malware, no credential theft,
  pranks stay reversible + consensual (no password-changing, no wipers).
- Verify external APIs/tools with real requests before adding.
- npm run build + lint MUST pass; lint warnings are all pre-existing/benign.
- Don't create files unless asked (exception: user explicitly requested files).
- User pushes with the 3 git commands themselves (knows the flow now).
- JS bundle is ~550KB (chunk-size warning noted, fine for now; code-split
  only if it keeps ballooning - nostr-tools is the bulk).
- User is 16, Norwegian (UTC+2). ENK company needs guardian + Statsforvalteren
  approval under 18 (verified). Hobby project = correct status, €0 revenue.
- Team page: Elling, 16, Founder/CEO. Open roles: Moderator, Scout.
