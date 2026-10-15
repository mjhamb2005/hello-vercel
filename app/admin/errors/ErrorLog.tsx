'use client'
import { useEffect, useMemo, useState } from 'react'
import { sbBrowser } from '@/lib/sb/browser'
import type { User } from '@/lib/types'
import TopBar from '@/app/memes/ui/TopBar'

export type ErrorRow = {
  id: number
  created_at: string
  user_id: string | null
  user_email: string | null
  page: string | null
  action: string
  message: string
  details: Record<string, any> | null
  user_agent: string | null
  resolved: boolean
}

// Plain-English names for what the person was doing
const ACTIONS: Record<string, string> = {
  upload: 'Uploading a photo',
  describe: 'AI describing a photo',
  captions: 'AI writing captions',
  vote: 'Voting',
  battle_pick: 'Battle pick',
  delete: 'Deleting a meme',
  download: 'Downloading a meme',
  sign_in: 'Signing in',
  profile: 'Saving profile',
  crash: 'Page crashed',
  load: 'Loading a page',
}
const label = (a: string) => ACTIONS[a] ?? a

function ago(iso: string, now: number) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`
  const d = Math.floor(s / 86400)
  return d === 1 ? 'yesterday' : `${d} days ago`
}

function browserOf(ua: string | null) {
  if (!ua) return 'Unknown browser'
  const device = /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Other'
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  return `${browser} on ${device}`
}

export default function ErrorLog({ rows: initialRows, loadError, user }: { rows: ErrorRow[]; loadError: string | null; user: User }) {
  const [rows, setRows] = useState(initialRows)
  const [status, setStatus] = useState<'open' | 'fixed' | 'all'>('open')
  const [action, setAction] = useState<string>('all')
  const [who, setWho] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)
  const [saving, setSaving] = useState<number | null>(null)
  // Times are shown in the viewer's own time zone, so they're worked out in the browser only
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const person = (r: ErrorRow) => r.user_email ?? (r.user_id ? 'Unknown user' : 'Signed-out visitor')

  // Summary is about open problems from the last 7 days
  const weekAgo = (now ?? 0) - 7 * 86400_000
  const recentOpen = rows.filter((r) => !r.resolved && new Date(r.created_at).getTime() > weekAgo)
  const peopleHit = new Set(recentOpen.map(person)).size
  const byAction = recentOpen.reduce<Record<string, number>>((m, r) => ((m[r.action] = (m[r.action] ?? 0) + 1), m), {})
  const worst = Object.entries(byAction).sort((a, b) => b[1] - a[1])[0]

  const statusRows = rows.filter((r) => (status === 'all' ? true : status === 'open' ? !r.resolved : r.resolved))
  const actionCounts = statusRows.reduce<Record<string, number>>((m, r) => ((m[r.action] = (m[r.action] ?? 0) + 1), m), {})
  const people = useMemo(() => [...new Set(rows.map(person))].sort(), [rows])

  const q = query.trim().toLowerCase()
  const shown = statusRows.filter(
    (r) =>
      (action === 'all' || r.action === action) &&
      (who === 'all' || person(r) === who) &&
      (!q || `${r.message} ${r.page} ${person(r)} ${JSON.stringify(r.details ?? {})}`.toLowerCase().includes(q))
  )

  async function setResolved(r: ErrorRow, resolved: boolean) {
    setSaving(r.id)
    const { error } = await sbBrowser().from('app_errors').update({ resolved }).eq('id', r.id)
    setSaving(null)
    if (!error) setRows((list) => list.map((x) => (x.id === r.id ? { ...x, resolved } : x)))
  }

  return (
    <>
      <TopBar user={user} />
      <div className="c-log">
        <div className="c-log-head">
          <div>
            <h1>Error log</h1>
            <p>Every error people hit in Caption Club, newest first. Only admins can see this page.</p>
          </div>
        </div>

        {loadError && (
          <p className="c-alert" role="alert">
            The log couldn’t load ({loadError}). If you haven’t yet, run supabase/error-log.sql in the Supabase SQL Editor.
          </p>
        )}

        <div className="c-log-stats">
          <div><b>{recentOpen.length}</b><span>open errors this week</span></div>
          <div><b>{peopleHit}</b><span>{peopleHit === 1 ? 'person affected' : 'people affected'}</span></div>
          <div><b className="c-log-worst">{worst ? label(worst[0]) : 'Nothing yet'}</b><span>{worst ? `most common problem, ${worst[1]}×` : 'most common problem'}</span></div>
        </div>

        <div className="c-log-filters">
          <div className="c-filter" role="tablist" aria-label="Status">
            {(['open', 'fixed', 'all'] as const).map((s) => (
              <button key={s} role="tab" aria-selected={status === s} className={status === s ? 'is-on' : ''} onClick={() => setStatus(s)}>
                {s === 'open' ? 'Open' : s === 'fixed' ? 'Fixed' : 'All'}
                <span>{rows.filter((r) => (s === 'all' ? true : s === 'open' ? !r.resolved : r.resolved)).length}</span>
              </button>
            ))}
          </div>
          <label className="c-select">
            <span>Person</span>
            <select value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="all">Everyone</option>
              {people.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <input className="c-search" type="search" placeholder="Search messages" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search errors" />
        </div>

        <div className="c-chips" aria-label="What they were doing">
          <button className={action === 'all' ? 'is-on' : ''} onClick={() => setAction('all')}>All types <span>{statusRows.length}</span></button>
          {Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).map(([a, n]) => (
            <button key={a} className={action === a ? 'is-on' : ''} onClick={() => setAction(a)}>{label(a)} <span>{n}</span></button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="c-empty">
            <h2>{rows.length === 0 ? 'No errors yet' : 'Nothing matches'}</h2>
            <p>{rows.length === 0 ? 'When someone runs into a problem, it shows up here with who, where and what they were doing.' : 'Try a different filter or clear the search.'}</p>
          </div>
        ) : (
          <ol className="c-log-list">
            {shown.map((r) => {
              const open = openId === r.id
              return (
                <li key={r.id} className={`c-log-row${r.resolved ? ' is-fixed' : ''}${open ? ' is-open' : ''}`}>
                  <button className="c-log-main" onClick={() => setOpenId(open ? null : r.id)} aria-expanded={open}>
                    <span className={`c-log-tag t-${r.action}`}>{label(r.action)}</span>
                    <span className="c-log-msg">{r.message}</span>
                    <span className="c-log-meta">
                      <span>{person(r)}</span>
                      <span>{r.page ?? 'unknown page'}</span>
                      <time dateTime={r.created_at} title={now ? new Date(r.created_at).toLocaleString() : undefined}>{now ? ago(r.created_at, now) : ''}</time>
                    </span>
                  </button>
                  {open && (
                    <div className="c-log-detail">
                      <dl>
                        <dt>When</dt><dd>{new Date(r.created_at).toLocaleString()}</dd>
                        <dt>Who</dt><dd>{person(r)}</dd>
                        <dt>Page</dt><dd>{r.page ?? 'unknown'}</dd>
                        <dt>Device</dt><dd>{browserOf(r.user_agent)}</dd>
                        {r.details?.detail && (<><dt>Technical reason</dt><dd>{String(r.details.detail)}</dd></>)}
                      </dl>
                      {r.details && Object.keys(r.details).length > 0 && (
                        <details className="c-log-raw">
                          <summary>All details</summary>
                          <pre>{JSON.stringify(r.details, null, 2)}</pre>
                        </details>
                      )}
                      <button className={`c-btn c-btn-sm ${r.resolved ? 'c-btn-outline' : 'c-btn-primary'}`} disabled={saving === r.id} onClick={() => setResolved(r, !r.resolved)}>
                        {saving === r.id ? 'Saving…' : r.resolved ? 'Reopen' : 'Mark fixed'}
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </>
  )
}
