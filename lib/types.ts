export type Caption = { id: number; content: string }
export type Meme = { id: number; url: string | null; description: string; captions: Caption[]; fresh?: boolean }
export type User = { id: string; name: string; avatar: string | null }

// Leading caption = highest score; ties go to the earliest caption
export function leaderOf(captions: Caption[], scores: Record<number, number>) {
  let best: Caption | null = null
  for (const c of captions) {
    if (!best || (scores[c.id] ?? 0) > (scores[best.id] ?? 0)) best = c
  }
  return best
}