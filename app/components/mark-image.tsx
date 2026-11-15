import { ImageResponse } from 'next/og'

/** The StudyVerse mark on the paper background as a PNG; `inset` leaves room for maskable icon crops. */
export function markImage(px: number, inset = 0.11) {
  const mark = Math.round(px * (1 - inset * 2))
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f4fa' }}>
        <svg width={mark} height={mark} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#ffd43b" stroke="#16161d" strokeWidth="2.5" />
          <circle cx="16" cy="16" r="7.5" fill="none" stroke="#16161d" strokeWidth="2.5" />
          <circle cx="23.5" cy="10" r="3.4" fill="#ff7ab6" stroke="#16161d" strokeWidth="2" />
        </svg>
      </div>
    ),
    { width: px, height: px },
  )
}
