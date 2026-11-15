'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/utils/supabase/server'
import { review } from '@/lib/leitner.mjs'

export type Result = { error?: string } | undefined
const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()

function refresh() {
  revalidatePath('/flashcards')
  revalidatePath('/dashboard')
}

export async function addCard(fd: FormData): Promise<Result> {
  const front = text(fd, 'front')
  const back = text(fd, 'back')
  if (!front || !back) return { error: 'A card needs a question and an answer.' }
  if (front.length > 500 || back.length > 2000) return { error: 'That card is too long. Split it into smaller ones.' }
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('flashcards').insert({ user_id: uid, front, back, subject_id: text(fd, 'subject_id') || null })
  if (error) return { error: error.message }
  refresh()
}

/** Leitner step: right answers move the card up a box (reviewed later), wrong ones send it back to box 1. */
export async function reviewCard(id: string, correct: boolean): Promise<Result> {
  const { supabase, uid } = await requireUser()
  const { data: card, error: readError } = await supabase.from('flashcards').select('box').eq('id', id).eq('user_id', uid).single()
  if (readError) return { error: readError.message }
  const { error } = await supabase.from('flashcards').update(review(card.box, correct)).eq('id', id).eq('user_id', uid)
  if (error) return { error: error.message }
  refresh()
}

export async function deleteCard(id: string): Promise<Result> {
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('flashcards').delete().eq('id', id).eq('user_id', uid)
  if (error) return { error: error.message }
  refresh()
}
