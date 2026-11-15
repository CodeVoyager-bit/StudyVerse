import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getSubjects } from '@/utils/data'
import { attendanceStats } from '@/lib/attendance.mjs'
import { CAT_TONE } from '@/lib/categories'
import type { AttendanceRecord } from '@/types/db'
import AttendanceMarker from '@/app/components/AttendanceMarker'

export const metadata = { title: 'Attendance' }

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/attendance')

  const [subjects, { data }] = await Promise.all([
    getSubjects(supabase, user.id),
    supabase.from('attendance').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])
  const records = (data ?? []) as AttendanceRecord[]
  const rows = subjects.map((s) => {
    const mine = records.filter((r) => r.subject_id === s.id)
    return { s, stats: attendanceStats(mine, s.attendance_target), lastId: mine[0]?.id }
  })
  const atRisk = rows.filter((r) => r.stats.percent !== null && r.stats.percent < r.s.attendance_target).length

  return (
    <div className="page max-w-[960px]">
      <header className="mb-6">
        <h1 className="page-title"><span className="hl" style={{ '--hl': 'var(--color-sky)' } as React.CSSProperties}>Attendance</span></h1>
        <p className="page-sub">
          {subjects.length === 0 ? 'Track every class against your target.' : atRisk ? `${atRisk} ${atRisk === 1 ? 'subject is' : 'subjects are'} below target.` : 'Every subject is on target. Keep it up.'}
        </p>
      </header>

      {subjects.length === 0 ? (
        <div className="card flex flex-col items-center text-center gap-3 py-12">
          <span className="sticker size-20 text-4xl bg-sky -rotate-6 wiggle" aria-hidden="true">🙋</span>
          <p className="text-xl font-extrabold mt-2">Add your subjects first</p>
          <p className="text-muted font-medium max-w-[42ch]">Attendance is tracked per subject, each with its own goal like 75%.</p>
          <Link href="/subjects" className="btn btn-primary mt-2">Add subjects</Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {rows.map(({ s, stats, lastId }, i) => (
            <section key={s.id} className="card rise" style={{ '--i': i } as React.CSSProperties} aria-labelledby={`att-${s.id}`}>
              <h2 id={`att-${s.id}`} className="mb-3 flex items-center gap-2">
                <span className={`size-4 rounded-full border-2 border-ink ${CAT_TONE[s.color] ?? ''}`} aria-hidden="true" />
                <Link href={`/subjects/${s.id}`} className="text-lg font-extrabold hover:underline break-words">{s.name}</Link>
              </h2>
              <AttendanceMarker subjectId={s.id} stats={stats} target={s.attendance_target} lastId={lastId} />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
