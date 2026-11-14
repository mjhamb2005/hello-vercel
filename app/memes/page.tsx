import { redirect } from 'next/navigation'
import { sbServer } from '@/lib/sb/server'
import { fontVars } from '@/lib/fonts'
import { getViewer } from '@/lib/viewer'
import type { Meme } from '@/lib/types'
import Feed from './Feed'
import '../memes.css'

export const dynamic = 'force-dynamic'

export default async function MemesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const supabase = await sbServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [imagesRes, scoresRes, myVotesRes] = await Promise.all([
    supabase
      .from('meme_images')
      .select('id, user_id, storage_path, description, created_at, meme_captions(id, content)')
      .order('created_at', { ascending: false })
      .limit(60),
    supabase.rpc('meme_caption_scores'),
    supabase.from('meme_votes').select('caption_id').eq('user_id', user.id),
  ])

  const images: any[] = imagesRes.data ?? []
  const paths = images.map((i) => i.storage_path)
  const signed: any[] = paths.length
    ? (await supabase.storage.from('memes').createSignedUrls(paths, 60 * 60 * 6)).data ?? []
    : []
  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]))

  const scores: Record<number, number> = Object.fromEntries(
    ((scoresRes.data as any[]) ?? []).map((s) => [s.caption_id, Number(s.score)])
  )

  // Which memes you've already voted on, so the feed can point you at the ones you haven't
  const myCaptions = new Set(((myVotesRes.data as any[]) ?? []).map((v) => v.caption_id))
  const votedOn = images.filter((i) => (i.meme_captions ?? []).some((c: any) => myCaptions.has(c.id))).map((i) => i.id)

  const memes: Meme[] = images.map((i) => ({
    id: i.id,
    url: urlByPath.get(i.storage_path) ?? null,
    description: i.description,
    ownerId: i.user_id,
    captions: [...(i.meme_captions ?? [])].sort((a: any, b: any) => a.id - b.id),
  }))

  return (
    <main className={`c-page ${fontVars}`}>
      <Feed
        initialMemes={memes}
        scores={scores}
        user={await getViewer(supabase, user)}
        loadError={imagesRes.error?.message ?? null}
        votedOn={votedOn}
        initialView={view === 'mine' || view === 'new' ? view : 'all'}
      />
    </main>
  )
}