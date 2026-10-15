'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@/lib/types'
import { useGeneration } from './Generation'

export default function TopBar({ user }: { user: User }) {
  const { openMaker, running } = useGeneration()
  const pathname = usePathname()
  const initial = (user.name || '?').trim()[0]?.toUpperCase() ?? '?'
  const tab = (href: string, label: string, isNew = false) => (
    <Link href={href} className={`c-tab${pathname === href ? ' is-active' : ''}`} aria-current={pathname === href ? 'page' : undefined}>
      {label}
      {isNew && <span className="c-tab-new">New</span>}
    </Link>
  )
  const brand = <Link href="/memes" className="c-brand">Caption Club</Link>
  return (
    <header className="c-top">
      <div className="c-top-left">
        {brand}
        <nav className="c-tabs" aria-label="Sections">
          {tab('/memes', 'Feed')}
          {tab('/memes/battle', 'Battle', true)}
          {tab('/memes/top', 'Top captions')}
        </nav>
      </div>
      <nav className="c-nav" aria-label="Account">
        <span className="c-brand-slot">{brand}</span>
        <button className="c-btn c-btn-primary" onClick={openMaker}>
          Make a meme
          {running > 0 && <span className="c-running" aria-label={`${running} in progress`}>{running}</span>}
        </button>
        {user.isAdmin && (
          <Link href="/admin/errors" className={`c-btn c-btn-quiet c-admin-link${pathname === '/admin/errors' ? ' is-active' : ''}`}>Error log</Link>
        )}
        <Link href="/profile" className="c-avatar" aria-label="Your profile">
          {user.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : <span>{initial}</span>}
        </Link>
        <form action="/auth/signout" method="post">
          <button className="c-btn c-btn-quiet" type="submit">Sign out</button>
        </form>
      </nav>
    </header>
  )
}
