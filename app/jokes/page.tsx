export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { Bricolage_Grotesque } from 'next/font/google'

const brico = Bricolage_Grotesque({ subsets: ['latin'] })

export default async function JokesPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const { data: jokes, error } = await supabase.from('jokes').select('*').order('id')
  const list = jokes ?? []
  const avatar = user?.user_metadata?.avatar_url
  const first = user?.user_metadata?.full_name?.split(' ')[0]

  return (
    <main className={`page ${brico.className}`}>
      <style>{css}</style>

      <header className="top">
        <div>
          <h1>{first ? `${first}'s set` : `Tonight's set`}</h1>
          <p className="sub">Tap a card to hear the punchline.</p>
        </div>
        {user ? (
          <Link href="/profile" className="avatar" aria-label="Open your profile">
            {avatar ? <img src={avatar} alt="" /> : <span>{(first ?? '?')[0]}</span>}
          </Link>
        ) : (
          <Link href="/" className="signin">Sign in</Link>
        )}
      </header>

      {error && <p className="note">Couldn't load jokes from Supabase: {error.message}</p>}
      {!error && list.length === 0 && (
        <p className="note">No jokes yet. Add a row to the jokes table in Supabase and it will show up here.</p>
      )}

      <section className="set">
        {list.map((j: any, i: number) => (
          <details key={j.id ?? i} className="joke">
            <summary>
              <span className="num">{i + 1}</span>
              <span className="setup">{j.setup}</span>
            </summary>
            <p className="punch">{j.punchline}</p>
          </details>
        ))}
      </section>
    </main>
  )
}

const css = `
.page { min-height: 100vh; background: #2338C9; color: #FFF4C2; padding: 56px clamp(20px, 6vw, 88px) 96px; }
.top, .note, .set { max-width: 1100px; margin-left: auto; margin-right: auto; }
.top { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 56px; }
h1 { font-size: clamp(56px, 10vw, 128px); font-weight: 800; line-height: .85; letter-spacing: -.04em; margin: 0; }
.sub { margin: 18px 0 0; font-size: 18px; color: #C9D0FF; }
.avatar { display: block; border-radius: 50%; }
.avatar:focus-visible { outline: 3px solid #FFF4C2; outline-offset: 4px; }
.avatar img, .avatar span { width: 56px; height: 56px; border-radius: 50%; border: 3px solid #FF6FA5; object-fit: cover; display: grid; place-items: center; background: #121A4A; color: #FFF4C2; font-size: 22px; font-weight: 700; }
.signin { background: #FFF4C2; color: #121A4A; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 16px; }
.signin:hover { background: #FF6FA5; }
.note { color: #C9D0FF; font-size: 17px; line-height: 1.5; margin-bottom: 32px; }
.set { columns: 300px; column-gap: 32px; }
.joke { break-inside: avoid; margin-bottom: 32px; padding: 18px 24px 24px; border-radius: 4px; color: #121A4A;
  background: linear-gradient(to bottom, transparent 0 46px, #FF6FA5 46px 48px, transparent 48px), #FFF4C2;
  box-shadow: 6px 6px 0 #121A4A; transform: rotate(-1deg); transition: transform .2s; }
.joke:nth-child(2n) { transform: rotate(.8deg); }
.joke:nth-child(3n) { transform: rotate(-.4deg); }
.joke:hover { transform: rotate(0) translateY(-3px); }
summary { list-style: none; cursor: pointer; display: block; border-radius: 2px; }
summary::-webkit-details-marker { display: none; }
summary:focus-visible { outline: 3px solid #2338C9; outline-offset: 6px; }
.num { display: block; height: 26px; font-size: 14px; font-weight: 700; color: #2338C9; }
.setup { display: block; margin-top: 22px; font-size: 22px; font-weight: 600; line-height: 1.3; letter-spacing: -.01em; }
.joke:not([open]) summary::after { content: 'Reveal punchline'; display: inline-block; margin-top: 18px; font-size: 13px; font-weight: 700; color: #2338C9; border-bottom: 2px solid #2338C9; }
.punch { margin: 18px 0 0; padding: 12px 14px; border-radius: 3px; background: #FF6FA5; font-size: 21px; font-weight: 800; line-height: 1.25; animation: pop .35s cubic-bezier(.2, 1.4, .4, 1); }
@keyframes pop { from { opacity: 0; transform: scale(.9) rotate(-2deg); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .joke { transition: none; } .punch { animation: none; } }
`
