import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Bricolage_Grotesque, Caveat, Space_Mono } from 'next/font/google'
import { MotionProvider } from './components/motion'
import ServiceWorker from './components/ServiceWorker'
import './globals.css'

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', axes: ['opsz', 'wdth'] })
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', weight: ['700'] })
const spaceMono = Space_Mono({ subsets: ['latin'], variable: '--font-space-mono', weight: ['400', '700'] })

export const metadata: Metadata = {
  title: { default: 'StudyVerse', template: '%s · StudyVerse' },
  description: 'Tasks, notes, a focus timer, a weekly planner and your CGPA, built for students.',
  appleWebApp: { capable: true, title: 'StudyVerse', statusBarStyle: 'default' },
}

export const viewport: Viewport = { themeColor: '#f2f4fa', colorScheme: 'light' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${caveat.variable} ${spaceMono.variable}`}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <MotionProvider>{children}</MotionProvider>
        <ServiceWorker />
      </body>
    </html>
  )
}
