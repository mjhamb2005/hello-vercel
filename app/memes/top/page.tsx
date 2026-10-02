import { redirect } from 'next/navigation'
import { sbServer } from '@/lib/sb/server'
import { fontVars } from '@/lib/fonts'
import TopList, { type Row } from './TopList'
import '../../memes.css'

export const dynamic = 'force-dynamic'

export default async function TopPage() {
  const supabase = await sbServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // The 10 highest-scoring captions across every meme
  const { data: scores } = await supabase.rpc('meme_caption_scores')
  const top = ((scores as any[]) ?? [])
    .map((s) => ({ id: Number(s.caption_id), score: Number(s.score), ups: Number(s.ups) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.ups - a.ups)
    .slice(0, 10)

  const { data: caps } = top.length
    ? await supabase
        .from('meme_captions')
        .select('id, content, image_id, meme_images(storage_path, description)')
        .in('id', top.map((t) => t.id))
    : { data: [] as any[] }

  const capById = new Map(((caps as any[]) ?? []).map((c) => [c.id, c]))
  const paths = [...new Set(((caps as any[]) ?? []).map((c) => c.meme_images?.storage_path).filter(Boolean))]
  const signed: any[] = paths.length
    ? (await supabase.storage.from('memes').createSignedUrls(paths, 60 * 60 * 6)).data ?? []
    : []
  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]))

  const rows: Row[] = top
    .map((t) => {
      const c = capById.get(t.id)
      if (!c) return null
      return {
        captionId: t.id,
        memeId: c.image_id,
        caption: c.content,
        score: t.score,
        url: urlByPath.get(c.meme_images?.storage_path) ?? null,
        description: c.meme_images?.description ?? '',
      }
    })
    .filter(Boolean) as Row[]

  const meta = user.user_metadata ?? {}
  return (
    <main className={`c-page ${fontVars}`}>
      <TopList
        rows={rows}
        user={{ id: user.id, name: meta.full_name ?? meta.name ?? '', avatar: meta.avatar_url ?? meta.picture ?? null }}
      />
    </main>
  )
}