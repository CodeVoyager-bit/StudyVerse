import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center px-5 text-center">
      <div className="flex flex-col items-center gap-5 rise">
        <span className="sticker size-24 text-5xl bg-yellow -rotate-12 wiggle" aria-hidden="true">🙈</span>
        <h1 className="page-title">This page wandered off</h1>
        <p className="text-muted font-medium">The link may be old, or the page was moved.</p>
        <Link href="/" className="btn btn-primary btn-lg">Back home</Link>
      </div>
    </div>
  )
}
