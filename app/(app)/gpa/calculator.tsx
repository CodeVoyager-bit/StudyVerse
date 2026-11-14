'use client'

import { useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PlusIcon, TrashIcon, FloppyDiskIcon, CheckIcon } from '@phosphor-icons/react/dist/ssr'
import { gpa, SCALES } from '@/lib/gpa.mjs'
import type { Course } from '@/types/db'
import { CountUp, Rings, Segmented, SPRING } from '@/app/components/motion'
import { saveGpa } from './actions'
import { celebrate } from '@/lib/celebrate'

type Scale = keyof typeof SCALES

const blank = (): Course => ({ credits: '', grade: '' })
const MAX: Record<Scale, number> = { '10': 10, '4': 4 }

export default function Calculator({ initialScale, initialSemesters }: { initialScale: Scale; initialSemesters: Course[][] }) {
  const [scale, setScale] = useState<Scale>(initialScale)
  const [semesters, setSemesters] = useState<Course[][]>(initialSemesters.length ? initialSemesters : [[blank()]])
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const grades = Object.keys(SCALES[scale])

  const edit = (next: (s: Course[][]) => Course[][]) => { setStatus(null); setSemesters(next) }
  const update = (si: number, ci: number, field: keyof Course, value: string) =>
    edit((s) => s.map((sem, i) => (i !== si ? sem : sem.map((c, j) => (j !== ci ? c : { ...c, [field]: value })))))
  const addCourse = (si: number) => edit((s) => s.map((sem, i) => (i !== si ? sem : [...sem, blank()])))
  const removeCourse = (si: number, ci: number) =>
    edit((s) => s.map((sem, i) => (i !== si ? sem : sem.filter((_, j) => j !== ci))).filter((sem) => sem.length))
  const switchScale = (next: Scale) => {
    setScale(next)
    const valid = new Set(Object.keys(SCALES[next]))
    edit((s) => s.map((sem) => sem.map((c) => (valid.has(c.grade) ? c : { ...c, grade: '' }))))
  }
  const save = () =>
    startTransition(async () => {
      const res = await saveGpa(scale, semesters)
      if (res?.error) return setStatus({ ok: false, text: `${res.error}. Try again.` })
      setStatus({ ok: true, text: 'Saved' })
      celebrate({ x: 0.8, y: 0.5 })
    })

  const cgpa = gpa(semesters.flat(), scale)
  const credits = semesters.flat().reduce((sum, c) => sum + (c.grade && c.credits ? Number(c.credits) : 0), 0)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
      <div className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {semesters.map((courses, si) => {
            const sgpa = gpa(courses, scale)
            return (
              <motion.section key={si} layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={SPRING} className="card" aria-labelledby={`sem-${si}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 id={`sem-${si}`} className="section-title text-lg">Semester {si + 1}</h2>
                  {sgpa !== null && <span className="chip bg-yellow tabular-nums">SGPA {sgpa.toFixed(2)}</span>}
                </div>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-sm font-bold px-0.5 mb-1.5" aria-hidden="true"><span>Credits</span><span>Grade</span><span className="w-8" /></div>
                {courses.map((course, ci) => (
                  <div key={ci} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
                    <select name={`credits-${si}-${ci}`} value={course.credits} onChange={(e) => update(si, ci, 'credits', e.target.value)} className="form-control" aria-label={`Semester ${si + 1}, course ${ci + 1} credits`}>
                      <option value="">Pick</option>
                      {[1, 2, 3, 4, 5, 6].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select name={`grade-${si}-${ci}`} value={course.grade} onChange={(e) => update(si, ci, 'grade', e.target.value)} className="form-control" aria-label={`Semester ${si + 1}, course ${ci + 1} grade`}>
                      <option value="">Pick</option>
                      {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <button type="button" className="btn btn-danger btn-icon" onClick={() => removeCourse(si, ci)} aria-label={`Remove course ${ci + 1} from semester ${si + 1}`}><TrashIcon size={16} aria-hidden="true" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addCourse(si)} className="btn btn-sm mt-2"><PlusIcon size={14} weight="bold" aria-hidden="true" />Add course</button>
              </motion.section>
            )
          })}
        </AnimatePresence>
        <button type="button" onClick={() => edit((s) => [...s, [blank()]])} className="btn self-start"><PlusIcon size={16} weight="bold" aria-hidden="true" />Add semester</button>
      </div>

      <aside className="card bg-mint flex flex-col items-center gap-5 lg:sticky lg:top-6" aria-label="Result">
        <Segmented
          id="scale"
          label="Grade scale"
          active={scale}
          items={[
            { key: '10', label: '10-point', onSelect: () => switchScale('10') },
            { key: '4', label: '4.0 scale', onSelect: () => switchScale('4') },
          ]}
        />
        <div className="rounded-full bg-surface border-2 border-ink shadow-[var(--shadow-sm)]">
          <Rings size={190} stroke={16} rings={[{ value: (cgpa ?? 0) / MAX[scale], className: 'stroke-accent', label: 'CGPA' }]}>
            <span className="text-5xl font-extrabold tracking-tight">{cgpa === null ? '0.00' : <CountUp value={cgpa} decimals={2} />}</span>
            <span className="text-xs font-bold mt-0.5">out of {MAX[scale]}</span>
          </Rings>
        </div>
        <p className="font-bold text-center">{credits ? `Weighted across ${credits} credits.` : 'Add a course to see your CGPA.'}</p>
        <button type="button" className="btn btn-primary w-full" onClick={save} disabled={pending}>
          {status?.ok ? <CheckIcon size={16} weight="bold" aria-hidden="true" /> : <FloppyDiskIcon size={16} aria-hidden="true" />}
          {pending ? 'Saving…' : status?.ok ? 'Saved' : 'Save'}
        </button>
        <p className={`text-sm font-bold min-h-5 ${status && !status.ok ? 'text-danger' : ''}`} role="status" aria-live="polite">{status && !status.ok ? status.text : ''}</p>
      </aside>
    </div>
  )
}
