import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { GpaProfile } from '@/types/db'
import Calculator from './calculator'

export const metadata = { title: 'CGPA' }

export default async function GpaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/gpa')

  // Missing table (before 0002_v2.sql) just means "nothing saved yet".
  const { data } = await supabase.from('gpa_profiles').select('*').eq('user_id', user.id).maybeSingle()
  const profile = (data ?? null) as GpaProfile | null

  return (
    <div className="page">
      <header className="mb-6">
        <h1 className="page-title">Your <span className="hl" style={{ '--hl': 'var(--color-mint)' } as React.CSSProperties}>CGPA</span></h1>
        <p className="page-sub">Credit-weighted across every semester.</p>
      </header>
      <Calculator initialScale={profile?.scale ?? '10'} initialSemesters={profile?.semesters ?? []} />
    </div>
  )
}
