import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { firstName } from '@/utils/data'
import { JoinGroupForm } from '../group-forms'

export const metadata = { title: 'Join a study group' }

// Invite links land here: /groups/join?code=3F9A1C2B
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code = '' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/groups/join?code=${code}`)}`)
  return (
    <div className="page max-w-[520px]">
      <header className="mb-6">
        <h1 className="page-title">You&apos;re <span className="hl">invited</span></h1>
        <p className="page-sub">Pick the name your group will see, then hop in.</p>
      </header>
      <JoinGroupForm defaultName={firstName(user)} code={code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)} />
    </div>
  )
}
