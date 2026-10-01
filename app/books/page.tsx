export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const COLORS = ['#7B2D26', '#1F4E5F', '#B07D2B', '#3E5641', '#5B3A6B', '#A9503A', '#2C3E66', '#6B5A3B']
const HIDDEN = ['id', 'title', 'name', 'author', 'created_at', 'user_id']

export default async function BooksPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const { data: books, error } = await supabase.from('books').select('*')
  const avatar = user?.user_metadata?.avatar_url
  const first = user?.user_metadata?.full_name?.split(' ')[0]

  return (
    <main className="page">
      <style>{css}</style>
      <header className="top">
        <div>
          <p className="eyebrow">{first ? `Welcome back, ${first}` : 'A personal library'}</p>
          <h1>The Bookshelf</h1>
        </div>
        {user ? (
          <Link href="/profile" className="avatar" title="Your profile">
            {avatar ? <img src={avatar} alt="Profile" /> : <span>{(first ?? 'U')[0]}</span>}
          </Link>
        ) : (
          <Link href="/" className="signin">Sign in</Link>
        )}
      </header>

      {error && <p className="note">Couldn't load books: {error.message}</p>}
      {!error && (books ?? []).length === 0 && <p className="note">No books on the shelf yet.</p>}

      <section className="grid">
        {(books ?? []).map((b: any, i: number) => (
          <article key={b.id ?? i} className="book">
            <div className="cover" style={{ background: COLORS[i % COLORS.length] }}>
              <h2>{b.title ?? b.name ?? 'Untitled'}</h2>
              {b.author && <p className="author">{b.author}</p>}
            </div>
            <div className="meta">
              {Object.entries(b)
                .filter(([k, v]) => !HIDDEN.includes(k) && v !== null && typeof v !== 'object')
                .slice(0, 3)
                .map(([k, v]) => (
                  <span key={k}><b>{k.replace(/_/g, ' ')}</b> {String(v)}</span>
                ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

const css = `
.page { min-height: 100vh; background: #F6F0E4; color: #2A2118; font-family: Georgia, 'Times New Roman', serif; padding: 48px 6vw 80px; }
.top { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #2A2118; padding-bottom: 20px; margin-bottom: 44px; }
.eyebrow { font-family: system-ui, sans-serif; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: #8A6E3B; margin: 0; }
h1 { font-size: clamp(40px, 6vw, 76px); font-weight: 400; letter-spacing: -.02em; margin: 6px 0 0; line-height: 1; }
.avatar img, .avatar span { width: 52px; height: 52px; border-radius: 50%; border: 2px solid #2A2118; display: grid; place-items: center; object-fit: cover; background: #2A2118; color: #F6F0E4; font-size: 20px; transition: transform .2s; }
.avatar:hover img, .avatar:hover span { transform: scale(1.08); }
.signin { font-family: system-ui, sans-serif; font-size: 14px; padding: 10px 18px; border: 2px solid #2A2118; border-radius: 999px; color: #2A2118; text-decoration: none; }
.signin:hover { background: #2A2118; color: #F6F0E4; }
.grid { display: grid; gap: 36px 28px; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
.book { transition: transform .25s ease; }
.book:hover { transform: translateY(-8px) rotate(-1.5deg); }
.cover { aspect-ratio: 2 / 3; border-radius: 3px 10px 10px 3px; padding: 22px 18px; color: #F6F0E4; display: flex; flex-direction: column; justify-content: space-between; box-shadow: inset 10px 0 0 rgba(0,0,0,.2), inset 12px 0 0 rgba(255,255,255,.08), 0 14px 28px rgba(42,33,24,.22); }
.cover h2 { font-size: 21px; font-weight: 400; line-height: 1.15; margin: 0; }
.author { font-style: italic; font-size: 14px; opacity: .85; margin: 0; }
.meta { font-family: system-ui, sans-serif; font-size: 12px; color: #5A4A3A; margin-top: 12px; display: flex; flex-direction: column; gap: 3px; }
.meta b { text-transform: capitalize; margin-right: 4px; }
.note { font-style: italic; color: #8A6E3B; }
`
