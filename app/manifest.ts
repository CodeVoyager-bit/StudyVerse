import type { MetadataRoute } from 'next'

// Makes StudyVerse installable ("Add to Home Screen") and opens it like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StudyVerse',
    short_name: 'StudyVerse',
    description: 'Tasks, notes, focus timer, planner, flashcards and study groups for students.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#f2f4fa',
    theme_color: '#f2f4fa',
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
