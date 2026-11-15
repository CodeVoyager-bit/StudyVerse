import Link from 'next/link'
import { redirect } from 'next/navigation'
import { UsersThreeIcon, CircleIcon, ChatCircleDotsIcon, CalendarDotsIcon } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/utils/supabase/server'
import { firstName } from '@/utils/data'
import { nowIso } from '@/lib/time'
import { nextSession } from '@/lib/schedule.mjs'
import type { StudyGroup, GroupMember } from '@/types/db'
import { CreateGroupForm, JoinGroupForm, LocalTime } from './group-forms'

export const metadata = { title: 'Study groups' }

const TONES = ['bg-orange', 'bg-mint', 'bg-pink', 'bg-sky', 'bg-yellow']
const ONLINE_MS = 70_000

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/groups')

  const [{ data: groups }, { data: members }] = await Promise.all([
    supabase.from('study_groups').select('*').order('created_at', { ascending: false }),
    supabase.from('group_members').select('group_id, user_id, last_seen'),
  ])
  const list = (groups ?? []) as StudyGroup[]
  const all = (members ?? []) as Pick<GroupMember, 'group_id' | 'user_id' | 'last_seen'>[]
  const now = Date.parse(nowIso())
  const name = firstName(user)

  // Unread = other people's messages since you were last in the room.
  const unread = new Map(await Promise.all(list.map(async (g) => {
    const seen = all.find((m) => m.group_id === g.id && m.user_id === user.id)?.last_seen
    let q = supabase.from('group_messages').select('id', { count: 'exact', head: true }).eq('group_id', g.id).neq('user_id', user.id)
    if (seen) q = q.gt('created_at', seen)
    return [g.id, (await q).count ?? 0] as const
  })))

  return (
    <div className="page">
      <header className="mb-6">
        <h1 className="page-title">Study <span className="hl" style={{ '--hl': 'var(--color-orange)' } as React.CSSProperties}>together</span></h1>
        <p className="page-sub">Focus on one shared timer, quiz each other and swap the best lectures.</p>
      </header>

      {list.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {list.map((g, i) => {
            const mine = all.filter((m) => m.group_id === g.id)
            const online = mine.filter((m) => m.last_seen && now - Date.parse(m.last_seen) < ONLINE_MS).length
            const next = nextSession(g.next_session_at, !!g.session_weekly, now)
            return (
              <Link key={g.id} href={`/groups/${g.id}`} className={`card card-link rise flex flex-col gap-3 ${TONES[i % TONES.length]}`} style={{ '--i': i } as React.CSSProperties}>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-xl font-extrabold leading-tight break-words">{g.name}</h2>
                  <UsersThreeIcon size={26} weight="duotone" aria-hidden="true" className="shrink-0" />
                </div>
                {g.description && <p className="text-sm font-medium line-clamp-2">{g.description}</p>}
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  <span className="chip bg-surface">{mine.length} {mine.length === 1 ? 'member' : 'members'}</span>
                  {online > 0 && <span className="chip bg-surface"><CircleIcon size={9} weight="fill" className="text-success" aria-hidden="true" />{online} here now</span>}
                  {(unread.get(g.id) ?? 0) > 0 && <span className="chip bg-ink text-surface"><ChatCircleDotsIcon size={12} weight="fill" aria-hidden="true" />{unread.get(g.id)! > 99 ? '99+' : unread.get(g.id)} new</span>}
                  {next && <span className="chip bg-surface"><CalendarDotsIcon size={12} weight="fill" aria-hidden="true" /><LocalTime iso={next} /></span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {list.length === 0 && (
        <div className="card flex flex-col sm:flex-row items-center gap-5 mb-8">
          <span className="sticker size-20 text-4xl bg-orange -rotate-6 wiggle shrink-0" aria-hidden="true">👯</span>
          <div>
            <p className="text-xl font-extrabold">Studying with friends keeps you going</p>
            <p className="text-muted font-medium">Start a group and share the invite code, or join one with a code a friend sent you.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 items-start">
        <CreateGroupForm defaultName={name} />
        <JoinGroupForm defaultName={name} />
      </div>
    </div>
  )
}
