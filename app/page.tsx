import { fontVars } from '@/lib/fonts'
import SignInButton from './SignInButton'
import DemoMeme from './DemoMeme'
import './memes.css'

const MESSAGES: Record<string, string> = {
  cancelled: 'Sign-in was cancelled. Try again whenever you’re ready.',
  auth: 'Google sign-in didn’t finish. Try again.',
  not_allowed: 'Caption Club is invite-only right now. Sign in with a school email we accept, or ask an admin to add yours.',
}

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const message = error ? MESSAGES[error] ?? MESSAGES.auth : null

  return (
    <main className={`c-page c-landing ${fontVars}`}>
      <div className="c-landing-copy">
        <p className="c-brand">Caption Club</p>
        <h1>Five captions walk into a photo.</h1>
        <p className="c-lede">
          Upload any photo and AI writes five meme captions for it. Everyone votes, and the funniest one gets the
          spotlight and becomes the meme.
        </p>
        <SignInButton />
        {message && <p className="c-error" role="alert">{message}</p>}
        <ol className="c-how">
          <li><b>1</b>Upload a photo</li>
          <li><b>2</b>AI writes five captions</li>
          <li><b>3</b>Vote, or go head to head in Battle mode</li>
        </ol>
      </div>
      <DemoMeme />
    </main>
  )
}