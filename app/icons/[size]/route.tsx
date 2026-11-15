import { markImage } from '@/app/components/mark-image'

// App icons for the web manifest: /icons/192 and /icons/512 (the 512 doubles as the maskable icon).
export const dynamicParams = false
export const generateStaticParams = () => [{ size: '192' }, { size: '512' }]

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const px = (await params).size === '512' ? 512 : 192
  return markImage(px, px === 512 ? 0.2 : 0.11)
}
