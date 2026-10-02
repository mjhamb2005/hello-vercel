import { redirect } from 'next/navigation'
import { sbServer } from '@/lib/sb/server'
import { fontVars } from '@/lib/fonts'
import type { Meme } from '@/lib/types'
import Feed from './Feed'
import '../memes.css'

export const dynamic = 'force-dynamic'

export default async function MemesPage() {
  const supabase = await sbServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [imagesRes, scoresRes] = await Promise.all([
    supabase
      .from('meme_images')
      .select('id, storage_path, description, created_at, meme_captions(id, content)')
      .order('created_at', { ascending: false })
      .limit(60),
    supabase.rpc('meme_caption_scores'),
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

  const memes: Meme[] = images.map((i) => ({
    id: i.id,
    url: urlByPath.get(i.storage_path) ?? null,
    description: i.description,
    captions: [...(i.meme_captions ?? [])].sort((a: any, b: any) => a.id - b.id),
  }))

  const meta = user.user_metadata ?? {}
  return (
    <main className={`c-page ${fontVars}`}>
      <Feed
        initialMemes={memes}
        scores={scores}
        user={{ id: user.id, name: meta.full_name ?? meta.name ?? '', avatar: meta.avatar_url ?? meta.picture ?? null }}
        loadError={imagesRes.error?.message ?? null}
      />
    </main>
  )
}