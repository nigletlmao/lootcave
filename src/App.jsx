import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Binary, CaseSensitive, ClipboardList, Clock, Copy, Dices, Download, ExternalLink,
  Fingerprint, FileJson, Gamepad2, Gem, Globe, HardDrive, Hash, IdCard, Images, KeyRound,
  Laptop, Laugh, Link2, Lock, Mail, MousePointerClick, Music, Palette, Pencil, Plus, QrCode,
  RefreshCw, RotateCcw, Ruler, Scale, ScanSearch, Send, Settings as SettingsIcon, ShieldCheck, Smartphone,
  Star, Target, TextQuote, Timer, TriangleAlert, Tv, Wifi, Wrench,
} from 'lucide-react'
import './App.css'

import { TABS, TAB_BLURBS, THEMES } from './data/ui.js'

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

import { SMS_SITES, EMAIL_PROVIDERS, COOL_SITES, CAT_DESC, RECOMMENDED } from './data/directory.js'

function SectionHead({ title, desc }) {
  return (
    <div className="sectionHead">
      <h2>{title}</h2>
      <p>{desc}</p>
    </div>
  )
}


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
      <SectionHead title="What lives here" desc="Twelve sections, each with its own job. Hover nothing — just click and go." />
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
        <div className="card"><h3><Send size={16} className="hicon" /> Recommend</h3><p>Found something cool? Send the link + description — it lands in the owner inbox for review.</p><button className="ghost" onClick={() => go('recommend')}>Open →</button></div>
        <div className="card"><h3><Laugh size={16} className="hicon" /> Pranks</h3><p>Harmless CMD troll kit: matrix rain, fake terminals, shutdown scare with antidote.</p><button className="ghost" onClick={() => go('pranks')}>Open →</button></div>
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
                <h3>{s.name} {s.custom ? <Pencil size={13} className="hicon" /> : <ExternalLink size={13} className="hicon" />} {RECOMMENDED.has(s.name) && <span className="recBadge" title="Recommended"><Star size={11} /></span>}</h3>
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

/* ---------- Image downloader: single image or whole-page scan ----------
   Hotlink protection / CORS blocks some hosts — the tool retries each
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
      setInfo(abs.length ? `${abs.length} image${abs.length === 1 ? '' : 's'} found — click any thumbnail to save it.` : 'No images found on that page.')
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
      <p className="muted">Save one image by URL — or scan a whole page and pick from every image on it. Some hosts block hotlinking; the tool retries via proxies automatically.</p>
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
          <ImageTool />
      </div>
    </>
  )
}

/* ---------- Mods hub ---------- */
import { MOD_GAMES, DL_TOOLS, SOFTWARE, PRANKS } from './data/hubs.js'

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
      setMsg('Site URL + description are required — otherwise it is a mystery link.')
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
            <li><b>Reviewed by a human.</b> Nothing auto-publishes — good picks get added manually.</li>
            <li><b>What gets in:</b> free, useful, legal. Same bar as the rest of the directory.</li>
            <li><b>What doesn't:</b> pirate streams, "free Robux" scams, referral spam.</li>
            <li><b>First-time note:</b> the delivery service asks the owner to confirm once before the first email arrives.</li>
          </ul>
        </div>
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
      <SectionHead title="Harmless prank kit" desc="Copy-paste troll commands for CMD: fake matrix rain, hacker terminals, a shutdown scare with antidote. Everything here is reversible and touches zero files." />
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
        {tab === 'recommend' && <Recommend />}
        {tab === 'pranks' && <Pranks query={query} />}
        {tab === 'tools' && <Tools settings={settings} update={update} />}
        {tab === 'settings' && <Settings settings={settings} update={update} reset={() => setSettings(DEFAULT_SETTINGS)} />}
        {tab === 'admin' && <Admin customSites={customSites} onDeleteSite={delSite} onWipe={wipe} />}
      </main>
      <footer>© 2026 LootCave — built for fun, use responsibly · static only, no backend</footer>
    </div>
  )
}
