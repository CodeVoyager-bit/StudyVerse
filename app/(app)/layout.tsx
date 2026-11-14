import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Sidebar from '@/app/components/Sidebar'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const meta = user.user_metadata ?? {}
  const name = meta.username || meta.full_name?.split(' ')[0] || meta.name?.split(' ')[0] || user.email?.split('@')[0] || 'there'

  return (
    <div className="lg:flex min-h-dvh overflow-x-clip">
      <Sidebar name={name} />
      <main id="main" className="flex-1 min-w-0 pb-28 lg:pb-0">{children}</main>
    </div>
  )
}
