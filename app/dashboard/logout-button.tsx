'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

export default function LogoutButton() {
  const router = useRouter()

  async function logOut() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button onClick={logOut} className="hv-button hv-button-secondary">
      Log out
    </button>
  )
}