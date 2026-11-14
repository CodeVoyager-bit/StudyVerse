import type { ReactNode } from 'react'

// Remounts on every navigation inside the app, so each page eases in (CSS only, no JS needed).
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="rise">{children}</div>
}
