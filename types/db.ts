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
  subject_id?: string | null
  resource_id?: string | null
  created_at: string
}

export type Note = {
  id: string
  user_id: string
  title: string
  content: string
  tags: string[]
  subject_id?: string | null
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
  subject_id?: string | null
  resource_id?: string | null
}

export type Course = { credits: string; grade: string }

export type GpaProfile = {
  user_id: string
  scale: '10' | '4'
  semesters: Course[][]
  updated_at: string
}

export type Subject = {
  id: string
  user_id: string
  name: string
  color: string
  attendance_target: number
  share_token: string | null
  created_at: string
}

export type ResourceKind = 'video' | 'playlist' | 'link' | 'pdf'

export type Resource = {
  id: string
  user_id: string
  subject_id: string | null
  group_id: string | null
  kind: ResourceKind
  url: string
  title: string
  author: string | null
  thumbnail_url: string | null
  watched: boolean
  created_at: string
}

export type AttendanceRecord = {
  id: string
  user_id: string
  subject_id: string
  class_date: string
  status: 'present' | 'absent' | 'cancelled'
  created_at: string
}

export type Exam = {
  id: string
  user_id: string
  subject_id: string | null
  title: string
  exam_at: string
  location: string | null
  created_at: string
}

export type Flashcard = {
  id: string
  user_id: string
  subject_id: string | null
  note_id: string | null
  front: string
  back: string
  box: number
  due_at: string
  created_at: string
}

export type StudyGroup = {
  id: string
  name: string
  description: string | null
  owner_id: string
  invite_code: string
  call_room: string
  weekly_goal_minutes: number
  next_session_at?: string | null
  session_weekly?: boolean
  created_at: string
}

export type GroupMember = {
  group_id: string
  user_id: string
  display_name: string
  role: 'owner' | 'member'
  status: string | null
  last_seen: string | null
  joined_at: string
}

export type GroupMessage = {
  id: string
  group_id: string
  user_id: string
  kind: 'text' | 'quiz' | 'resource'
  body: string
  answer: string | null
  resource_id: string | null
  created_at: string
}

export type GroupSession = {
  group_id: string
  phase: 'work' | 'break'
  minutes: number
  ends_at: string | null
  paused_seconds: number | null
  started_by: string | null
  call_url?: string | null
  updated_at: string
}
