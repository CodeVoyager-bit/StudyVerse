export const metadata = { title: 'Offline' }

// Shown by the service worker when a page can't load without a connection.
export default function Offline() {
  return (
    <main id="main" className="min-h-dvh grid place-items-center px-5 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="sticker size-24 text-5xl bg-sky -rotate-6" aria-hidden="true">📡</span>
        <h1 className="page-title">You&apos;re offline</h1>
        <p className="text-muted font-medium max-w-[36ch]">StudyVerse needs a connection to load your stuff. It&apos;ll be right here when you&apos;re back.</p>
      </div>
    </main>
  )
}
