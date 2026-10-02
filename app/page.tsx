import { fontVars } from '@/lib/fonts'
import SignInButton from './SignInButton'
import DemoMeme from './DemoMeme'
import './memes.css'

const MESSAGES: Record<string, string> = {
  cancelled: 'Sign-in was cancelled. Try again whenever you’re ready.',
  auth: 'Google sign-in didn’t finish. Try again.',
}

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const message = error ? MESSAGES[error] ?? MESSAGES.auth : null

  return (
    <main className={`c-page c-landing ${fontVars}`}>
      <div className="c-landing-copy">
        <p className="c-brand">Caption Club</p>
        <h1>Five AI captions. One winner. You decide.</h1>
        <p className="c-lede">
          Upload any photo. AI looks at it and writes five meme captions. Everyone votes, and the funniest caption
          becomes the meme.
        </p>
        <SignInButton />
        {message && <p className="c-error" role="alert">{message}</p>}
        <ol className="c-how">
          <li><b>1</b>Upload a photo</li>
          <li><b>2</b>AI writes five captions</li>
          <li><b>3</b>Everyone votes on the funniest</li>
        </ol>
      </div>
      <DemoMeme />
    </main>
  )
}