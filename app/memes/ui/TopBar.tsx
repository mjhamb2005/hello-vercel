'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@/lib/types'
import { useGeneration } from './Generation'

const TABS: [string, string][] = [
  ['/memes', 'Feed'],
  ['/memes/battle', 'Battle'],
  ['/memes/top', 'Top captions'],
]

export default function TopBar({ user }: { user: User }) {
  const { openMaker, running } = useGeneration()
  const pathname = usePathname()
  const initial = (user.name || '?').trim()[0]?.toUpperCase() ?? '?'
  // A meme page belongs to the Feed tab, so you always know where you are
  const activeTab = TABS.find(([href]) => href !== '/memes' && pathname?.startsWith(href))?.[0] ?? (pathname?.startsWith('/memes') ? '/memes' : null)
  const brand = <Link href="/memes" className="c-brand">Caption Club</Link>

  return (
    <header className="c-top">
      <div className="c-top-left">
        {brand}
        <nav className="c-tabs" aria-label="Sections">
          {TABS.map(([href, label]) => (
            <Link key={href} href={href} className={`c-tab${activeTab === href ? ' is-active' : ''}`} aria-current={activeTab === href ? 'page' : undefined}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="c-nav">
        <span className="c-brand-slot">{brand}</span>
        <button className="c-btn c-btn-primary" onClick={openMaker}>
          <span aria-hidden="true" className="c-plus">+</span>
          <span className="c-make-label">Make a meme</span>
          {running > 0 && <span className="c-running" aria-label={`${running} in progress`}>{running}</span>}
        </button>
        <AccountMenu user={user} initial={initial} />
      </div>
    </header>
  )
}

// Everything about "you" lives behind your photo: profile, your memes, admin tools, sign out.
// Works the same on phones, where there's no room for separate buttons.
function AccountMenu({ user, initial }: { user: User; initial: string }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); button.current?.focus() } }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const avatar = user.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : <span>{initial}</span>

  return (
    <div className="c-account" ref={wrap}>
      <button
        ref={button}
        className={`c-avatar${open ? ' is-open' : ''}`}
        aria-label="Your account"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        {avatar}
      </button>
      {open && (
        <div className="c-menu" role="menu" aria-label="Your account">
          <div className="c-menu-who">
            <span className="c-avatar c-menu-avatar">{avatar}</span>
            <span>
              <b>{user.name || 'Your account'}</b>
              <small>Signed in with Google</small>
            </span>
          </div>
          <Link role="menuitem" href="/memes?view=mine" className="c-menu-item" onClick={() => setOpen(false)}>Your memes</Link>
          <Link role="menuitem" href="/profile" className="c-menu-item" onClick={() => setOpen(false)}>Profile and stats</Link>
          {user.isAdmin && <Link role="menuitem" href="/admin/errors" className="c-menu-item" onClick={() => setOpen(false)}>Error log <em>Admin</em></Link>}
          <form action="/auth/signout" method="post">
            <button role="menuitem" type="submit" className="c-menu-item c-menu-signout">Sign out</button>
          </form>
        </div>
      )}
    </div>
  )
}
