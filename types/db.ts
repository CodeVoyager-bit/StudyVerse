// Row shapes for the tables in supabase/migrations.
export type Priority = 'low' | 'medium' | 'high'

export type Task = {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  priority: Priority | null
  created_at: string
}

export type Note = {
  id: string
  user_id: string
  title: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

export type Quote = {
  id: number
  text: string
  author: string | null
  category: string
}

export type PomodoroSession = {
  id: string
  user_id: string
  started_at: string
  minutes: number
  kind: 'work' | 'break'
}

export type PlannerBlock = {
  id: string
  user_id: string
  weekday: number // 0 = Monday
  start_min: number
  end_min: number
  subject: string
  color: string
}

export type Course = { credits: string; grade: string }

export type GpaProfile = {
  user_id: string
  scale: '10' | '4'
  semesters: Course[][]
  updated_at: string
}
