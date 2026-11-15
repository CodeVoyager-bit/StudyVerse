import Link from 'next/link'
import { NAV_SECTIONS } from '@/app/components/nav'

export const metadata = { title: 'Everything' }

// The phone's "More" tab: every part of StudyVerse as a big tappable sticker.
export default function MorePage() {
  return (
    <div className="page">
      <header className="mb-6">
        <h1 className="page-title"><span className="hl">Everything</span></h1>
        <p className="page-sub">Every part of StudyVerse, in one place.</p>
      </header>
      <div className="flex flex-col gap-7">
        {NAV_SECTIONS.map((section) => (
          <section key={section.title} aria-labelledby={`more-${section.title}`}>
            <h2 id={`more-${section.title}`} className="hand text-2xl mb-2">{section.title}</h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {section.links.map(({ href, label, Icon, blurb, tone }) => (
                <Link key={href} href={href} className={`card card-link p-4 flex flex-col gap-2 ${tone ?? ''}`}>
                  <Icon size={26} weight="fill" aria-hidden="true" />
                  <span className="font-extrabold leading-tight">{label}</span>
                  {blurb && <span className="text-xs font-semibold leading-snug">{blurb}</span>}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
