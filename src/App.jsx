import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { generateSecretKey, getPublicKey, finalizeEvent, SimplePool, nip19 } from 'nostr-tools'
import {
  Binary, CaseSensitive, ClipboardList, Clock, Copy, Dices, ExternalLink,
  Fingerprint, FileJson, Gem, Globe, HardDrive, Hash, Home as HomeIcon, IdCard, Images, KeyRound,
  Laugh, Link2, Mail, Menu, MessageCircle, MousePointerClick, Music, Palette, Pencil, Plus, QrCode,
  RefreshCw, RotateCcw, Ruler, Scale, ScanSearch, Send, Settings as SettingsIcon, ShieldCheck, Smartphone,
  Star, Target, TextQuote, Timer, TriangleAlert, Tv, UserCheck, Wifi, Wrench, ChevronDown, Info,
} from 'lucide-react'
import './App.css'

import { TABS, TAB_BLURBS, THEMES, NAV_GROUPS } from './data/ui.js'

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
  hiddenTabs: [],
  uiSounds: false,
  showClock: false,
  customTagline: '',
  emailAuto: true,
  discordInvite: 'https://discord.gg/YWhFwTxP8h',
}

function loadSettings() {
  try {
    const raw = localStorage.getItem('lootbox-settings')
    if (!raw) return DEFAULT_SETTINGS
    const s = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    // sanitize - a bad stored value must never nuke the theme
    if (!THEMES.some((t) => t.id === s.theme)) s.theme = 'midnight'
    if (!['small', 'medium', 'large'].includes(s.fontScale)) s.fontScale = 'medium'
    if (!TABS.some((t) => t.id === s.defaultTab)) s.defaultTab = 'home'
    if (!Array.isArray(s.hiddenTabs)) s.hiddenTabs = []
    if (!s.discordInvite) s.discordInvite = DEFAULT_SETTINGS.discordInvite
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
  } catch { /* storage full/blocked - ignore */ }
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

/* Status-aware fetch: some APIs answer with HTTP codes (Mojang: 200 =
   taken, 204/404 = free). Retries the same request across routes. */
const MC_ROUTES = [
  { id: 'direct', label: 'direct', wrap: (u) => u },
  { id: 'allorigins', label: 'allorigins', wrap: (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u) },
  { id: 'corsproxy', label: 'corsproxy.io', wrap: (u) => 'https://corsproxy.io/?url=' + encodeURIComponent(u) },
]

async function fetchStatusVia(routes, url) {
  const errors = []
  for (const r of routes) {
    try {
      const res = await fetch(r.wrap(url))
      let data = null
      try { data = await res.json() } catch { /* empty body (204) */ }
      return { status: res.status, data, route: r.label }
    } catch (e) { errors.push(r.label + ': ' + e.message) }
  }
  throw new Error(errors.join(' | '))
}

import { SMS_SITES, EMAIL_PROVIDERS, COOL_SITES, CAT_DESC, CAT_ORDER, RECOMMENDED, OSINT_SUB, SUB_ORDER } from './data/directory.js'

function SectionHead({ title, desc }) {
  return (
    <div className="sectionHead">
      <h2>{title}</h2>
      <p>{desc}</p>
    </div>
  )
}

function HeaderClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return <span className="clock">{now.toLocaleTimeString()}</span>
}


function copy(text) {
  navigator.clipboard?.writeText(text).catch(() => {})
  try {
    if (window.__lootSounds) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      const ctx = new Ctx()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.frequency.value = 720
      g.gain.value = 0.04
      o.start()
      o.stop(ctx.currentTime + 0.07)
    }
  } catch { /* audio unavailable - stay silent */ }
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
  const statSites = COOL_SITES.length
  const statMods = MOD_GAMES.reduce((n, g) => n + g.sites.length, 0)
  const statApps = SOFTWARE.reduce((n, g) => n + g.apps.length, 0)
  const statTools = 25
  const statThemes = THEMES.length
  const statFiles = TEMP_FILES.length
  return (
    <>
      <div className="hero card big">
        <h1>Welcome to lootcave</h1>
        <p>Your localhost stash of useful internet throwaways: disposable emails with a <b>live inbox</b>, public SMS receivers, fake test identities, a hand-picked directory of free tools, and tiny dev utilities. Static only - no backend, no tracking, runs with <code>npm run dev</code>.</p>
        <div className="btnRow">
          <button onClick={() => go('email')}><Mail size={15} className="btnIcon" /> Get temp email</button>
          <button className="ghost" onClick={() => go('numbers')}><Smartphone size={15} className="btnIcon" /> Find temp number</button>
          <button className="ghost" onClick={() => go('ids')}><IdCard size={15} className="btnIcon" /> Generate ID</button>
          <button className="ghost" onClick={() => go('settings')}><SettingsIcon size={15} className="btnIcon" /> Customize theme</button>
        </div>
      </div>
      <SectionHead title="About LootCave" desc="The short version: what this is, why it exists, and how to use it. The full story lives on the About page, pinned at the bottom of the sidebar." />
      <div className="grid2">
        <div className="card big">
          <h3>What is this?</h3>
          <p>LootCave is a free toolbox and directory for the useful corners of the internet: disposable emails with a live inbox, public SMS receivers, test identities, mod hubs, a media downloader helper, mini tools, pranks, live chat, and a hand-picked site directory. No accounts, no tracking, no paywalls - runs as a plain static site.</p>
          <h3>Why does it exist?</h3>
          <p>Because the good stuff online is scattered across a hundred bookmarks. This cave collects the throwaway tools, free software, and hidden-gem sites worth keeping, with a description on everything so you always know why it is here.</p>
          <h3>How do I use it?</h3>
          <ul className="tips">
            <li><b>Sidebar</b> on the left holds every section in dropdown groups. About is pinned at the bottom.</li>
            <li><b>Search</b> at the top filters numbers, sites, mods, software and pranks instantly.</li>
            <li><b>Plus your own:</b> Cool Sites lets you add entries that persist in your browser.</li>
            <li><b>Make it yours:</b> Settings has themes, fonts, hidden tabs, and full backup export.</li>
          </ul>
        </div>
        <div className="cards single">
          <div className="card">
            <h3>By the numbers</h3>
            <div className="kv">
              <div className="row"><span>sites</span><code>{statSites} curated entries</code></div>
              <div className="row"><span>mods</span><code>{statMods} mod resources</code></div>
              <div className="row"><span>apps</span><code>{statApps} software picks</code></div>
              <div className="row"><span>tools</span><code>{statTools} mini tools</code></div>
              <div className="row"><span>files</span><code>{statFiles} temp file hosts</code></div>
              <div className="row"><span>themes</span><code>{statThemes} themes</code></div>
            </div>
          </div>
          <div className="card">
            <h3>Start here</h3>
            <p className="muted">The three tabs most people open first.</p>
            <div className="btnRow">
              <button onClick={() => go('email')}>Temp email</button>
              <button className="ghost" onClick={() => go('sites')}>Cool sites</button>
              <button className="ghost" onClick={() => go('chat')}>Live chat</button>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <h3><ShieldCheck size={16} className="hicon" /> House rules</h3>
        <ul className="tips">
          <li><b>Public = public.</b> Free temp numbers and emails can be read by strangers - never banking, recovery, or sensitive accounts.</li>
          <li><b>Test IDs only.</b> Fake identities are for dev signups, never KYC or legal documents.</li>
          <li><b>Legal streaming only.</b> Pirate sites mean malware + takedowns, so the directory lists licensed free options instead.</li>
        </ul>
      </div>
    </>
  )
}

/* ---------- Temp Email (1secmail + automatic route fallback) ---------- */
function TempEmail({ refreshSec, auto }) {
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
    if (!login || !auto) return
    const t = setInterval(refresh, Math.max(5, refreshSec) * 1000)
    return () => clearInterval(t)
  }, [login, refresh, refreshSec, auto])

  return (
    <>
      <SectionHead title="Live disposable inbox" desc={`Powered by the free 1secmail API with automatic fallback (direct → CORS proxies) when your browser blocks the call. ${auto ? `Inbox auto-refreshes every ${refreshSec}s.` : 'Auto-refresh is off (see Settings) - use Refresh now manually.'} Addresses expire after about a day.`} />
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
              <p className="muted">Likely causes: you're offline, a VPN/firewall blocks it, or your adblocker (uBlock/AdGuard) blocks temp-mail domains - pause it for localhost and hit New address. Details of every attempt are in the Admin event log.</p>
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
          <p className="muted">If the live inbox won't connect at all, these are the best-known alternatives - all free, no signup.</p>
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
      <SectionHead title="Temporary numbers" desc="Free sites give you PUBLIC numbers - anyone can open the same inbox. Great for spammy signups, terrible for banking. Pay a few cents for a private rental when it matters." />
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
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lootcave-saved-ids') || '[]')
    } catch {
      return []
    }
  })
  useEffect(() => {
    localStorage.setItem('lootcave-saved-ids', JSON.stringify(saved))
  }, [saved])
  const saveId = () => {
    if (saved.some((s) => s.username === id.username)) return
    setSaved((a) => [{ ...id }, ...a].slice(0, 20))
    logEvent('ids', 'identity saved: ' + id.username)
  }
  return (
    <>
      <SectionHead title="Fake identity generator" desc="One click builds a full test persona - name, login, email, password, phone, birthday, address, company. Everything is random and local to your browser." />
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
          <button className="ghost" onClick={saveId}>Save this ID</button>
          </div>
        </div>
        <div className="card">
          <h2>How to use + tips</h2>
          <ul className="tips">
            <li><b>Throwaway signups:</b> paste the email into Temp Email, the password straight into the form.</li>
            <li><b>Testing:</b> devs use these to fill forms without touching real data.</li>
            <li><b>Passwords:</b> always generate a unique one per site - or use Mini Tools for full control.</li>
            <li><b>Never</b> use fake details for KYC, banking, or legal documents. That's fraud.</li>
          </ul>
        </div>
      </div>
      <div className="card">
        <h3>Test card numbers (dev only)</h3>
        <p className="muted">Stripe's public test cards for checkout forms in test mode. They charge nothing and work nowhere real. Any future expiry, any CVC, any ZIP.</p>
        <div className="kv">
          <div className="row"><span>visa</span><code>4242 4242 4242 4242</code><button className="ghost sm" onClick={() => copy('4242424242424242')}>copy</button></div>
          <div className="row"><span>mastercard</span><code>5555 5555 5555 4444</code><button className="ghost sm" onClick={() => copy('5555555555554444')}>copy</button></div>
          <div className="row"><span>amex</span><code>3782 822463 10005</code><button className="ghost sm" onClick={() => copy('378282246310005')}>copy</button></div>
          <div className="row"><span>declined</span><code>4000 0000 0000 0002</code><button className="ghost sm" onClick={() => copy('4000000000000002')}>copy</button></div>
        </div>
        <p className="muted">Full docs: stripe.com/docs/testing. Never enter a real card into a test form.</p>
      </div>
      <div className="card">
        <h3>Saved identities <span className="countBadge">{saved.length}</span></h3>
        <p className="muted">Keep favorite test personas in this browser. Click one to load it above.</p>
        <div className="kv">
        {saved.length === 0 && <p className="muted">Nothing saved yet - generate one you like and hit Save this ID.</p>}
        {saved.map((s) => (
          <div key={s.username} className="row">
            <span>{s.username}</span>
            <code>{s.name}</code>
            <span className="btnRow" style={{ marginTop: 0 }}>
              <button className="ghost sm" onClick={() => setId({ ...s })}>load</button>
              <button className="ghost sm" onClick={() => setSaved((a) => a.filter((x) => x.username !== s.username))}>remove</button>
            </span>
          </div>
        ))}
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
      <p className="muted">Save anything here - your favorite adblock list, subreddit, host, AI tool. Stored in localStorage, survives reloads.</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Utopia P2P)" />
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL (e.g. example.com)" />
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description - what is it, why is it cool?" />
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
  const order = (c) => (c === 'My Stuff' ? 999 : (CAT_ORDER.indexOf(c) === -1 ? 500 : CAT_ORDER.indexOf(c)))
  const shown = [...new Set(list.map((s) => s.cat))].sort((a, b) => order(a) - order(b))
  const inCat = (c) => list.filter((s) => s.cat === c).sort((a, b) => a.name.localeCompare(b.name))
  const recs = list.filter((s) => RECOMMENDED.has(s.name))
  const siteCard = (s) => (
    <div key={s.name + s.url} className="card linkWrap">
      <a className="linkMain" href={s.url} target="_blank" rel="noreferrer">
                <h3>{s.name} {s.custom ? <Pencil size={13} className="hicon" /> : <ExternalLink size={13} className="hicon" />} {RECOMMENDED.has(s.name) && <span className="recBadge" title="Recommended"><Star size={11} /></span>}</h3>
        <p>{s.desc}</p>
      </a>
      {s.custom && <button className="ghost sm" onClick={() => onDelete(s.url)}>remove</button>}
    </div>
  )
  return (
    <>
      <SectionHead title="Cool sites directory" desc={`${all.length} entries and counting. Every entry has a description so you know WHY it's here. Search filters everything. Add your own at the bottom - custom entries are marked with a pencil and can be deleted.`} />
      <div className="notice"><Tv size={15} className="hicon" /> <b>Watch (legal)</b> = free & licensed streaming only. Pirate anime/streaming sites aren't listed - they're illegal and usually bundled with malware. Crunchyroll / Tubi / Pluto / RetroCrush cover most needs for $0.</div>
      {recs.length > 0 && (
        <div>
          <h3 className="cat"><Star size={15} className="hicon" /> Recommended - start with these</h3>
          <p className="catDesc">The essentials I'd install or bookmark first on a fresh machine.</p>
          <div className="cards">
            {recs.map(siteCard)}
          </div>
        </div>
      )}
      {shown.map((c) => (
        <div key={c} id={'cat-' + c.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}>
          <h3 className="cat">{c} <span className="countBadge">{inCat(c).length}</span></h3>
          <p className="catDesc">{CAT_DESC[c] || ''}</p>
          {c === 'OSINT (legal)' ? (
            SUB_ORDER.filter((sub) => inCat(c).some((s) => (OSINT_SUB[s.name] || 'Other') === sub)).map((sub) => {
              const items = inCat(c).filter((s) => (OSINT_SUB[s.name] || 'Other') === sub)
              return (
                <div key={sub}>
                  <h4 className="subCat">{sub} <span className="countBadge">{items.length}</span></h4>
                  <div className="cards">{items.map(siteCard)}</div>
                </div>
              )
            })
          ) : (
            <div className="cards">{inCat(c).map(siteCard)}</div>
          )}
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
  if (bits < 40) return { label: 'Weak - fine for throwaways, not real accounts', pct: 25, cls: 'weak' }
  if (bits < 70) return { label: 'Okay - decent for most logins', pct: 55, cls: 'okay' }
  if (bits < 100) return { label: 'Strong - good for email / banking', pct: 80, cls: 'strong' }
  return { label: 'Beast mode - overkill in the best way', pct: 100, cls: 'beast' }
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
    ['pwUpper', 'A-Z', 'Uppercase letters - adds 26 chars to the pool.'],
    ['pwLower', 'a-z', 'Lowercase letters - the readable backbone.'],
    ['pwNumbers', '0-9', 'Numbers - required by most signup forms.'],
    ['pwSymbols', '!@#', 'Symbols - biggest entropy boost per character.'],
    ['excludeAmbiguous', 'No Il1O0', 'Drops look-alikes (I/l/1, O/0) so passwords are copy-safe.'],
  ]
  return (
    <div className="card big">
      <h3><KeyRound size={16} className="hicon" /> Password generator</h3>
      <p className="muted">Cryptographically random (WebCrypto), generated on your device. Toggle the character sets to match a site's rules - bigger pool + longer length = exponentially harder to crack.</p>
      <code className="pw">{pw}</code>
      <div className="meter"><div className={`fill ${st.cls}`} style={{ width: `${st.pct}%` }} /></div>
      <p className="muted">{st.label} · {pw.length} chars · ~{Math.round(pw.length * Math.log2(Math.max(2, charset.length)))} bits of entropy · pool of {charset.length}</p>
      <label className="sliderRow">Length: <b>{settings.pwLength}</b> - longer beats fancier every time.
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
      <p className="muted">Paste messy JSON - pretty-print it, minify it, or find the syntax error.</p>
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
      <p className="muted">Variable names, slugs, titles - one click. Live word/char count included.</p>
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
  const [swatches, setSwatches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lootcave-palette') || '[]')
    } catch {
      return []
    }
  })
  useEffect(() => {
    localStorage.setItem('lootcave-palette', JSON.stringify(swatches))
  }, [swatches])
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
            <button className="ghost sm" onClick={() => { if (valid && !swatches.includes(hex.toLowerCase())) setSwatches((s) => [...s, hex.toLowerCase()].slice(-12)) }}>Save swatch</button>
          </div>
          {swatches.length > 0 && (
            <div className="swRow">
              {swatches.map((c) => (
                <span key={c} className="swDotWrap">
                  <button className="swDot" style={{ background: c }} title={c} onClick={() => setHex(c)} aria-label={'load ' + c} />
                  <button className="swX" title={'remove ' + c} onClick={() => setSwatches((s) => s.filter((x) => x !== c))}>×</button>
                </span>
              ))}
            </div>
          )}
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
  let result = '-'
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
      } catch { /* no audio - fine */ }
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
      <p className="muted">Paste an existing password to grade it. Checked locally - it never leaves this page.</p>
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

/* ---------- Image downloader: single image or whole-page scan ----------
   Hotlink protection / CORS blocks some hosts - the tool retries each
   grab direct, then through two public CORS proxies. */
const IMG_ROUTES = [
  { id: 'direct', label: 'direct', wrap: (u) => u },
  { id: 'allorigins', label: 'allorigins', wrap: (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u) },
  { id: 'corsproxy', label: 'corsproxy.io', wrap: (u) => 'https://corsproxy.io/?url=' + encodeURIComponent(u) },
]

function filenameFromUrl(u) {
  try {
    const p = new URL(u).pathname.split('/').pop().split('?')[0]
    return p || 'image'
  } catch { return 'image' }
}

function ImageTool() {
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState('single')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [preview, setPreview] = useState('')
  const [found, setFound] = useState([])

  const saveBlob = async (src) => {
    setBusy(true)
    setErr('')
    try {
      let blob = null
      let route = ''
      const errors = []
      for (const r of IMG_ROUTES) {
        try {
          const res = await fetch(r.wrap(src))
          if (!res.ok) throw new Error('HTTP ' + res.status)
          blob = await res.blob()
          route = r.label
          break
        } catch (e) { errors.push(r.label + ': ' + e.message) }
      }
      if (!blob) throw new Error(errors.join(' | '))
      const obj = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = obj
      a.download = filenameFromUrl(src)
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(obj), 5000)
      setInfo(`Saved via ${route}.`)
      logEvent('tools', `image saved via ${route}`)
    } catch (e) {
      setErr('Download failed on every route: ' + String(e.message).slice(0, 220))
    } finally {
      setBusy(false)
    }
  }

  const previewOne = () => {
    const u = url.trim()
    if (!u) { setErr('Paste an image URL first.'); return }
    setErr('')
    setInfo('')
    setFound([])
    setPreview(/^https?:\/\//i.test(u) ? u : 'https://' + u)
  }

  const scanPage = async () => {
    let page = url.trim()
    if (!page) { setErr('Paste a page URL first.'); return }
    if (!/^https?:\/\//i.test(page)) page = 'https://' + page
    setBusy(true)
    setErr('')
    setInfo('')
    setFound([])
    setPreview('')
    try {
      let html = ''
      const errors = []
      for (const r of IMG_ROUTES) {
        try {
          const res = await fetch(r.wrap(page))
          if (!res.ok) throw new Error('HTTP ' + res.status)
          html = await res.text()
          break
        } catch (e) { errors.push(r.label + ': ' + e.message) }
      }
      if (!html) throw new Error(errors.join(' | '))
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const srcs = [...doc.querySelectorAll('img')].map((i) => i.getAttribute('src')).filter(Boolean)
      const abs = [...new Set(srcs.map((s) => {
        try {
          const u = new URL(s, page).href
          return /^https?:/.test(u) && !u.startsWith('data:') ? u : null
        } catch { return null }
      }).filter(Boolean))]
      setFound(abs.slice(0, 40))
      setInfo(abs.length ? `${abs.length} image${abs.length === 1 ? '' : 's'} found - click any thumbnail to save it.` : 'No images found on that page.')
      logEvent('tools', `page scan: ${abs.length} images`)
    } catch (e) {
      setErr('Could not read that page: ' + String(e.message).slice(0, 220))
    } finally {
      setBusy(false)
    }
  }

  const go = () => {
    if (mode === 'single') previewOne()
    else scanPage()
  }

  return (
    <div className="card">
      <h3><Images size={16} className="hicon" /> Image downloader</h3>
      <p className="muted">Save one image by URL - or scan a whole page and pick from every image on it. Some hosts block hotlinking; the tool retries via proxies automatically.</p>
      <div className="btnRow">
        <button className={mode === 'single' ? '' : 'ghost sm'} onClick={() => setMode('single')}>Single image</button>
        <button className={mode === 'page' ? '' : 'ghost sm'} onClick={() => setMode('page')}>Whole page</button>
      </div>
      <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} placeholder={mode === 'single' ? 'https://example.com/photo.jpg' : 'https://example.com/gallery'} />
      <div className="btnRow">
        <button onClick={go} disabled={busy}>{busy ? 'Working…' : mode === 'single' ? 'Preview' : 'Scan page'}</button>
        {preview && <button className="ghost sm" onClick={() => saveBlob(preview)}>Download this one</button>}
      </div>
      {err && <p className="err">{err}</p>}
      {info && <p className="muted">{info}</p>}
      {preview && <img className="imgPreview" src={preview} alt="preview" onError={(e) => { e.currentTarget.src = IMG_ROUTES[1].wrap(preview) }} />}
      {found.length > 0 && (
        <div className="imgGrid">
          {found.map((src) => (
            <img key={src} className="imgThumb" src={src} alt="" loading="lazy" title={filenameFromUrl(src)}
              onClick={() => saveBlob(src)}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_ROUTES[1].wrap(src) }} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Minecraft username checker: 4 sources vote ---------- */
const MC_SOURCES = [
  { name: 'Mojang (official)', url: (n) => `https://api.mojang.com/users/profiles/minecraft/${n}`,
    parse: (status, data) => (status === 200 && data && data.id ? { taken: true, id: data.id } : ([204, 404, 400].includes(status) ? { taken: false } : null)) },
  { name: 'PlayerDB', url: (n) => `https://playerdb.co/api/player/minecraft/${n}`,
    parse: (status, data) => (status === 200 && data && data.success && data.data && data.data.player ? { taken: true, id: data.data.player.id } : (status === 400 ? { taken: false } : null)) },
  { name: 'Minetools', url: (n) => `https://api.minetools.eu/uuid/${n}`,
    parse: (status, data) => (status === 200 && data && data.id ? { taken: true, id: String(data.id).replace(/-/g, '') } : ([204, 404].includes(status) ? { taken: false } : null)) },
  { name: 'Crafty.gg', url: (n) => `https://api.crafty.gg/api/v2/players/${n}`,
    parse: (status, data) => (status === 200 && data && data.data && data.data.uuid ? { taken: true, id: String(data.data.uuid).replace(/-/g, '') } : (status === 404 ? { taken: false } : null)) },
]

/* ---------- Minecraft username checker (Mojang API + proxy fallback) ---------- */
function McNameTool() {
  const [name, setName] = useState('')
  const [state, setState] = useState('idle')
  const [info, setInfo] = useState(null)
  const [results, setResults] = useState([])
  const [err, setErr] = useState('')
  const check = async () => {
    const n = name.trim()
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(n)) {
      setState('error')
      setErr('Usernames are 3-16 characters: letters, numbers, underscore.')
      return
    }
    setState('checking')
    setErr('')
    setInfo(null)
    setResults([])
    try {
      const out = await Promise.all(MC_SOURCES.map(async (s) => {
        try {
          const { status, data, route } = await fetchStatusVia(MC_ROUTES, s.url(n))
          const p = s.parse(status, data)
          return p ? { name: s.name, route, taken: p.taken, id: p.id } : { name: s.name, route, taken: null }
        } catch {
          return { name: s.name, route: 'failed', taken: null }
        }
      }))
      setResults(out)
      const hits = out.filter((r) => r.taken === true)
      const frees = out.filter((r) => r.taken === false)
      if (hits.length) {
        let names = [n]
        if (hits[0].id) {
          try {
            const h = await fetchStatusVia(MC_ROUTES, `https://api.mojang.com/user/profiles/${hits[0].id}/names`)
            if (h.status === 200 && Array.isArray(h.data)) names = h.data.map((x) => x.name)
          } catch { /* history is a bonus, not required */ }
        }
        setInfo({ id: hits[0].id, names, route: hits[0].route })
        setState('taken')
      } else if (frees.length === out.length) {
        setState('free')
      } else {
        setState('unclear')
      }
      logEvent('tools', `mc check ${n}: ${hits.length ? 'taken' : frees.length === out.length ? 'free' : 'unclear'}`)
    } catch (e) {
      setState('error')
      setErr('Could not reach any source: ' + String(e.message).slice(0, 160))
    }
  }
  const n = name.trim()
  return (
    <div className="card">
      <h3><UserCheck size={16} className="hicon" /> Minecraft name check</h3>
      <p className="muted">Is that username taken? Four sources vote: Mojang, PlayerDB, Minetools, Crafty.gg.</p>
      <div className="chatRow">
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} placeholder="Notch" maxLength={16} />
        <button onClick={check} disabled={state === 'checking'}>{state === 'checking' ? '…' : 'Check'}</button>
      </div>
      {state === 'taken' && info && (
        <>
          <div className="mcRow">
            <img className="mcAvatar" src={`https://minotar.net/helm/${n}/64.png`} alt="" />
            <div>
              <p className="pillTaken">TAKEN</p>
              <p className="muted">via {info.route}</p>
            </div>
          </div>
          <code className="pw small">{info.id}</code>
          <p className="muted">Known as: {info.names.join(' → ')}</p>
        </>
      )}
      {state === 'free' && <p className="pillFree">AVAILABLE on all 4 sources - go claim it in the Minecraft launcher.</p>}
      {state === 'unclear' && <p className="muted">Mixed signals - some sources failed to answer. Treat as risky, or retry.</p>}
      {results.length > 0 && (
        <div className="kv">
          {results.map((r) => (
            <div key={r.name} className="row">
              <span>{r.name}</span>
              <code>{r.taken === true ? 'TAKEN' + (r.id ? ' · ' + String(r.id).slice(0, 8) + '…' : '') : r.taken === false ? 'free' : 'no answer'}</code>
              <span className="muted">{r.route}</span>
            </div>
          ))}
        </div>
      )}
      {state === 'error' && <p className="err">{err}</p>}
      {n && <p className="muted">Double-check on <a href={`https://namemc.com/search?q=${encodeURIComponent(n)}`} target="_blank" rel="noreferrer">NameMC</a>.</p>}
    </div>
  )
}

/* ---------- AI prompt maker: goal in, polished prompt out ---------- */
function PromptTool() {
  const [goal, setGoal] = useState('')
  const [task, setTask] = useState('Explain')
  const [tone, setTone] = useState('Neutral and clear')
  const [format, setFormat] = useState('Step-by-step')
  const [level, setLevel] = useState('Beginner')
  const [copied, setCopied] = useState(false)
  const out = useMemo(() => {
    if (!goal.trim()) return ''
    return `GOAL: ${goal.trim()}\n\nTASK: ${task} the above for a ${level.toLowerCase()} audience.\nTONE: ${tone}.\nFORMAT: ${format}.\nRULES:\n- Be specific and skip the fluff.\n- Define any jargon the first time you use it.\n- If something is ambiguous, state your assumption and continue.\n- End with 3 follow-up questions I should ask next.`
  }, [goal, task, tone, format, level])
  return (
    <div className="card">
      <h3><TextQuote size={16} className="hicon" /> Prompt maker</h3>
      <p className="muted">Describe what you want - get a structured prompt that makes AI actually deliver.</p>
      <textarea rows="2" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. a workout plan for small apartments…" />
      <div className="btnRow">
        <select value={task} onChange={(e) => setTask(e.target.value)}>
          {['Explain', 'Debug', 'Write', 'Plan', 'Review', 'Brainstorm', 'Summarize', 'Teach'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={tone} onChange={(e) => setTone(e.target.value)}>
          {['Neutral and clear', 'Friendly', 'Professional', 'Funny', 'Blunt', 'Encouraging'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="btnRow">
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          {['Step-by-step', 'Bullet list', 'Table', 'Short paragraph', 'Detailed guide', 'Code with comments'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          {['Beginner', 'Intermediate', 'Expert', 'Child'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {out && <pre className="dump">{out}</pre>}
      {out && <button className="ghost sm" onClick={() => { copy(out); setCopied(true); setTimeout(() => setCopied(false), 1200) }}>{copied ? 'Copied!' : 'Copy prompt'}</button>}
    </div>
  )
}

/* ---------- Stopwatch, percentages, text fun, encodings, contrast, images ---------- */
function fmtSw(ms) {
  const t = Math.floor(ms / 100)
  const tenths = t % 10
  const s = Math.floor(t / 10) % 60
  const m = Math.floor(t / 600)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${tenths}`
}

function StopwatchTool() {
  const [ms, setMs] = useState(0)
  const [running, setRunning] = useState(false)
  const [laps, setLaps] = useState([])
  const startAt = useRef(0)
  useEffect(() => {
    if (!running) return undefined
    const t = setInterval(() => setMs(Date.now() - startAt.current), 100)
    return () => clearInterval(t)
  }, [running])
  const start = () => { startAt.current = Date.now() - ms; setRunning(true) }
  const reset = () => { setRunning(false); setMs(0); setLaps([]) }
  return (
    <div className="card">
      <h3><Timer size={16} className="hicon" /> Stopwatch</h3>
      <p className="muted">Count up with laps. The focus timer counts down - this one doesn't judge.</p>
      <code className="pw big">{fmtSw(ms)}</code>
      <div className="btnRow">
        {running
          ? <button className="ghost" onClick={() => setRunning(false)}>Pause</button>
          : <button onClick={start}>Start</button>}
        <button className="ghost" onClick={() => running && setLaps((l) => [...l, ms])}>Lap</button>
        <button className="ghost" onClick={reset}>Reset</button>
      </div>
      {laps.length > 0 && (
        <div className="kv">
          {laps.map((l, i) => (
            <div key={i} className="row"><span>lap {i + 1}</span><code>{fmtSw(l)}</code></div>
          ))}
        </div>
      )}
    </div>
  )
}

function PercentTool() {
  const [p, setP] = useState('20')
  const [of, setOf] = useState('150')
  const [part, setPart] = useState('30')
  const [whole, setWhole] = useState('150')
  const [from, setFrom] = useState('80')
  const [to, setTo] = useState('100')
  const num = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n }
  const r1 = num(p) != null && num(of) != null ? (num(p) / 100 * num(of)).toPrecision(6) : '-'
  const r2 = num(part) != null && num(whole) && num(whole) !== 0 ? (num(part) / num(whole) * 100).toPrecision(6) + '%' : '-'
  const r3 = num(from) != null && num(to) != null && num(from) !== 0 ? ((num(to) - num(from)) / Math.abs(num(from)) * 100).toPrecision(6) + '%' : '-'
  const row = (a, b, r) => (
    <div className="calcRow">
      <input value={a[0]} onChange={(e) => a[1](e.target.value)} inputMode="decimal" />
      <input value={b[0]} onChange={(e) => b[1](e.target.value)} inputMode="decimal" />
      <code>= {r}</code>
    </div>
  )
  return (
    <div className="card">
      <h3><Hash size={16} className="hicon" /> Percentages</h3>
      <p className="muted">Tips, discounts and grade math without mental gymnastics.</p>
      <p className="muted">What is P% of Y?</p>
      {row([p, setP], [of, setOf], r1)}
      <p className="muted">Y is what % of X?</p>
      {row([part, setPart], [whole, setWhole], r2)}
      <p className="muted">% change from A to B?</p>
      {row([from, setFrom], [to, setTo], r3)}
    </div>
  )
}

const LEET = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', b: '8', g: '9' }
const MORSE = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', ' ': '/' }

function FunTextTool() {
  const [txt, setTxt] = useState('hello cave')
  const [mode, setMode] = useState('leet')
  const out = useMemo(() => {
    if (mode === 'reverse') return [...txt].reverse().join('')
    if (mode === 'morse') return [...txt.toLowerCase()].map((c) => MORSE[c] || c).join(' ')
    return [...txt.toLowerCase()].map((c) => LEET[c] || c).join('')
  }, [txt, mode])
  return (
    <div className="card">
      <h3><CaseSensitive size={16} className="hicon" /> Text fun</h3>
      <p className="muted">Leet speak, morse code and reverse. Deeply serious tools.</p>
      <textarea rows="2" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="type something…" />
      <div className="btnRow">
        {[['leet', 'Leet'], ['morse', 'Morse'], ['reverse', 'Reverse']].map(([k, label]) => (
          <button key={k} className={mode === k ? '' : 'ghost sm'} onClick={() => setMode(k)}>{label}</button>
        ))}
        <button className="ghost sm" onClick={() => copy(out)}>Copy</button>
      </div>
      <code className="pw small">{out || '(empty)'}</code>
    </div>
  )
}

function BinHexTool() {
  const [txt, setTxt] = useState('hi')
  const [mode, setMode] = useState('t2b')
  const [copied, setCopied] = useState(false)
  const out = useMemo(() => {
    try {
      if (mode === 't2b') return [...txt].map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
      if (mode === 'b2t') {
        const clean = txt.replace(/\s+/g, '')
        if (!/^[01]*$/.test(clean) || clean.length % 8 !== 0) return '(binary must be groups of 8: 0s and 1s)'
        return clean.match(/.{8}/g).map((b) => String.fromCharCode(parseInt(b, 2))).join('')
      }
      if (mode === 't2h') return [...txt].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')
      const clean = txt.replace(/\s+/g, '')
      if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) return '(hex must be pairs 0-9 a-f)'
      return clean.match(/../g).map((b) => String.fromCharCode(parseInt(b, 16))).join('')
    } catch {
      return '(invalid input)'
    }
  }, [txt, mode])
  return (
    <div className="card">
      <h3><Binary size={16} className="hicon" /> Binary / Hex</h3>
      <p className="muted">Text to binary, binary back, same game in hex. Nerd essentials.</p>
      <div className="btnRow">
        {[['t2b', 'Text→Bin'], ['b2t', 'Bin→Text'], ['t2h', 'Text→Hex'], ['h2t', 'Hex→Text']].map(([k, label]) => (
          <button key={k} className={mode === k ? '' : 'ghost sm'} onClick={() => setMode(k)}>{label}</button>
        ))}
      </div>
      <textarea rows="2" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="input…" />
      <code className="pw small">{out}</code>
      <button className="ghost sm" onClick={() => { copy(out); setCopied(true); setTimeout(() => setCopied(false), 1200) }}>{copied ? 'Copied!' : 'Copy'}</button>
    </div>
  )
}

function lum(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ContrastTool() {
  const [c1, setC1] = useState('#7c5cff')
  const [c2, setC2] = useState('#0b0e14')
  const ok = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)
  const ratio = ok(c1) && ok(c2) ? (Math.max(lum(c1), lum(c2)) + 0.05) / (Math.min(lum(c1), lum(c2)) + 0.05) : null
  const badge = (pass) => <span className={pass ? 'passBadge' : 'failBadge'}>{pass ? 'PASS' : 'FAIL'}</span>
  return (
    <div className="card">
      <h3><Palette size={16} className="hicon" /> Contrast check</h3>
      <p className="muted">WCAG ratio for text on background. 4.5+ for normal text, 3+ for large.</p>
      <div className="colorRow">
        <input type="color" value={ok(c1) ? c1 : '#000000'} onChange={(e) => setC1(e.target.value)} />
        <input value={c1} onChange={(e) => setC1(e.target.value)} />
        <span>on</span>
        <input type="color" value={ok(c2) ? c2 : '#000000'} onChange={(e) => setC2(e.target.value)} />
        <input value={c2} onChange={(e) => setC2(e.target.value)} />
      </div>
      {ratio == null
        ? <p className="err">Use #rgb or #rrggbb.</p>
        : <>
          <code className="pw">{ratio.toFixed(2)} : 1</code>
          <div className="kv">
            <div className="row"><span>AA normal</span><code>needs 4.5</code>{badge(ratio >= 4.5)}</div>
            <div className="row"><span>AA large</span><code>needs 3.0</code>{badge(ratio >= 3)}</div>
            <div className="row"><span>AAA</span><code>needs 7.0</code>{badge(ratio >= 7)}</div>
          </div>
        </>}
    </div>
  )
}

function ImgCompressTool() {
  const [img, setImg] = useState(null)
  const [maxW, setMaxW] = useState(1280)
  const [fmt, setFmt] = useState('image/jpeg')
  const [q, setQ] = useState(0.8)
  const [out, setOut] = useState(null)
  const [busy, setBusy] = useState(false)
  const onFile = (f) => {
    if (!f) return
    if (out) URL.revokeObjectURL(out.url)
    const url = URL.createObjectURL(f)
    const el = new Image()
    el.onload = () => setImg({ url, w: el.naturalWidth, h: el.naturalHeight, name: f.name })
    el.src = url
  }
  const shrink = () => {
    if (!img) return
    setBusy(true)
    const el = new Image()
    el.onload = () => {
      const scale = Math.min(1, maxW / el.naturalWidth)
      const w = Math.round(el.naturalWidth * scale)
      const h = Math.round(el.naturalHeight * scale)
      const cv = document.createElement('canvas')
      cv.width = w
      cv.height = h
      cv.getContext('2d').drawImage(el, 0, 0, w, h)
      cv.toBlob((blob) => {
        if (out) URL.revokeObjectURL(out.url)
        if (!blob) { setBusy(false); return }
        setOut({ url: URL.createObjectURL(blob), kb: (blob.size / 1024).toFixed(1), w, h })
        setBusy(false)
      }, fmt, q)
    }
    el.src = img.url
  }
  return (
    <div className="card">
      <h3><Images size={16} className="hicon" /> Image shrinker</h3>
      <p className="muted">Resize + compress photos entirely on-device. Nothing uploads anywhere.</p>
      <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files[0])} />
      {img && <p className="muted">{img.name} - {img.w}x{img.h}px</p>}
      <label className="sliderRow">Max width: <b>{maxW}px</b>
        <input type="range" min="256" max="2048" step="64" value={maxW} onChange={(e) => setMaxW(+e.target.value)} />
      </label>
      <div className="btnRow">
        <select value={fmt} onChange={(e) => setFmt(e.target.value)}>
          <option value="image/jpeg">JPEG</option>
          <option value="image/webp">WebP</option>
          <option value="image/png">PNG</option>
        </select>
        {(fmt === 'image/jpeg' || fmt === 'image/webp') && <span className="muted">quality {Math.round(q * 100)}%</span>}
      </div>
      {(fmt === 'image/jpeg' || fmt === 'image/webp') && <input type="range" min="0.1" max="1" step="0.05" value={q} onChange={(e) => setQ(+e.target.value)} />}
      <div className="btnRow">
        <button onClick={shrink} disabled={!img || busy}>{busy ? 'Working…' : 'Shrink it'}</button>
      </div>
      {out && (
        <>
          <img className="imgPreview" src={out.url} alt="compressed" />
          <p className="muted">{out.w}x{out.h}px · {out.kb} KB</p>
          <a href={out.url} download={'shrunk-' + (img.name.split('.')[0] || 'image') + (fmt === 'image/png' ? '.png' : fmt === 'image/webp' ? '.webp' : '.jpg')}><button>Download</button></a>
        </>
      )}
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
            <p className="muted">Type any link or text - great for sharing localhost URLs to your phone.</p>
            <input value={qr} onChange={(e) => setQr(e.target.value)} placeholder="text or url" />
            {qr && <img className="qr" src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qr)}`} alt="qr" />}
          </div>
          <div className="card">
            <h3><Binary size={16} className="hicon" /> Base64 {b64mode}</h3>
            <p className="muted">Encode tokens and payloads - or paste Base64 back to decode it.</p>
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
          <ImageTool />
          <McNameTool />
          <PromptTool />
          <StopwatchTool />
          <PercentTool />
          <FunTextTool />
          <BinHexTool />
          <ContrastTool />
          <ImgCompressTool />
      </div>
    </>
  )
}

/* ---------- Mods hub ---------- */
import { MOD_GAMES, DL_TOOLS, SOFTWARE, PRANKS, TEMP_FILES, EVENTS } from './data/hubs.js'

function Mods({ query }) {
  const q = query.toLowerCase()
  const games = MOD_GAMES.map((g) => ({
    ...g,
    sites: g.sites.filter((s) => (g.game + s.name + s.desc).toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.sites.length > 0)
  return (
    <>
      <SectionHead title="Mod hubs" desc="Where to get mods for FiveM, Minecraft, GTA V and basically every moddable game - the communities everyone actually uses, not shady re-upload aggregators." />
      <div className="notice"><ShieldCheck size={15} className="hicon" /> <b>Mod safety:</b> download from the hubs below, never random Discord links. Scan archives (VirusTotal tab ↑), avoid any "mod" that is a <b>.exe</b>, back up saves first - and keep story-mode mods out of <b>GTA Online</b> unless you enjoy bans.</div>
      {games.map((g) => (
        <div key={g.game}>
          <h3 className="cat">{g.game} <span className="countBadge">{g.sites.length}</span></h3>
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
    best: 'Best MP4 + first 20 playlist items - delete the playlist flag for single videos.',
  }
  const doCopy = () => { copy(cmds[fmt]); setCopied(true); setTimeout(() => setCopied(false), 1200) }
  return (
    <>
      <SectionHead title="Video and audio downloader" desc="A static site can't rip YouTube by itself - that needs real software. So this page gives you the next best thing: a command generator for yt-dlp (the best tool) plus no-install alternatives." />
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

function Software({ query }) {
  const q = query.toLowerCase()
  const groups = SOFTWARE.map((g) => ({
    ...g,
    apps: g.apps.filter((a) => (g.group + a.name + a.desc).toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.apps.length > 0)
  return (
    <>
      <SectionHead title="Essential software" desc="The free apps nearly everyone ends up installing: browsers, players, utilities, dev tools, launchers. All free tiers or fully free - no trials masquerading as freeware." />
      {groups.map((g) => (
        <div key={g.group}>
          <h3 className="cat">{g.group} <span className="countBadge">{g.apps.length}</span></h3>
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

/* ---------- Recommend a site (delivered by email via FormSubmit) ----------
   Static sites can't send mail alone, so submissions POST to FormSubmit's
   free endpoint, which forwards them to the owner inbox. The very first
   submission triggers an activation email the owner must confirm once. */
function Recommend() {
  const [form, setForm] = useState({ site: '', name: '', desc: '', notes: '', from: '' })
  const [status, setStatus] = useState('idle')
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const send = async () => {
    if (!form.site.trim() || !form.desc.trim()) {
      setStatus('error')
      setMsg('Site URL + description are required - otherwise it is a mystery link.')
      return
    }
    let site = form.site.trim()
    if (!/^https?:\/\//i.test(site)) site = 'https://' + site
    try { new URL(site) } catch {
      setStatus('error')
      setMsg('That URL looks invalid. Copy it straight from the address bar.')
      return
    }
    setStatus('sending')
    setMsg('')
    try {
      const res = await fetch('https://formsubmit.co/ajax/sianellingsen@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `LootCave recommendation: ${form.name.trim() || site}`,
          _template: 'table',
          _captcha: 'false',
          _honey: '',
          'Site URL': site,
          'Site name': form.name.trim() || '(not given)',
          Description: form.desc.trim(),
          Notes: form.notes.trim() || '(none)',
          From: form.from.trim() || '(anonymous)',
        }),
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      setStatus('sent')
      setForm({ site: '', name: '', desc: '', notes: '', from: '' })
      logEvent('recommend', 'recommendation sent')
    } catch (e) {
      setStatus('error')
      setMsg('Could not send: ' + String(e.message).slice(0, 160) + '. Check connection and retry.')
      logEvent('recommend', 'send failed: ' + e.message)
    }
  }

  return (
    <>
      <SectionHead title="Recommend a site" desc="Found something that belongs in the cave? Drop the link, say what it is and why it's cool. Your suggestion is emailed straight to the owner for review." />
      <div className="grid2">
        <div className="card big">
          <h3><Send size={16} className="hicon" /> Suggest a site</h3>
          <input value={form.site} onChange={set('site')} placeholder="Site URL (https://…)" inputMode="url" />
          <input value={form.name} onChange={set('name')} placeholder="Site name" />
          <textarea rows="3" value={form.desc} onChange={set('desc')} placeholder="What is it? Why should it be listed?" />
          <textarea rows="2" value={form.notes} onChange={set('notes')} placeholder="Extra notes (optional): category it fits, free tier details…" />
          <input value={form.from} onChange={set('from')} placeholder="Your name/handle (optional)" />
          <div className="btnRow">
            <button onClick={send} disabled={status === 'sending'}><Send size={15} className="btnIcon" /> {status === 'sending' ? 'Sending…' : 'Send recommendation'}</button>
          </div>
          {status === 'sent' && <p className="muted">Sent! The owner reviews every suggestion before it goes live. Suggest another any time.</p>}
          {status === 'error' && <p className="err">{msg}</p>}
        </div>
        <div className="card">
          <h3>How this works</h3>
          <ul className="tips">
            <li><b>Reviewed by a human.</b> Nothing auto-publishes - good picks get added manually.</li>
            <li><b>What gets in:</b> free, useful, legal. Same bar as the rest of the directory.</li>
            <li><b>What doesn't:</b> pirate streams, "free Robux" scams, referral spam.</li>
            <li><b>First-time note:</b> the delivery service asks the owner to confirm once before the first email arrives.</li>
          </ul>
        </div>
      </div>
    </>
  )
}

/* ---------- Your custom scripts (saved in this browser) ---------- */
function loadScripts() {
  try {
    return JSON.parse(localStorage.getItem('lootcave-scripts') || '[]')
  } catch {
    return []
  }
}

function CustomScripts() {
  const [items, setItems] = useState(loadScripts)
  const [name, setName] = useState('')
  const [kind, setKind] = useState('Batch')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(() => {
    localStorage.setItem('lootcave-scripts', JSON.stringify(items))
  }, [items])
  const add = () => {
    if (!name.trim() || !code.trim()) { setMsg('Name + code required.'); return }
    setItems((a) => [{ name: name.trim(), kind, code }, ...a])
    setName('')
    setCode('')
    setMsg('Saved to this browser.')
    logEvent('pranks', 'script saved: ' + name.trim())
    setTimeout(() => setMsg(''), 2500)
  }
  const remove = (n) => {
    setItems((a) => a.filter((x) => x.name !== n))
    logEvent('pranks', 'script removed: ' + n)
  }
  return (
    <>
      <h3 className="cat">Your scripts <span className="countBadge">{items.length}</span></h3>
      <p className="catDesc">Your own snippets live here. Same rules as above: harmless only.</p>
      <div className="cards">
        <div className="card">
          <h3><Plus size={16} className="hicon" /> New script</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. fake update screen)" />
          <label className="setRow">Type
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {['Batch', 'CMD', 'PowerShell', 'JavaScript', 'Python', 'Other'].map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <textarea rows="4" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the code…" />
          <button onClick={add}>Save script</button>
          {msg && <p className="muted">{msg}</p>}
        </div>
        {items.map((s) => (
          <div key={s.name} className="card">
            <h3>{s.name}</h3>
            <p className="muted">{s.kind} · yours</p>
            <pre className="dump">{s.code}</pre>
            <div className="btnRow">
              <button className="ghost sm" onClick={() => copy(s.code)}><Copy size={13} className="btnIcon" /> Copy</button>
              <button className="ghost sm" onClick={() => remove(s.name)}>remove</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------- Harmless prank kit ---------- */
function Pranks({ query }) {
  const q = query.toLowerCase()
  const list = PRANKS.filter((p) => (p.title + p.desc + p.code).toLowerCase().includes(q))
  return (
    <>
      <SectionHead title="Harmless prank kit" desc="Copy-paste troll commands: local CMD classics plus spicier LAN pranks for PCs on your Wi-Fi. Rule stays the same: everything here is reversible, and every scary one ships its antidote. Consent only - friends, family, your own machines." />
      <div className="notice"><Laugh size={15} className="hicon" /> <b>Rules of trolling:</b> prank friends, never work PCs or strangers. Batch files: paste into Notepad → Save as <code>prank.bat</code> (type: All files) → double-click. CMD one-liners paste straight into Command Prompt.</div>
      <div className="cards">
        {list.map((p) => (
          <div key={p.title} className="card">
            <h3>{p.title}</h3>
            <p className="muted">{p.kind} · harm level: 0</p>
            <p>{p.desc}</p>
            <pre className="dump">{p.code}</pre>
            <div className="btnRow">
              <button className="ghost sm" onClick={() => copy(p.code)}><Copy size={13} className="btnIcon" /> Copy</button>
              {p.extra && <button className="ghost sm" onClick={() => copy(p.extra)}><Copy size={13} className="btnIcon" /> Copy {p.extraLabel || 'extra'}</button>}
            </div>
            {p.note && <p className="muted">{p.note}</p>}
          </div>
        ))}
      </div>
      {list.length === 0 && <p className="muted">No matches. Try "matrix", "shutdown" or "batch".</p>}
      <CustomScripts />
    </>
  )
}

/* ---------- Live chat (Nostr relays - real-time, zero backend) ----------
   Messages publish as public Nostr notes tagged #lootcave on free relays.
   Anyone on the network can read them: no passwords, no DMs, be kind. */
const CHAT_TAG = 'lootcave'
const CHAT_RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band']

function shortNpub(pub) {
  try {
    return nip19.npubEncode(pub).slice(0, 14) + '…'
  } catch {
    return pub.slice(0, 10) + '…'
  }
}

function Chat() {
  const [nick, setNick] = useState(() => localStorage.getItem('lootcave-nick') || '')
  const [draftNick, setDraftNick] = useState(localStorage.getItem('lootcave-nick') || '')
  const [joined, setJoined] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('offline')
  const poolRef = useRef(null)
  const subRef = useRef(null)
  const skRef = useRef(null)
  const bottomRef = useRef(null)

  const leave = useCallback(() => {
    try { subRef.current?.close() } catch { /* ignore */ }
    try { poolRef.current?.close(CHAT_RELAYS) } catch { /* ignore */ }
    subRef.current = null
    poolRef.current = null
    skRef.current = null
    setJoined(false)
    setStatus('offline')
  }, [])
  useEffect(() => leave, [leave])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const join = () => {
    const n = draftNick.trim().slice(0, 20) || 'anon'
    setNick(n)
    localStorage.setItem('lootcave-nick', n)
    let skHex = localStorage.getItem('lootcave-nostr-sk')
    if (!skHex) {
      skHex = [...generateSecretKey()].map((x) => x.toString(16).padStart(2, '0')).join('')
      localStorage.setItem('lootcave-nostr-sk', skHex)
    }
    skRef.current = new Uint8Array(skHex.match(/../g).map((h) => parseInt(h, 16)))
    setStatus('connecting…')
    try {
      const pool = new SimplePool()
      poolRef.current = pool
      subRef.current = pool.subscribeMany(CHAT_RELAYS, [{ kinds: [1], '#t': [CHAT_TAG], limit: 40 }], {
        onevent: (ev) => {
          if (!ev || !ev.content) return
          setMsgs((m) => {
            if (m.some((x) => x.id === ev.id)) return m
            const next = [...m, { id: ev.id, content: String(ev.content).slice(0, 500), at: ev.created_at, pub: ev.pubkey }].sort((a, b) => a.at - b.at)
            return next.slice(-120)
          })
          setStatus('live')
        },
        oneose: () => setStatus('live'),
      })
      try {
        void nip19.npubEncode(getPublicKey(skRef.current))
      } catch { /* identity check only */ }
      setJoined(true)
      logEvent('chat', 'joined as ' + n)
    } catch (e) {
      setStatus('failed: ' + String(e.message).slice(0, 120))
    }
  }

  const send = () => {
    const text = draft.trim().slice(0, 500)
    if (!text || !poolRef.current || !skRef.current) return
    try {
      const ev = finalizeEvent(
        { kind: 1, created_at: Math.floor(Date.now() / 1000), tags: [['t', CHAT_TAG], ['client', 'lootcave']], content: `${nick}: ${text}` },
        skRef.current,
      )
      poolRef.current.publish(CHAT_RELAYS, ev).catch(() => setStatus('send failed (relays unreachable)'))
      setDraft('')
    } catch {
      setStatus('send failed')
    }
  }

  if (!joined) {
    return (
      <>
        <SectionHead title="Live chat" desc="A real public chat room with no accounts and no server - messages travel over the free Nostr relay network, tagged #lootcave." />
        <div className="card lockWrap">
          <h2>Pick a nickname, jump in</h2>
          <p className="muted">Your chat identity is a throwaway key stored in this browser only. Everything said here is <b>public</b> - never share passwords or personal info.</p>
          <ul className="tips">
            <li>Be kind. No spam, no slurs, no sketchy links.</li>
            <li>No personal info - yours or anyone else's.</li>
            <li>Mods (soon) can time you out. Three strikes, you're out.</li>
          </ul>
          <div className="lockCol">
            <input value={draftNick} onChange={(e) => setDraftNick(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && join()} placeholder="nickname (e.g. cavegoblin)" maxLength={20} />
            <button onClick={join}><MessageCircle size={15} className="btnIcon" /> Join #lootcave</button>
          </div>
          <p className="muted">Relays not cooperating? Fallback room, zero setup: <a href="https://hack.chat/?lootcave" target="_blank" rel="noreferrer">hack.chat/?lootcave</a></p>
        </div>
      </>
    )
  }

  return (
    <>
      <SectionHead title="Live chat" desc="Public room on Nostr relays. You leave automatically when you switch tabs - rejoin any time." />
      <div className={`connPill ${status === 'live' ? 'ok' : 'bad'}`}>
        <span className="dotPulse" /> #{CHAT_TAG} · <b>{status}</b> · as <b>{nick}</b>
      </div>
      <div className="card big">
        <div className="chatBox">
          {msgs.length === 0 && <p className="muted">Quiet… for now. Say hi and claim first message.</p>}
          {msgs.map((m) => (
            <div key={m.id} className="chatLine">
              <span>[{new Date(m.at * 1000).toLocaleTimeString()}] [{shortNpub(m.pub)}]</span> {m.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="chatRow">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={`message as ${nick}…`} maxLength={500} />
          <button onClick={send}>Send</button>
          <button className="ghost" onClick={() => { leave(); logEvent('chat', 'left') }}>Leave</button>
        </div>
      </div>
    </>
  )
}

/* ---------- About ---------- */
function About({ settings, go }) {
  const invite = (settings.discordInvite || '').trim()
  return (
    <>
      <SectionHead title="About LootCave" desc="What this place is, who runs it, the rules, and where to hang out." />
      <div className="grid2">
        <div className="card big">
          <h3><Info size={16} className="hicon" /> Mission</h3>
          <p>LootCave collects the web's most useful throwaway tools and free resources in one place: disposable emails with a live inbox, public SMS receivers, test identities, mod hubs, a media downloader, mini tools, live chat, and a directory of 200+ reviewed sites. No accounts, no tracking, no paywalls. Every entry carries a description so visitors always understand why it is listed and who it is for.</p>
          <h3>Who runs it?</h3>
          <p>LootCave is built and maintained by Elling (Founder and CEO). Site suggestions submitted through the Recommend tab are reviewed personally, and accepted entries go live with credit to the finder. Broken links, dead tools, and corrections are welcome through the same channel.</p>
          <h3>Pricing</h3>
          <p>Free, permanently. The site is fully static, runs on free public APIs, and is hosted at no cost on Cloudflare Pages. Operating costs are zero, so there are no premium tiers, no ads, and no paywalls.</p>
          <h3>Privacy</h3>
          <p>Settings, custom sites, and chat nicknames never leave the visitor's browser. Two exceptions to understand: temporary emails and numbers are public by design, and chat messages travel over public relays. Neither should ever carry sensitive information.</p>
          <h3>House rules</h3>
          <ul className="tips">
            <li>Free temp stuff is public. Never banking, recovery, or anything sensitive.</li>
            <li>Fake IDs are for testing signups, never legal documents.</li>
            <li>Only legal streaming and legal downloads. No pirate links, ever.</li>
            <li>Pranks stay harmless and consensual. LAN pranks need permission.</li>
          </ul>
        </div>
        <div className="cards single">
          <div className="card">
            <h3><MessageCircle size={16} className="hicon" /> Community Discord</h3>
            {invite ? (
              <>
                <p className="muted">Hang out, suggest sites, report broken links, share setups.</p>
                <a href={invite} target="_blank" rel="noreferrer"><button>Join the Discord</button></a>
              </>
            ) : (
              <p className="muted">The Discord server is being set up - check back soon. (Owner: paste the invite in Settings, Community.)</p>
            )}
            <div className="btnRow">
              <button className="ghost" onClick={() => go('chat')}>Open live chat</button>
              <button className="ghost" onClick={() => go('recommend')}>Recommend a site</button>
            </div>
          </div>
          <div className="card">
            <h3>Upcoming events</h3>
            {EVENTS.map((e) => (
              <div key={e.title} className="linkRow">
                <b>{e.title} · {e.date}</b><span>{e.desc}</span>
              </div>
            ))}
            <p className="muted">Got an event idea? Pitch it in the Discord or the chat.</p>
          </div>
          <div className="card">
            <h3><Wrench size={16} className="hicon" /> Built with</h3>
            <ul className="tips">
              <li>React + Vite, static only, zero backend</li>
              <li>Lucide icons, 10 themes, localStorage everything</li>
              <li>1secmail + Nostr relays + FormSubmit (all free tiers)</li>
              <li>Hosted free on Cloudflare Pages</li>
            </ul>
            <p className="muted">© 2026 LootCave - built for fun, use responsibly.</p>
          </div>
        </div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>The team</h3>
          <div className="member">
            <div className="avatar">E</div>
            <div className="memberMain">
              <b>Elling</b>
              <span className="roleBadge">Founder / CEO</span>
              <span className="muted">16 - product direction, content review, design</span>
            </div>
          </div>
          <p className="muted">Open volunteer roles: <b>Moderator</b> (Discord and chat conduct) and <b>Scout</b> (sources new tools through the Recommend tab). Apply with a recommendation marked APPLICATION in the notes.</p>
        </div>
        <div className="card">
          <h3>The business side</h3>
          <ul className="tips">
            <li><b>Status:</b> independent hobby project. Revenue: none. Operating cost: none.</li>
            <li><b>Roadmap:</b> custom domain, custom email, then formal registration when revenue justifies it.</li>
            <li><b>Policy:</b> no company registration is required until real money moves. Financial records are kept from day one regardless.</li>
          </ul>
        </div>
      </div>
    </>
  )
}

/* ---------- Temporary file hosts ---------- */
function TempFiles({ query }) {
  const q = query.toLowerCase()
  const list = [...TEMP_FILES].sort((a, b) => a.name.localeCompare(b.name)).filter((f) => (f.name + f.desc + f.keep).toLowerCase().includes(q))
  return (
    <>
      <SectionHead title="Temporary file hosts" desc="Upload once, share the link, gone on a timer. Every card shows exactly how long your file survives. Nothing here needs an account." />
      <div className="notice"><Timer size={15} className="hicon" /> <b>Temp means temp.</b> Assume anything uploaded can be seen by anyone with the link, and that it vanishes on schedule. For secrets, prefer File.io (single download) and encrypt first.</div>
      <div className="cards">
        {list.map((f) => (
          <div key={f.name} className="card linkWrap">
            <a className="linkMain" href={f.url} target="_blank" rel="noreferrer">
              <h3>{f.name} <ExternalLink size={13} className="hicon" /> <span className="keepBadge">{f.keep}</span></h3>
              <p>{f.desc}</p>
            </a>
          </div>
        ))}
      </div>
      {list.length === 0 && <p className="muted">No matches. Try "72 hours" or "permanent".</p>}
    </>
  )
}

/* ---------- System status: public diagnostics, no login needed ---------- */
function readStorageKeys() {
  try {
    return Array.from({ length: localStorage.length }, (_, i) => {
      const k = localStorage.key(i)
      return { k, bytes: (k || '').length + (localStorage.getItem(k) || '').length }
    }).sort((a, b) => b.bytes - a.bytes)
  } catch {
    return []
  }
}

function System({ go }) {
  const [health, setHealth] = useState({})
  const [checking, setChecking] = useState(false)
  const [keys, setKeys] = useState(readStorageKeys)
  const [visits] = useState(() => +(localStorage.getItem('lootbox-visits') || 0))

  const ping = async (key, fn) => {
    setHealth((h) => ({ ...h, [key]: { status: 'checking…' } }))
    const t0 = performance.now()
    try {
      const detail = await fn()
      setHealth((h) => ({ ...h, [key]: { status: 'ok', ms: Math.round(performance.now() - t0), detail } }))
    } catch (e) {
      setHealth((h) => ({ ...h, [key]: { status: 'fail', detail: String(e.message).slice(0, 140) } }))
    }
  }

  const checkRelay = (url) => new Promise((finish) => {
    const t0 = performance.now()
    let done = false
    const end = (ok, detail) => {
      if (done) return
      done = true
      try { ws.close() } catch { /* ignore */ }
      finish({ ok, ms: Math.round(performance.now() - t0), detail })
    }
    let ws = null
    try {
      ws = new WebSocket(url)
      const to = setTimeout(() => end(false, 'timeout after 8s'), 8000)
      ws.onopen = () => { clearTimeout(to); end(true, 'handshake ok') }
      ws.onerror = () => { clearTimeout(to); end(false, 'connection refused') }
    } catch (e) {
      end(false, String(e.message).slice(0, 80))
    }
  })

  const runChecks = async () => {
    setChecking(true)
    await ping('Temp email route (1secmail)', async () => {
      const { route, ms } = await fetch1sec('?action=getDomainList')
      return `via ${route}, ${ms}ms`
    })
    await ping('QR image API', async () => {
      await new Promise((res, rej) => {
        const img = new Image()
        img.onload = res
        img.onerror = () => rej(new Error('image failed to load'))
        img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=10x10&data=ping'
      })
      return 'image rendered'
    })
    for (const r of CHAT_RELAYS) {
      const label = 'Relay ' + r.replace('wss://', '')
      setHealth((h) => ({ ...h, [label]: { status: 'checking…' } }))
      const t = await checkRelay(r)
      setHealth((h) => ({ ...h, [label]: { status: t.ok ? 'ok' : 'fail', ms: t.ms, detail: t.detail } }))
    }
    setChecking(false)
    logEvent('system', 'status check run')
  }

  const clearKey = (k) => {
    if (!confirm(`Delete stored data for "${k}"? The site will recreate defaults.`)) return
    localStorage.removeItem(k)
    setKeys(readStorageKeys())
    logEvent('system', 'cleared storage key: ' + k)
  }

  const totalKB = (keys.reduce((n, x) => n + x.bytes, 0) / 1024).toFixed(1)
  return (
    <>
      <SectionHead title="System status" desc="Live health of everything LootCave depends on, plus exactly what the site stores in your browser. Public page - for the private controls, see Admin." />
      <div className="btnRow">
        <button onClick={runChecks} disabled={checking}>{checking ? 'Checking…' : 'Run checks'}</button>
        <button className="ghost" onClick={() => go('admin')}>Open Admin</button>
      </div>
      <div className="grid2">
        <div className="card big">
          <h3>Service health</h3>
          {Object.keys(health).length === 0 && <p className="muted">Not checked yet - hit Run checks.</p>}
          {Object.entries(health).map(([k, v]) => (
            <div key={k} className="row healthRow">
              <span>{k}</span>
              <code className={v.status === 'ok' ? 'ok' : v.status === 'fail' ? 'bad' : ''}>{v.status}{v.ms != null ? ` · ${v.ms}ms` : ''}{v.detail ? ` - ${v.detail}` : ''}</code>
            </div>
          ))}
          <h3>Browser</h3>
          <div className="kv">
            <div className="row"><span>online</span><code>{navigator.onLine ? 'yes' : 'no (offline mode)'}</code></div>
            <div className="row"><span>language</span><code>{navigator.language}</code></div>
            <div className="row"><span>screen</span><code>{window.screen.width}x{window.screen.height}</code></div>
            <div className="row"><span>visits</span><code>{visits} page loads</code></div>
          </div>
        </div>
        <div className="card">
          <h3>Storage ({totalKB} KB)</h3>
          <p className="muted">Every key LootCave keeps in your browser. Delete one to reset just that part.</p>
          {keys.length === 0 && <p className="muted">Empty.</p>}
          {keys.map((x) => (
            <div key={x.k} className="row">
              <span>{(x.bytes / 1024).toFixed(1)}k</span>
              <code>{x.k}</code>
              <button className="ghost sm" onClick={() => clearKey(x.k)}>clear</button>
            </div>
          ))}
          <div className="btnRow">
            <button className="ghost sm" onClick={() => setKeys(readStorageKeys())}>Refresh</button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ---------- Discord server kit: example packs for YOUR server ----------
   Nothing here builds a LootCave clone - these are generic layouts, rules
   and roles anyone can steal for their own community, plus the bots that
   do the heavy lifting. */
const EXAMPLE_LAYOUTS = [
  { title: 'Gaming hangout', text: `INFO\n#welcome (read-only)\n#rules (read-only)\n#announcements (staff only)\nHANGOUT\n#general\n#clips-and-memes\n#looking-for-group\n#tech-support\nVOICE\nLobby + AFK` },
  { title: 'Study group', text: `INFO\n#welcome (read-only)\n#rules (read-only)\n#resources (read-only)\nSTUDY\n#general\n#homework-help\n#notes-and-guides\n#focus-room (quiet chat)\nVOICE\nStudy Hall + Break Room` },
  { title: 'Support server', text: `INFO\n#welcome (read-only)\n#rules (read-only)\n#faq (read-only)\nSUPPORT\n#help-desk\n#bug-reports\n#suggestions\n#changelog (staff only)\nVOICE\nSupport + AFK` },
]

const EXAMPLE_RULES = `SERVER RULES (example - edit freely)
1. Keep it legal. No pirate links, no malware, no scams.
2. No personal info - yours or anyone else's.
3. No spam, no hate, no NSFW outside marked channels.
4. Listen to mods. Warning, then timeout, then ban.`

const EXAMPLE_WELCOME = `Welcome to [server name]!
- Read #rules first (30 seconds, promise)
- Say hi in #general
- Need help? Ask anywhere - someone always answers`

const EXAMPLE_ROLES = [
  { name: 'Owner', color: '#7c5cff', perms: 'Administrator - you, nobody else' },
  { name: 'Mod', color: '#00e5cc', perms: 'Manage Messages + Timeout Members' },
  { name: 'Helper', color: '#a3be8c', perms: 'Help in support channels, no mod powers' },
  { name: 'Member', color: '#8b98ad', perms: 'Chat + voice, the default everyone gets' },
]

const KIT_BOTS = [
  { name: 'Xenon', url: 'https://xenon.bot', desc: 'Backups, templates and cloning. Run backup-create before any big change. Template pick: Simple Server Template, load code r2uhQjNFKYHA.' },
  { name: 'Carl-bot', url: 'https://carl.gg', desc: 'Reaction roles, automod and logging. The workhorse of small servers.' },
  { name: 'MEE6', url: 'https://mee6.xyz', desc: 'Levels, welcome messages and basic moderation. Free tier covers the essentials.' },
]

function Guide({ settings }) {
  const [copied, setCopied] = useState('')
  const doCopy = (label, text) => {
    copy(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }
  const invite = ((settings && settings.discordInvite) || '').trim()
  return (
    <>
      <SectionHead title="Discord server kit" desc="Steal-worthy building blocks for YOUR server: example layouts, rules, roles and the bots worth inviting. Everything copies in one click - swap the names and make it yours." />
      <div className="grid2">
        <div className="cards single">
          {EXAMPLE_LAYOUTS.map((l) => (
            <div className="card" key={l.title}>
              <h3>Example layout: {l.title}</h3>
              <pre className="dump">{l.text}</pre>
              <button className="ghost sm" onClick={() => doCopy(l.title, l.text)}>{copied === l.title ? 'Copied!' : 'Copy layout'}</button>
            </div>
          ))}
          <div className="card">
            <h3>Example rules</h3>
            <pre className="dump">{EXAMPLE_RULES}</pre>
            <button className="ghost sm" onClick={() => doCopy('rules', EXAMPLE_RULES)}>{copied === 'rules' ? 'Copied!' : 'Copy rules'}</button>
          </div>
          <div className="card">
            <h3>Example welcome</h3>
            <pre className="dump">{EXAMPLE_WELCOME}</pre>
            <button className="ghost sm" onClick={() => doCopy('welcome', EXAMPLE_WELCOME)}>{copied === 'welcome' ? 'Copied!' : 'Copy welcome'}</button>
          </div>
        </div>
        <div className="cards single">
          <div className="card">
            <h3>Example roles</h3>
            <p className="muted">Top to bottom = most to least power. A role can only manage roles below it.</p>
            {EXAMPLE_ROLES.map((r) => (
              <div key={r.name} className="linkRow">
                <b><span className="roleDot" style={{ background: r.color }} />{r.name}</b><span>{r.perms}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>Bots worth inviting</h3>
            {KIT_BOTS.map((b) => (
              <a key={b.name} className="linkRow" href={b.url} target="_blank" rel="noreferrer">
                <b>{b.name}</b><span>{b.desc}</span>
              </a>
            ))}
            <p className="muted">Rule of thumb: 2-3 bots max. Every extra bot is another dashboard to configure. Never use tools asking for your personal account token.</p>
          </div>
          <div className="card">
            <h3>Want this community?</h3>
            {invite
              ? <><p className="muted">Skip building - join the real LootCave Discord instead.</p><a href={invite} target="_blank" rel="noreferrer"><button>Join the Discord</button></a></>
              : <p className="muted">The LootCave Discord invite appears here once the owner links it in Settings.</p>}
          </div>
        </div>
      </div>
    </>
  )
}

/* ---------- Playlist mover: YouTube fetch + universal converter ----------
   True login-to-login moving needs OAuth, so this tab does the static-safe
   version: read public YouTube playlists via free Piped/Invidious APIs,
   convert any pasted list, and jump each track into Spotify / YTM search.
   Full-auto services are listed on the side. */
const PIPED_INSTANCES = ['https://pipedapi.kavin.rocks', 'https://pipedapi.adminforge.de', 'https://pipedapi.reallyaweso.me', 'https://api-piped.mha.fi']
const INVIDIOUS_INSTANCES = ['https://inv.tux.pizza', 'https://invidious.nerdvpn.de', 'https://iv.duti.dev']

const MOVER_SERVICES = [
  { name: 'TuneMyMusic', url: 'https://www.tunemymusic.com', desc: 'Move playlists between Spotify, YouTube, Apple and more. Free tier moves 500 tracks.' },
  { name: 'Soundiiz', url: 'https://soundiiz.com', desc: 'The veteran converter. Free tier handles playlists one by one.' },
  { name: 'SongShift', url: 'https://www.songshift.com', desc: 'iOS app for shifting playlists between services.' },
  { name: 'FreeYourMusic', url: 'https://freeyourmusic.com', desc: 'Desktop + mobile mover with a free starter tier.' },
]

function cleanTrackTitle(t) {
  return String(t || '')
    .replace(/\s*[([]\s*(official\s*)?(music\s*)?(video|audio|lyrics?|visualizer|visualiser|hd|4k|mv)\s*[)\]]\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function ytPlaylistId(url) {
  const m = String(url).match(/[?&]list=([a-zA-Z0-9_-]+)/)
  return m ? m[1] : null
}

async function fetchYtPlaylist(url) {
  const id = ytPlaylistId(url)
  if (!id) throw new Error('No playlist ID found - paste a URL containing list=...')
  const errors = []
  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${base}/playlists/${id}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const j = await res.json()
      if (j && Array.isArray(j.videos) && j.videos.length) {
        return { title: j.name || 'YouTube playlist', tracks: j.videos.map((v) => cleanTrackTitle(v.title)).filter(Boolean) }
      }
      throw new Error('empty playlist response')
    } catch (e) { errors.push('piped: ' + e.message) }
  }
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${base}/api/v1/playlists/${id}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const j = await res.json()
      if (j && Array.isArray(j.videos) && j.videos.length) {
        return { title: j.title || 'YouTube playlist', tracks: j.videos.map((v) => cleanTrackTitle(v.title)).filter(Boolean) }
      }
      throw new Error('empty playlist response')
    } catch (e) { errors.push('invidious: ' + e.message) }
  }
  throw new Error('All playlist APIs unreachable right now - paste the track list manually below.')
}

const spLink = (t) => `https://open.spotify.com/search/${encodeURIComponent(t)}`
const ytLink = (t) => `https://www.youtube.com/results?search_query=${encodeURIComponent(t)}`
const ytmLink = (t) => `https://music.youtube.com/search?q=${encodeURIComponent(t)}`

function Playlists() {
  const [ytUrl, setYtUrl] = useState('')
  const [tracks, setTracks] = useState([])
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [paste, setPaste] = useState('')
  const [manual, setManual] = useState('')

  const loadYt = async () => {
    setBusy(true)
    setErr('')
    try {
      const r = await fetchYtPlaylist(ytUrl)
      setTitle(r.title)
      setTracks(r.tracks)
      logEvent('playlists', `fetched ${r.tracks.length} tracks`)
    } catch (e) {
      setErr(String(e.message).slice(0, 220))
    } finally {
      setBusy(false)
    }
  }
  const loadPaste = () => {
    const lines = paste.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!lines.length) { setErr('Paste at least one track (one per line).'); return }
    setErr('')
    setTitle('Pasted list')
    setTracks(lines)
    logEvent('playlists', `loaded ${lines.length} pasted tracks`)
  }
  const addManual = () => {
    const t = manual.trim()
    if (!t) return
    setTracks((a) => [...a, t])
    setManual('')
  }
  const removeAt = (i) => setTracks((a) => a.filter((_, x) => x !== i))
  const clear = () => { setTracks([]); setTitle(''); setPaste('') }
  const asTxt = tracks.join('\n')
  const asCsv = 'title,spotify,yt_music,youtube\n' + tracks.map((t) => `"${t.replace(/"/g, '""')}","${spLink(t)}","${ytmLink(t)}","${ytLink(t)}"`).join('\n')
  const download = (name, text) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  }
  return (
    <>
      <SectionHead title="Playlist mover" desc="Move music between apps without retyping 200 songs. Auto-read a public YouTube playlist, or paste any track list, then jump each song into Spotify or YouTube Music search - or export it all." />
      <div className="grid2">
        <div className="card big">
          <h3>1. Get tracks in</h3>
          <p className="muted">Option A - auto-read a public YouTube playlist (no login, via public Piped/Invidious APIs):</p>
          <div className="chatRow">
            <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadYt()} placeholder="https://youtube.com/playlist?list=…" inputMode="url" />
            <button onClick={loadYt} disabled={busy}>{busy ? 'Reading…' : 'Read'}</button>
          </div>
          <p className="muted">Option B - paste any list (Spotify shares, text files), one track per line:</p>
          <textarea rows="3" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'Daft Punk - Get Lucky\nDua Lipa - Houdini'} />
          <div className="btnRow">
            <button className="ghost" onClick={loadPaste}>Load pasted list</button>
            {tracks.length > 0 && <button className="ghost" onClick={clear}>Clear all</button>}
          </div>
          {err && <p className="err">{err}</p>}
          {title && <p className="muted">{title} - {tracks.length} tracks</p>}
          {tracks.length > 0 && (
            <>
              <div className="chatRow">
                <input value={manual} onChange={(e) => setManual(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addManual()} placeholder="Add one more track…" />
                <button className="ghost sm" onClick={addManual}>Add</button>
              </div>
              <h3>2. Send them out</h3>
              <div className="btnRow">
                <button className="ghost sm" onClick={() => copy(asTxt)}>Copy list</button>
                <button className="ghost sm" onClick={() => download('playlist.txt', asTxt)}>TXT</button>
                <button className="ghost sm" onClick={() => download('playlist.csv', asCsv)}>CSV</button>
              </div>
              <div className="kv">
                {tracks.map((t, i) => (
                  <div key={i} className="row">
                    <span>{i + 1}</span>
                    <code>{t}</code>
                    <span className="btnRow" style={{ marginTop: 0 }}>
                      <a className="miniLink" href={spLink(t)} target="_blank" rel="noreferrer">Spotify</a>
                      <a className="miniLink" href={ytmLink(t)} target="_blank" rel="noreferrer">YTM</a>
                      <a className="miniLink" href={ytLink(t)} target="_blank" rel="noreferrer">YT</a>
                      <button className="ghost sm" onClick={() => removeAt(i)}>x</button>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="card">
          <h3>Full-auto movers</h3>
          <p className="muted">Want login-to-login moving in one click? These services do the OAuth dance for you (free tiers included):</p>
          {MOVER_SERVICES.map((m) => (
            <a key={m.name} className="linkRow" href={m.url} target="_blank" rel="noreferrer">
              <b>{m.name}</b><span>{m.desc}</span>
            </a>
          ))}
          <h3>How it works here</h3>
          <ul className="tips">
            <li><b>Spotify links</b> open search with the track pre-filled - tap + to save.</li>
            <li><b>YTM links</b> do the same in YouTube Music.</li>
            <li><b>CSV export</b> opens cleanly in Sheets or Excel for bulk work.</li>
          </ul>
        </div>
      </div>
    </>
  )
}

/* ---------- AI Helper (Puter.js - free models, no API key) ----------
   Verified: Pollinations now needs Turnstile (bot-blocked) and Duck.ai
   sends no CORS headers, so both are dead from static pages. Puter.js
   loads as a browser SDK and spends the VISITOR's free allowance, which
   is why first use may ask for a free Puter sign-in. Code is real: the
   SDK answers with any model Puter serves, including strong coders. */
function loadPuter() {
  if (window.puter && window.puter.ai) return Promise.resolve(window.puter)
  if (loadPuter.p) return loadPuter.p
  loadPuter.p = new Promise((res, rej) => {
    const s = document.createElement('script')
    s.src = 'https://js.puter.com/v2/'
    s.onload = () => (window.puter && window.puter.ai ? res(window.puter) : rej(new Error('Puter SDK loaded but no AI module.')))
    s.onerror = () => rej(new Error('Could not load the Puter SDK (offline or blocked by an adblocker).'))
    document.head.appendChild(s)
    setTimeout(() => rej(new Error('Puter SDK timed out after 20s.')), 20000)
  })
  return loadPuter.p
}

function extractAiText(resp) {
  if (typeof resp === 'string') return resp
  const c = resp && resp.message && resp.message.content
  if (typeof c === 'string') return c
  if (Array.isArray(c)) return c.map((b) => (typeof b === 'string' ? b : b.text || '')).join('')
  return JSON.stringify(resp).slice(0, 2000)
}

function renderAi(text) {
  const parts = String(text).split('```')
  return parts.map((p, i) => {
    if (i % 2 === 1) {
      const nl = p.indexOf('\n')
      const lang = nl === -1 ? '' : p.slice(0, nl).trim()
      const code = (nl === -1 ? p : p.slice(nl + 1)).replace(/\n$/, '')
      return (
        <div key={i} className="codeWrap">
          {lang && <span className="codeLang">{lang}</span>}
          <pre className="dump">{code}</pre>
          <button className="ghost sm" onClick={() => copy(code)}>Copy code</button>
        </div>
      )
    }
    return <p key={i} className="aiText">{p}</p>
  })
}

const AI_SYSTEM = {
  general: 'You are LootCave Helper, a friendly assistant inside a free toolbox website. Be concise and genuinely useful. Use short paragraphs. Wrap any code in triple-backtick fences with the language.',
  code: 'You are LootCave Code Helper, an expert programmer. Lead with working code in triple-backtick fences (always name the language), then a short explanation of how it works and how to run it. Keep prose tight. If the request is ambiguous, pick the most likely interpretation and say what you assumed.',
}

const AI_PRESETS = [
  'Explain recursion like I am 12',
  'Write a Python to-do CLI app',
  'Debug this JS: fetch returns undefined',
  'Write a professional sick-day email',
]

function loadAiChat() {
  try {
    const m = JSON.parse(localStorage.getItem('lootcave-ai') || '[]')
    return Array.isArray(m) ? m.slice(-40) : []
  } catch {
    return []
  }
}

function AiHelper() {
  const [msgs, setMsgs] = useState(loadAiChat)
  const [draft, setDraft] = useState('')
  const [mode, setMode] = useState('general')
  const [model, setModel] = useState('auto')
  const [customModel, setCustomModel] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [needLogin, setNeedLogin] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('lootcave-ai', JSON.stringify(msgs.slice(-40)))
  }, [msgs])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, busy])

  const send = async (text) => {
    const content = (text ?? draft).trim()
    if (!content || busy) return
    setErr('')
    setNeedLogin(false)
    const history = [...msgs, { role: 'user', text: content }]
    setMsgs(history)
    setDraft('')
    setBusy(true)
    try {
      const puter = await loadPuter()
      const payload = [
        { role: 'system', content: AI_SYSTEM[mode] },
        ...history.map((m) => ({ role: m.role, content: m.text })),
      ]
      const opts = { normalize: true }
      const picked = model === 'custom' ? customModel.trim() : model === 'auto' ? undefined : model
      if (picked) opts.model = picked
      const answer = await Promise.race([
        puter.ai.chat(payload, opts),
        new Promise((_, rej) => setTimeout(() => rej(new Error('AI timed out after 120s - retry.')), 120000)),
      ])
      setMsgs((m) => [...m, { role: 'assistant', text: extractAiText(answer) }])
      logEvent('ai', `answered (${mode}, ${picked || 'auto'})`)
    } catch (e) {
      const msg = String((e && e.message) || e)
      if (/sign|auth|login|permission|401|403/i.test(msg)) {
        setNeedLogin(true)
        setErr('Puter asked for sign-in: its free allowance lives on your free Puter account. Sign in once, then send again.')
      } else {
        setErr('AI failed: ' + msg.slice(0, 200))
      }
      logEvent('ai', 'failed: ' + msg.slice(0, 120))
    } finally {
      setBusy(false)
    }
  }

  const signIn = async () => {
    try {
      const puter = await loadPuter()
      await puter.auth.signIn()
      setNeedLogin(false)
      setErr('')
    } catch {
      setErr('Sign-in popup was blocked or cancelled.')
    }
  }

  const exportMd = () => {
    const md = msgs.map((m) => (m.role === 'user' ? `**You:** ${m.text}` : `**AI:** ${m.text}`)).join('\n\n---\n\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }))
    a.download = 'lootcave-ai-chat.md'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  }

  return (
    <>
      <SectionHead title="AI Helper" desc="A genuinely free AI that runs from this static page: no API key, no signup on our side. Code mode writes runnable code with copy buttons. Keep secrets out - free shared services are not private." />
      <div className="grid2">
        <div className="card big">
          <div className="btnRow">
            <button className={mode === 'general' ? '' : 'ghost sm'} onClick={() => setMode('general')}>Chat</button>
            <button className={mode === 'code' ? '' : 'ghost sm'} onClick={() => setMode('code')}>Code mode</button>
            <select value={model} onChange={(e) => setModel(e.target.value)} title="Model">
              <option value="auto">Model: auto</option>
              <option value="gpt-5-nano">gpt-5-nano (fast)</option>
              <option value="custom">Custom model…</option>
            </select>
            {model === 'custom' && <input value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder="e.g. google/gemini-2.5-flash" />}
          </div>
          <div className="chatBox aiBox">
            {msgs.length === 0 && (
              <div>
                <p className="muted">Ask anything, or tap a starter:</p>
                <div className="btnRow">
                  {AI_PRESETS.map((p) => (
                    <button key={p} className="ghost sm" onClick={() => send(p)}>{p}</button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'chatLine me' : 'chatLine'}>
                <b>{m.role === 'user' ? 'You' : 'AI'}</b>
                {renderAi(m.text)}
              </div>
            ))}
            {busy && <p className="muted">Thinking… (free shared models can take a while)</p>}
            <div ref={bottomRef} />
          </div>
          {err && <p className="err">{err}</p>}
          {needLogin && <div className="btnRow"><button onClick={signIn}>Sign in to Puter (free)</button></div>}
          <div className="chatRow">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={mode === 'code' ? 'Describe the code you need…' : 'Ask anything…'} />
            <button onClick={() => send()} disabled={busy}>{busy ? '…' : 'Send'}</button>
          </div>
          <div className="btnRow">
            <button className="ghost sm" onClick={() => { setMsgs([]); localStorage.removeItem('lootcave-ai') }}>Clear chat</button>
            {msgs.length > 0 && <button className="ghost sm" onClick={exportMd}>Export .md</button>}
          </div>
        </div>
        <div className="card">
          <h3>How this is free</h3>
          <ul className="tips">
            <li><b>Puter.js</b> spends the visitor's free Puter allowance - no key, no server, no bill.</li>
            <li><b>First use</b> may ask for a free Puter sign-in. After that it just works.</li>
            <li><b>Code mode</b> forces code-first answers with copy buttons on every block.</li>
            <li><b>Custom model</b> accepts any Puter model id (see developer.puter.com/ai/models).</li>
            <li><b>Privacy:</b> prompts go to Puter's vendors. Never paste passwords or secrets.</li>
          </ul>
        </div>
      </div>
    </>
  )
}

/* ---------- Settings ---------- */
function Settings({ settings, update, reset, customSites, setCustomSites }) {
  const [imp, setImp] = useState('')
  const [impMsg, setImpMsg] = useState('')
  const toggleTab = (id) => {
    const hidden = settings.hiddenTabs || []
    update({ hiddenTabs: hidden.includes(id) ? hidden.filter((t) => t !== id) : [...hidden, id] })
  }
  const doExport = () => {
    const data = JSON.stringify({ app: 'lootcave', settings, customSites, exportedAt: new Date().toISOString() }, null, 2)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    a.download = 'lootcave-backup.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  }
  const doImport = () => {
    try {
      const o = JSON.parse(imp)
      if (o.settings) update(o.settings)
      if (Array.isArray(o.customSites)) setCustomSites(o.customSites)
      setImpMsg('Imported - reloading to apply…')
      setTimeout(() => location.reload(), 700)
    } catch {
      setImpMsg('That is not valid backup JSON.')
    }
  }
  return (
    <>
      <SectionHead title="Settings" desc="Everything here saves automatically to localStorage - no account, no server. Themes apply instantly across the whole site." />
      <div className="grid2">
        <div className="card big">
          <h3 className="cat">Theme - pick your vibe</h3>
          <div className="themeGrid">
            {THEMES.map((t) => {
              const Icon = t.icon
              const p = t.preview
              return (
                <button key={t.id} className={settings.theme === t.id ? 'theme active' : 'theme'} onClick={() => update({ theme: t.id })}>
                  <span className="themePrev" style={{ background: p.bg, borderColor: p.border }}>
                    <span className="tpBar" style={{ background: p.panel }} />
                    <span className="tpRow">
                      <span className="tpSide" style={{ background: p.panel }} />
                      <span className="tpMain">
                        <span className="tpLine" style={{ background: p.head }} />
                        <span className="tpLine short" style={{ background: p.muted }} />
                        <span className="tpBtn" style={{ background: p.accent }} />
                      </span>
                    </span>
                  </span>
                  <b><Icon size={15} className="hicon" />{t.name}</b><span>{t.desc}</span>
                </button>
              )
            })}
          </div>
          <h3 className="cat">Appearance</h3>
          <label className="setRow">Font size - scales all text site-wide.
            <select value={settings.fontScale} onChange={(e) => update({ fontScale: e.target.value })}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
          <label className="setRow">Compact cards - denser grid, less padding.
            <input type="checkbox" checked={settings.compact} onChange={(e) => update({ compact: e.target.checked })} />
          </label>
          <label className="setRow">Custom accent color - overrides every theme's highlight.
            <span className="accentRow">
              <input type="color" value={settings.accent || '#7c5cff'} onChange={(e) => update({ accent: e.target.value })} />
              {settings.accent && <button className="ghost sm" onClick={() => update({ accent: '' })}>theme default</button>}
            </span>
          </label>
          <label className="setRow">Reduce motion - kills animations and transitions.
            <input type="checkbox" checked={settings.reduceMotion} onChange={(e) => update({ reduceMotion: e.target.checked })} />
          </label>
          <label className="setRow">Hide tab descriptions - cleaner header.
            <input type="checkbox" checked={settings.hideBlurbs} onChange={(e) => update({ hideBlurbs: e.target.checked })} />
          </label>
          <label className="setRow">Header clock - live time next to the tagline.
            <input type="checkbox" checked={settings.showClock} onChange={(e) => update({ showClock: e.target.checked })} />
          </label>
          <label className="setRow">UI sounds - tiny blip on copy.
            <input type="checkbox" checked={settings.uiSounds} onChange={(e) => update({ uiSounds: e.target.checked })} />
          </label>
          <label className="setRow">Custom tagline - your words under the logo.
            <input value={settings.customTagline} onChange={(e) => update({ customTagline: e.target.value })} placeholder="leave empty for default" />
          </label>
          <h3 className="cat">Tabs - hide what you never open</h3>
          <div className="checks">
            {TABS.filter((t) => t.id !== 'home').map((t) => (
              <label key={t.id} className="check"><input type="checkbox" checked={!(settings.hiddenTabs || []).includes(t.id)} onChange={() => toggleTab(t.id)} /> {t.label}</label>
            ))}
          </div>
          <h3 className="cat">Behavior</h3>
          <label className="setRow">Default tab - what opens when you reload.
            <select value={settings.defaultTab} onChange={(e) => update({ defaultTab: e.target.value })}>
              {TABS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          <label className="setRow">Inbox auto-refresh (seconds) - how often Temp Email checks for mail.
            <input type="number" min="5" max="120" value={settings.refreshSec} onChange={(e) => update({ refreshSec: Math.min(120, Math.max(5, +e.target.value || 12)) })} />
          </label>
          <label className="setRow">Auto-refresh inbox - Temp Email polls for new mail by itself.
            <input type="checkbox" checked={settings.emailAuto} onChange={(e) => update({ emailAuto: e.target.checked })} />
          </label>
          <h3 className="cat">Mini Tools</h3>
          <label className="setRow">Auto-copy passwords - new password hits clipboard on generate.
            <input type="checkbox" checked={settings.autoCopyPw} onChange={(e) => update({ autoCopyPw: e.target.checked })} />
          </label>
          <h3 className="cat">Community</h3>
          <label className="setRow">Discord invite link - shown on the About page (empty = default invite).
            <input value={settings.discordInvite} onChange={(e) => update({ discordInvite: e.target.value })} placeholder="https://discord.gg/…" />
          </label>
          <h3 className="cat">Backup - take your data with you</h3>
          <p className="muted">Exports settings + your custom sites as one JSON file. Import it on another browser to clone your setup.</p>
          <div className="btnRow">
            <button onClick={doExport}>Download backup</button>
          </div>
          <textarea rows="3" value={imp} onChange={(e) => setImp(e.target.value)} placeholder='Paste a lootcave-backup.json here…' />
          <div className="btnRow">
            <button className="ghost" onClick={doImport}>Import backup</button>
          </div>
          {impMsg && <p className="muted">{impMsg}</p>}
          <div className="btnRow">
            <button className="ghost" onClick={reset}>Reset everything to defaults</button>
          </div>
        </div>
        <div className="card">
          <h2>Where things live</h2>
          <ul className="tips">
            <li><b>Settings</b> → <code>lootbox-settings</code> in localStorage.</li>
            <li><b>Your custom sites</b> → <code>lootbox-custom-sites</code> in localStorage.</li>
            <li><b>Password defaults</b> (length, A-Z, a-z, 0-9, symbols, ambiguous) persist too - set them in Mini Tools.</li>
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
    if (locked) { setMsg('Locked - too many attempts. Wait a bit.'); return }
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
        setMsg('5 wrong tries - locked for 30s.')
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
    setMsg('Credentials updated - use them next login.')
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
      return 'reachable (browser CORS allowlisted to mail.tm only - expected fail here is normal)'
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
        <SectionHead title="Admin area" desc="Everything behind this lock is local: stats, API health, the event log, and data controls. No server, no tracking - it just reads your own browser storage." />
        <div className="card lockWrap">
          <h2>{isSetup ? 'Create your admin login' : 'Admin login'}</h2>
          <p className="muted">{isSetup ? 'First visit - choose the username + password that will guard this page. Only a hash is stored, on this device only.' : 'Username + password required. Small-league security: it stops casual snoopers, not someone reading your files.'}</p>
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
  const firstSeen = localStorage.getItem('lootbox-firstseen') || '-'
  const settings = loadSettings()

  return (
    <>
      <SectionHead title="Admin dashboard" desc="Live view of this site's local state. Everything here lives in your browser - nothing is sent anywhere." />
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
          <p className="muted">Runs real requests from your browser and reports what happens - including expected CORS blocks.</p>
          <div className="btnRow"><button onClick={runHealth} disabled={checking}>{checking ? 'Running…' : 'Run health check'}</button></div>
          {Object.entries(health).map(([k, v]) => (
            <div key={k} className="row healthRow">
              <span>{k}</span>
              <code className={v.status === 'ok' ? 'ok' : v.status === 'fail' ? 'bad' : ''}>{v.status}{v.ms != null ? ` · ${v.ms}ms` : ''}{v.detail ? ` - ${v.detail}` : ''}</code>
            </div>
          ))}
          {Object.keys(health).length === 0 && <p className="muted">Not run yet.</p>}
        </div>
        <div className="card">
          <h3><ClipboardList size={16} className="hicon" /> Event log</h3>
          <p className="muted">Last {events.length} events (network attempts, logins, site adds). Newest first.</p>
          <div className="logBox">
            {events.length === 0 && <p className="muted">Empty - generate an inbox or add a site.</p>}
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
          {customSites.length === 0 && <p className="muted">None yet - add some from Cool Sites.</p>}
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
  const [searchMsg, setSearchMsg] = useState('')
  const [customSites, setCustomSites] = useState(loadCustomSites)
  const [navOpen, setNavOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState([])
  const toggleGroup = (label) => setOpenGroups((o) => o.includes(label) ? o.filter((l) => l !== label) : [...o, label])
  const tabById = (id) => TABS.find((t) => t.id === id)
  const pick = (id) => { setTab(id); setNavOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const SEARCHABLE = ['sites', 'software', 'mods', 'numbers', 'pranks', 'tempfiles']
  const matchers = {
    numbers: (q) => SMS_SITES.some((s) => (s.name + s.desc + s.tags).toLowerCase().includes(q)),
    sites: (q) => [...COOL_SITES, ...customSites].some((s) => (s.name + s.desc + s.cat).toLowerCase().includes(q)),
    mods: (q) => MOD_GAMES.some((g) => g.sites.some((s) => (g.game + s.name + s.desc).toLowerCase().includes(q))),
    software: (q) => SOFTWARE.some((g) => g.apps.some((a) => (g.group + a.name + a.desc).toLowerCase().includes(q))),
    pranks: (q) => PRANKS.some((p) => (p.title + p.desc + p.code).toLowerCase().includes(q)),
    tempfiles: (q) => TEMP_FILES.some((f) => (f.name + f.desc + f.keep).toLowerCase().includes(q)),
  }
  const jumpSearch = () => {
    const q = query.trim().toLowerCase()
    if (!q) return
    const hit = SEARCHABLE.find((t) => !(settings.hiddenTabs || []).includes(t) && matchers[t](q))
    if (hit) {
      setSearchMsg('')
      pick(hit)
    } else {
      setSearchMsg('No matches anywhere - try "free", "vpn", "minecraft" or "ai".')
    }
  }
  useEffect(() => {
    if ((settings.hiddenTabs || []).includes(tab)) setTab('home')
  }, [tab, settings.hiddenTabs])
  useEffect(() => {
    const g = NAV_GROUPS.find((gr) => gr.ids.includes(tab))
    if (g) setOpenGroups((o) => (o.includes(g.label) ? o : [...o, g.label]))
  }, [tab])

  useEffect(() => {
    localStorage.setItem('lootbox-settings', JSON.stringify(settings))
    document.documentElement.dataset.theme = settings.theme
    document.documentElement.dataset.font = settings.fontScale
    document.documentElement.classList.toggle('compact', settings.compact)
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion)
    window.__lootSounds = settings.uiSounds
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
    <div className="app shell">
      <div className={navOpen ? 'scrim show' : 'scrim'} onClick={() => setNavOpen(false)} />
      <aside className={navOpen ? 'sidebar open' : 'sidebar'}>
          <div className="logo"><Gem size={28} className="logoIcon" /> Loot<span>Cave</span></div>
        <p className="tag">{settings.customTagline || 'temp emails · temp numbers · mods · tools'} {settings.showClock && <HeaderClock />}</p>
        <div className="searchRow">
          <input
            className="search"
            placeholder="Search sites, mods, apps… (Enter jumps to results)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchMsg('') }}
            onKeyDown={(e) => e.key === 'Enter' && jumpSearch()}
          />
        </div>
        <nav className="sideNav">
          <button className={tab === 'home' ? 'navItem active' : 'navItem'} onClick={() => pick('home')}>
            <HomeIcon size={15} className="tabIcon" /> Home
          </button>
          {NAV_GROUPS.map((g) => {
            const items = g.ids.map(tabById).filter((t) => t && !(settings.hiddenTabs || []).includes(t.id))
            if (!items.length) return null
            const open = openGroups.includes(g.label)
            return (
              <div key={g.label} className="navGroup">
                <button className="navGroupLabel" onClick={() => toggleGroup(g.label)}>
                  {g.label}
                  <ChevronDown size={14} className={open ? 'chev open' : 'chev'} />
                </button>
                {open && items.map((t) => {
                  const Icon = t.icon
                  return (
                    <button key={t.id} className={tab === t.id ? 'navItem active' : 'navItem'} onClick={() => pick(t.id)} title={TAB_BLURBS[t.id]}>
                      <Icon size={15} className="tabIcon" /> {t.label}
                    </button>
                  )
                })}
              </div>
            )
          })}
          <div className="navGroup">
            <button className="navGroupLabel" onClick={() => toggleGroup('Browse')}>
              Browse
              <ChevronDown size={14} className={openGroups.includes('Browse') ? 'chev open' : 'chev'} />
            </button>
            {openGroups.includes('Browse') && [...CAT_ORDER, 'My Stuff'].map((c) => {
              const n = c === 'My Stuff' ? customSites.length : COOL_SITES.filter((s) => s.cat === c).length
              if (!n) return null
              return (
                <button key={c} className="navItem" title={`Browse ${c} in Cool Sites`} onClick={() => { setTab('sites'); setQuery(c === 'My Stuff' ? '' : c); setNavOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                  <span className="navLabel">{c}</span><span className="countBadge">{n}</span>
                </button>
              )
            })}
          </div>
        </nav>
        {!(settings.hiddenTabs || []).includes('recommend') && (
          <button className={tab === 'recommend' ? 'navItem aboutBtn active' : 'navItem aboutBtn'} onClick={() => pick('recommend')}>
            <Send size={15} className="tabIcon" /> Recommend
          </button>
        )}
        {!(settings.hiddenTabs || []).includes('about') && (
          <button className={tab === 'about' ? 'navItem aboutBtn active' : 'navItem aboutBtn'} onClick={() => pick('about')}>
            <Info size={15} className="tabIcon" /> About
          </button>
        )}
        {!(settings.hiddenTabs || []).includes('settings') && (
          <button className={tab === 'settings' ? 'navItem aboutBtn active' : 'navItem aboutBtn'} onClick={() => pick('settings')}>
            <SettingsIcon size={15} className="tabIcon" /> Settings
          </button>
        )}
        <div className="sideFoot">© 2026 LootCave</div>
      </aside>
      <div className="mainCol">
        <div className="topbar">
          <button className="ghost sm" onClick={() => setNavOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
          <span className="topLogo"><Gem size={17} /> LootCave</span>
          {settings.showClock && <HeaderClock />}
        </div>
        {!settings.hideBlurbs && <p className="tabBlurb">{TAB_BLURBS[tab]}</p>}
        {searchMsg && <p className="err">{searchMsg}</p>}
        {query.trim() && !SEARCHABLE.includes(tab) && (
          <div className="notice">Search covers <b>Numbers, Sites, Mods, Software, Pranks and Temp Files</b> - you are on a tools page with nothing to filter.
            <span className="btnRow" style={{ display: 'inline-flex', marginLeft: 8, marginTop: 0 }}>
              <button className="ghost sm" onClick={jumpSearch}>Show results</button>
              <button className="ghost sm" onClick={() => { setQuery(''); setSearchMsg('') }}>Clear</button>
            </span>
          </div>
        )}
      <main key={tab}>
        {tab === 'home' && <Home go={go} />}
        {tab === 'email' && <TempEmail refreshSec={settings.refreshSec} auto={settings.emailAuto} />}
        {tab === 'numbers' && <TempNumbers query={query} />}
        {tab === 'ids' && <FakeIDs />}
        {tab === 'tempfiles' && <TempFiles query={query} />}
        {tab === 'sites' && <CoolSites query={query} customSites={customSites} onAdd={addSite} onDelete={delSite} />}
        {tab === 'mods' && <Mods query={query} />}
        {tab === 'download' && <Downloader />}
        {tab === 'playlists' && <Playlists />}
        {tab === 'software' && <Software query={query} />}
        {tab === 'recommend' && <Recommend />}
        {tab === 'pranks' && <Pranks query={query} />}
        {tab === 'chat' && <Chat />}
        {tab === 'about' && <About settings={settings} go={go} />}
        {tab === 'system' && <System go={go} />}
        {tab === 'guide' && <Guide settings={settings} />}
        {tab === 'tools' && <Tools settings={settings} update={update} />}
        {tab === 'ai' && <AiHelper />}
        {tab === 'settings' && <Settings settings={settings} update={update} reset={() => setSettings(DEFAULT_SETTINGS)} customSites={customSites} setCustomSites={setCustomSites} />}
        {tab === 'admin' && <Admin customSites={customSites} onDeleteSite={delSite} onWipe={wipe} />}
      </main>
      <footer>© 2026 LootCave - built for fun, use responsibly · static only, no backend</footer>
      </div>
    </div>
  )
}
