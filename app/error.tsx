'use client'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page grid place-items-center min-h-[70dvh] text-center">
      <div className="max-w-md flex flex-col items-center gap-5">
        <span className="sticker size-20 text-4xl bg-danger-soft rotate-6" aria-hidden="true">😵</span>
        <h1 className="page-title">Well, that broke</h1>
        <p className="text-muted font-medium">{error.message}</p>
        <button type="button" className="btn btn-primary btn-lg" onClick={reset}>Try again</button>
      </div>
    </div>
  )
}
