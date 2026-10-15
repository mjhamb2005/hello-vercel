import { redirect } from 'next/navigation'
import { sbServer } from '@/lib/sb/server'
import { fontVars } from '@/lib/fonts'
import { getViewer } from '@/lib/viewer'
import type { Meme } from '@/lib/types'
import Battle from './Battle'
import '../../memes.css'

export const dynamic = 'force-dynamic'

export default async function BattlePage() {
  const supabase = await sbServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [imagesRes, votesRes] = await Promise.all([
    supabase
      .from('meme_images')
      .select('id, storage_path, description, meme_captions(id, content)')
      .order('created_at', { ascending: false })
      .limit(60),
    supabase.from('meme_votes').select('caption_id, value').eq('user_id', user.id),
  ])

  const images: any[] = imagesRes.data ?? []
  const paths = images.map((i) => i.storage_path)
  const signed: any[] = paths.length
    ? (await supabase.storage.from('memes').createSignedUrls(paths, 60 * 60 * 6)).data ?? []
    : []
  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]))

  // Only photos with at least two captions can host a battle
  const memes: Meme[] = images
    .map((i) => ({
      id: i.id,
      url: urlByPath.get(i.storage_path) ?? null,
      description: i.description,
      captions: [...(i.meme_captions ?? [])].sort((a: any, b: any) => a.id - b.id),
    }))
    .filter((m) => m.url && m.captions.length >= 2)

  const myVotes: Record<number, number> = Object.fromEntries(
    ((votesRes.data as any[]) ?? []).map((v) => [v.caption_id, v.value])
  )

  return (
    <main className={`c-page ${fontVars}`}>
      <Battle
        memes={memes}
        initialVotes={myVotes}
        user={await getViewer(supabase, user)}
      />
    </main>
  )
}
