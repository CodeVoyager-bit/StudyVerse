'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/utils/supabase/server'
import { askClaude } from '@/utils/ai'

type Out<T> = Promise<{ error: string } | T>

const SUMMARY_SYSTEM = `You help a university student revise. The user message holds their study material inside <document> tags: class notes, a lecture transcript, or an article.
Write a revision summary in Markdown: a one-line gist, then the key ideas as short bullet points grouped under small headings, then any formulas, definitions or dates worth memorising.
Keep the student's own terms and examples. Leave out filler, greetings and anything the material doesn't say. Aim for a tenth of the original length.`

const CARDS_SYSTEM = `You help a university student revise with flashcards. The user message holds their study material inside <document> tags.
Write between 4 and 12 flashcards that test the most important facts, definitions and reasoning in it. Each question asks one thing and can be answered from the material alone. Each answer is one to three sentences.
Prefer "why" and "how" questions over trivia. Use the material's own terms.`

const CARDS_SCHEMA = {
  type: 'object',
  properties: {
    cards: {
      type: 'array',
      items: { type: 'object', properties: { front: { type: 'string' }, back: { type: 'string' } }, required: ['front', 'back'], additionalProperties: false },
    },
  },
  required: ['cards'],
  additionalProperties: false,
}

async function noteText(id: string) {
  const { supabase, uid } = await requireUser()
  const { data } = await supabase.from('notes').select('title, content, subject_id').eq('id', id).eq('user_id', uid).single()
  return { supabase, uid, note: data as { title: string; content: string; subject_id: string | null } | null }
}

export async function summarise(source: { noteId: string } | { text: string }): Out<{ summary: string; title: string }> {
  if ('noteId' in source) {
    const { supabase, uid, note } = await noteText(source.noteId)
    if (!note) return { error: 'Note not found.' }
    const res = await askClaude({ supabase, uid, kind: 'summary', system: SUMMARY_SYSTEM, text: `# ${note.title}\n\n${note.content}` })
    return 'error' in res ? res : { summary: res.text, title: `Summary: ${note.title}`.slice(0, 120) }
  }
  const { supabase, uid } = await requireUser()
  const res = await askClaude({ supabase, uid, kind: 'summary', system: SUMMARY_SYSTEM, text: source.text })
  return 'error' in res ? res : { summary: res.text, title: 'Summary' }
}

export async function makeFlashcards(source: { noteId: string } | { text: string; subjectId?: string | null }): Out<{ count: number }> {
  let ctx: Awaited<ReturnType<typeof requireUser>>
  let text: string
  let link: { note_id: string | null; subject_id: string | null }
  if ('noteId' in source) {
    const { supabase, uid, note } = await noteText(source.noteId)
    if (!note) return { error: 'Note not found.' }
    ctx = { supabase, uid }
    text = `# ${note.title}\n\n${note.content}`
    link = { note_id: source.noteId, subject_id: note.subject_id ?? null }
  } else {
    ctx = await requireUser()
    text = source.text
    link = { note_id: null, subject_id: source.subjectId || null }
  }

  const res = await askClaude({ ...ctx, kind: 'flashcards', system: CARDS_SYSTEM, text, schema: CARDS_SCHEMA })
  if ('error' in res) return res
  let cards: { front: string; back: string }[]
  try {
    cards = (JSON.parse(res.text) as { cards: { front: string; back: string }[] }).cards
  } catch {
    return { error: 'The AI sent back something unreadable. Try again.' }
  }
  const rows = cards
    .filter((c) => c.front?.trim() && c.back?.trim())
    .slice(0, 12)
    .map((c) => ({ user_id: ctx.uid, front: c.front.trim().slice(0, 500), back: c.back.trim().slice(0, 2000), ...link }))
  if (!rows.length) return { error: 'No cards came out of that. Try a longer piece.' }
  const { error } = await ctx.supabase.from('flashcards').insert(rows)
  if (error) return { error: error.message }
  revalidatePath('/flashcards')
  revalidatePath('/dashboard')
  return { count: rows.length }
}
