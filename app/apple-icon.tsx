import { markImage } from './components/mark-image'

// Home-screen icon for iPhone and iPad, rendered to PNG at build time.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return markImage(180)
}
