import { fontVars } from '@/lib/fonts'
import SignInButton from './SignInButton'
import DemoMeme from './DemoMeme'
import './memes.css'

const MESSAGES: Record<string, string> = {
  cancelled: 'Sign-in was cancelled. Try again whenever you’re ready.',
  auth: 'Google sign-in didn’t finish. Try again.',
  not_allowed: 'Caption Club is invite-only right now. Sign in with a school email we accept, or ask an admin to add yours.',
}

const STEPS = [
  {
    title: 'Bring a photo',
    text: 'Your team on the dock, your roommate mid-sneeze, your dog judging you. Anything works.',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="6" y="10" width="36" height="28" rx="5" />
        <circle cx="18" cy="21" r="4" />
        <path d="M6 33l11-9 8 7 6-5 11 9" />
      </svg>
    ),
  },
  {
    title: 'AI writes five captions',
    text: 'First it describes what’s in the photo, then it riffs on that. Five takes, ready in seconds.',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 12h22M8 20h32M8 28h26M8 36h16" />
        <path d="M38 30l2.2 4.8L45 37l-4.8 2.2L38 44l-2.2-4.8L31 37l4.8-2.2z" className="fill" />
      </svg>
    ),
  },
  {
    title: 'The crowd picks the headliner',
    text: 'Everyone votes. The funniest caption takes the spotlight and becomes the meme.',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 6l14 18H10z" className="fill" />
        <path d="M14 30h20M17 37h14M21 44h6" />
      </svg>
    ),
  },
]

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const message = error ? MESSAGES[error] ?? MESSAGES.auth : null

  return (
    <main className={`c-page c-home ${fontVars}`}>
      <section className="c-landing" aria-labelledby="home-title">
        <div className="c-landing-copy">
          <p className="c-brand">Caption Club</p>
          <p className="c-kicker c-home-kicker">Now playing: open mic for memes</p>
          <h1 id="home-title">Five captions walk into a photo.</h1>
          <p className="c-lede">
            Upload any photo and AI writes five meme captions for it. Everyone votes, and the funniest one gets the
            spotlight.
          </p>
          <div className="c-home-cta">
            <SignInButton />
            <a href="#how" className="c-btn c-btn-quiet c-btn-lg">How it works <span aria-hidden="true">↓</span></a>
          </div>
          {message && <p className="c-error" role="alert">{message}</p>}
          <p className="c-fine">Free. Signs in with your Google account, nothing else to set up.</p>
        </div>
        <DemoMeme />
      </section>

      <section id="how" className="c-home-section" aria-labelledby="how-title">
        <p className="c-eyebrow">How the show works</p>
        <h2 id="how-title">From camera roll to headliner in three acts.</h2>
        <ol className="c-acts">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="c-act-num">Act {i + 1}</span>
              <span className="c-act-icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="c-home-section" aria-labelledby="play-title">
        <p className="c-eyebrow">Two more ways to play</p>
        <h2 id="play-title">Short on time? Pick a side.</h2>
        <div className="c-modes">
          <article className="c-mode">
            <div className="c-mode-art c-mode-battle" aria-hidden="true">
              <span className="c-mode-pick is-win">My last brain cell during finals</span>
              <b>VS</b>
              <span className="c-mode-pick">When the group chat goes quiet</span>
            </div>
            <h3>Battle mode</h3>
            <p>Two captions, one photo. Tap the funnier one and it gets your vote. It’s a quick game between classes.</p>
          </article>
          <article className="c-mode">
            <div className="c-mode-art c-mode-podium" aria-hidden="true">
              <span className="p2"><i>2</i></span>
              <span className="p1"><i>1</i></span>
              <span className="p3"><i>3</i></span>
            </div>
            <h3>Top captions</h3>
            <p>The funniest captions across every photo, ranked by votes. See whose joke is winning tonight.</p>
          </article>
        </div>
      </section>

      <section className="c-home-final c-lit" aria-labelledby="final-title">
        <h2 id="final-title">Your photo’s next on stage.</h2>
        <p>Sign in, upload one picture, and see which caption the crowd crowns.</p>
        <SignInButton />
      </section>

      <footer className="c-home-foot">
        <span className="c-brand">Caption Club</span>
        <span>Captions written by AI. Headliners picked by people.</span>
      </footer>
    </main>
  )
}
