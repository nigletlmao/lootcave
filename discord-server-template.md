# LootCave Discord - server template pack

Can't auto-create a Discord server from here (Discord only mints servers
through clicks), so this file makes it a ~5 minute copy-paste job instead.
Do Part 1 once, then Part 2 gives you a shareable template link so you never
do it again.

## Part 1 - create the server (5 min)

1. Discord → **+** (left sidebar) → **Create My Own** → **For me and my friends**
2. Name: `LootCave` → upload the gem favicon (`public/favicon.svg`) as the icon → Create
3. Server Settings → **Enable Community** is OPTIONAL - skip it for now (fewer rules).
4. Create these channels (right-click category → Create Channel, then paste the topic):

### INFORMATION (category)
- `#welcome` - topic: `You found the cave. Read #rules, grab a snack, say hi.`
- `#rules` - topic: `The law of the cave.`
- `#announcements` - topic: `Site updates, new tabs, new themes.`

### CAVE (category)
- `#general` - topic: `Anything goes (keep it legal and kind).`
- `#site-suggestions` - topic: `Drop links worth adding to LootCave. Best ones go live.`
- `#broken-links` - topic: `Found a dead link or a broken tool? Report it here.`
- `#setups-and-themes` - topic: `Show off your theme + accent combos.`
- `#live-chat` - topic: `Overflow room when the site chat is popping.`

### VOICE (category)
- `Cave Entrance` (voice) - user limit 0
- `AFK Corner` (voice)

## Part 2 - roles (copy the names + colors)

| Role | Color | Permissions |
|---|---|---|
| Cave Keeper (you) | #7c5cff purple | Administrator |
| Mod | #00e5cc teal | Manage Messages, Kick, Timeout Members |
| Regular | #a3be8c green | Send Messages, Embed Links, Attach Files, Use Voice |
| Newcomer (default @everyone) | gray | View Channels, Send Messages, Connect |

Server Settings → Roles → create the three, drag order: Keeper > Mod > Regular.
Give `#announcements` a permission override: @everyone = View only, Keeper = Send.

## Part 3 - paste this into #rules

```
THE LAW OF THE CAVE
1. Free + legal only. No pirate links, no malware, no "free Robux" scams.
2. No temp-mail abuse talk for banking/fraud. Throwaway signups only.
3. Pranks stay harmless and consensual. Nobody's work PC, ever.
4. Chat is public on the site too - never post passwords or personal info.
5. Be kind. First offense = warning, second = timeout, third = ban.
```

## Part 4 - paste this into #welcome

```
Welcome to the LootCave Discord.
- Suggest sites in #site-suggestions (best ones go live on the site)
- Report dead links in #broken-links
- Live site chat not enough? Talk here.
Site: <your pages.dev URL>
```

## Part 5 - mint YOUR shareable template (do once)

Server Settings → **Server Template** → enter name `LootCave` + description →
**Generate Template**. You get a `discord.new/XXXX` link: anyone opening it
clones your whole structure. Save that link somewhere safe.

## Part 6 - connect it to the site

1. In any channel: **Invite People** (or + next to a channel) → **Edit invite
   link** → Expire After: **Never** → Generate → Copy.
2. LootCave site → **Settings → Community → Discord invite link** → paste → saved.
3. The **About page** now shows a Join button automatically.

## Part 7 - the bot way: Xenon (backups + templates without manual rebuilds)

If you ever want to clone this server, move it, or restore it after a raid,
use **Xenon** (xenon.bot) - the standard free bot for this:

1. Go to **xenon.bot** → **Add to Discord** → pick your LootCave server →
   Authorize. Give its role a top position (Server Settings → Roles → drag
   Xenon near the top) so it can recreate channels and roles.
2. In any channel type `x!help` to see commands. The two you care about:
   - `x!backup create` - snapshots roles, channels, settings (kept forever).
   - Load a snapshot onto any server you own with the matching load command
     from `x!help`. Perfect backup before experimenting.
3. Xenon also hosts a public **template gallery** (linked on xenon.bot):
   browse thousands of free server layouts, or publish your LootCave layout
   there once it looks sharp.
4. Free alternative with the same idea: **Ditto** (dittobot.app) - also free
   cloning, verified by Discord.

Rules that apply to every method: bots never move members, messages, emojis
or other bots' configs - those always travel manually. And NEVER use a
"cloner" that asks for your personal account token (self-bots = banned
accounts). Real bots are invited with an invite link, period.

## Server icon

Use `public/lootcave-icon.png` (512x512, purple/cyan gem on dark, made for
this project). Server Settings → Overview → Upload Image. Discord crops it
to a circle - the gem is centered so it survives the crop.
