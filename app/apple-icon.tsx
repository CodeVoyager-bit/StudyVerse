import { ImageResponse } from 'next/og'

// Home-screen icon for iPhone and iPad: the StudyVerse mark on the paper background, rendered to PNG at build time.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f4fa' }}>
        <svg width="140" height="140" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#ffd43b" stroke="#16161d" strokeWidth="2.5" />
          <circle cx="16" cy="16" r="7.5" fill="none" stroke="#16161d" strokeWidth="2.5" />
          <circle cx="23.5" cy="10" r="3.4" fill="#ff7ab6" stroke="#16161d" strokeWidth="2" />
        </svg>
      </div>
    ),
    size,
  )
}
