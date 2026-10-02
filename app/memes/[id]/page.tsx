import { notFound, redirect } from 'next/navigation'
import { sbServer } from '@/lib/sb/server'
import { fontVars } from '@/lib/fonts'
import Detail from './Detail'
import '../../memes.css'

export const dynamic = 'force-dynamic'

export default async function MemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const memeId = Number(id)
  if (!Number.isInteger(memeId) || memeId <= 0) notFound()

  const supabase = await sbServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: image } = await supabase
    .from('meme_images')
    .select('id, storage_path, description, meme_captions(id, content)')
    .eq('id', memeId)
    .maybeSingle()
  if (!image) notFound()

  const captions = [...((image as any).meme_captions ?? [])].sort((a: any, b: any) => a.id - b.id)
  const ids = captions.map((c: any) => c.id)

  const [scoresRes, mineRes, signedRes] = await Promise.all([
    supabase.rpc('meme_caption_scores'),
    ids.length ? supabase.from('meme_votes').select('caption_id, value').in('caption_id', ids) : Promise.resolve({ data: [] as any[] }),
    supabase.storage.from('memes').createSignedUrl(image.storage_path, 60 * 60 * 6),
  ])

  const scores: Record<number, number> = Object.fromEntries(
    ((scoresRes.data as any[]) ?? []).filter((s) => ids.includes(s.caption_id)).map((s) => [s.caption_id, Number(s.score)])
  )
  const myVotes: Record<number, number> = Object.fromEntries(
    ((mineRes.data as any[]) ?? []).map((v) => [v.caption_id, v.value])
  )

  const meta = user.user_metadata ?? {}
  return (
    <main className={`c-page ${fontVars}`}>
      <Detail
        meme={{ id: image.id, url: signedRes.data?.signedUrl ?? null, description: image.description, captions }}
        initialScores={scores}
        initialVotes={myVotes}
        user={{ id: user.id, name: meta.full_name ?? meta.name ?? '', avatar: meta.avatar_url ?? meta.picture ?? null }}
      />
    </main>
  )
}