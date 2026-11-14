import type { ReactNode } from 'react'
import TopNav from '@/app/components/TopNav'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <TopNav />
      <main id="main">{children}</main>
    </div>
  )
}
