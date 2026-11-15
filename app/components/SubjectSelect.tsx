import type { Subject } from '@/types/db'

/** Optional subject picker shared by tasks, notes, library, exams and flashcards. */
export default function SubjectSelect({ subjects, id, defaultValue, name = 'subject_id', label = 'Subject', required = false }: {
  subjects: Subject[]
  id: string
  defaultValue?: string | null
  name?: string
  label?: string
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}{!required && <span className="font-normal text-faint"> (optional)</span>}</label>
      <select id={id} name={name} defaultValue={defaultValue ?? ''} className="form-control" required={required}>
        <option value="">{subjects.length ? 'No subject' : 'Add subjects on the Subjects page'}</option>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  )
}
