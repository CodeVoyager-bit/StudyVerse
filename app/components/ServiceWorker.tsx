'use client'

import { useEffect } from 'react'

/** Registers /sw.js in production builds (offline page and push reminders). Settings registers it on demand in dev. */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return null
}
