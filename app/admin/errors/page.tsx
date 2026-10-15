import { notFound, redirect } from 'next/navigation'
import { sbServer } from '@/lib/sb/server'
import { fontVars } from '@/lib/fonts'
import { getViewer } from '@/lib/viewer'
import ErrorLog, { type ErrorRow } from './ErrorLog'
import '../../memes.css'

export const dynamic = 'force-dynamic'

export default async function ErrorsPage() {
  const supabase = await sbServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const viewer = await getViewer(supabase, user)
  if (!viewer.isAdmin) notFound() // the page doesn't exist for anyone else

  const { data, error } = await supabase
    .from('app_errors')
    .select('id, created_at, user_id, user_email, page, action, message, details, user_agent, resolved')
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <main className={`c-page ${fontVars}`}>
      <ErrorLog rows={(data as ErrorRow[]) ?? []} loadError={error?.message ?? null} user={viewer} />
    </main>
  )
}
