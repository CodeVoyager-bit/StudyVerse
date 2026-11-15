'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  PaperPlaneRightIcon, QuestionIcon, TrashIcon, PlayIcon, PauseIcon, ArrowCounterClockwiseIcon, VideoCameraIcon,
  CopyIcon, CheckIcon, MoonIcon, CrownIcon, XIcon, LinkSimpleIcon, EyeIcon, SignOutIcon, TargetIcon,
  PhoneDisconnectIcon, CalendarPlusIcon, CalendarDotsIcon, ArrowSquareOutIcon, WifiSlashIcon,
} from '@phosphor-icons/react/dist/ssr'
import type { StudyGroup, GroupMember, GroupMessage, GroupSession, Resource } from '@/types/db'
import { supabase } from '@/utils/supabase/client'
import { fmtMinutes, nowMs } from '@/lib/time'
import { celebrate } from '@/lib/celebrate'
import { formatTime } from '@/lib/use-pomodoro'
import { isCallLink, callLabel } from '@/lib/call.mjs'
import { nextSession } from '@/lib/schedule.mjs'
import ResourceCard from '@/app/components/ResourceCard'
import AddResourceForm from '@/app/components/AddResourceForm'
import SubmitButton from '@/app/components/SubmitButton'
import { useFeedback } from '@/app/components/Feedback'
import { logSession } from '../../pomodoro/actions'
import { leaveGroup, deleteGroup, removeMember, updateGroup, nudgeGroup } from '../actions'

export type BoardRow = { user_id: string; display_name: string; minutes: number }
type NewMessage = Pick<GroupMessage, 'kind' | 'body'> & Partial<Pick<GroupMessage, 'answer' | 'resource_id'>>

const ONLINE_MS = 70_000
const BEAT_MS = 30_000
const PRESETS = { work: [25, 50], break: [5, 10] } as const

// One clock for the whole room, ticking each second (0 while server rendering).
const everySecond = (cb: () => void) => {
  const id = setInterval(cb, 1000)
  return () => clearInterval(id)
}
const secondNow = () => Math.floor(Date.now() / 1000) * 1000
const useNow = () => useSyncExternalStore(everySecond, secondNow, () => 0)

const secondsLeft = (s: GroupSession, now: number) =>
  s.ends_at ? Math.max(0, Math.ceil((Date.parse(s.ends_at) - now) / 1000)) : (s.paused_seconds ?? s.minutes * 60)
const clock = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const fromNow = (ms: number) =>
  ms <= 0 ? 'happening now' : ms < 3_600_000 ? `in ${Math.ceil(ms / 60_000)} min` : ms < 86_400_000 ? `in ${Math.round(ms / 3_600_000)} h` : `in ${Math.round(ms / 86_400_000)} days`
// ISO timestamp -> value for <input type="datetime-local"> in the viewer's local time
const toLocalInput = (iso?: string | null) =>
  iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''

type Props = {
  group: StudyGroup
  me: string
  initialMembers: GroupMember[]
  initialMessages: GroupMessage[]
  initialSession: GroupSession
  resources: Resource[]
  initialBoard: BoardRow[]
  inviteUrl: string
}

export default function Room({ group, me, initialMembers, initialMessages, initialSession, resources, initialBoard, inviteUrl }: Props) {
  const router = useRouter()
  const { toast } = useFeedback()
  const now = useNow()
  const [members, setMembers] = useState(initialMembers)
  const [messages, setMessages] = useState(initialMessages)
  const [session, setSession] = useState(initialSession)
  const [board, setBoard] = useState(initialBoard)
  const [live, setLive] = useState<boolean | null>(null)
  const [checkIn, setCheckIn] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const joinedAt = useRef(0)
  const handledEnd = useRef<string | null>(null)
  const callRef = useRef(session.call_url ?? null)

  useEffect(() => { callRef.current = session.call_url ?? null }, [session.call_url])

  const refreshBoard = () => {
    supabase.rpc('group_focus_week', { gid: group.id }).then(({ data }) => data && setBoard(data as BoardRow[]))
  }
  const addMessage = (msg: GroupMessage) => setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]))

  /** Post to the chat and show it straight away (the realtime echo is de-duplicated). */
  const post = async (msg: NewMessage) => {
    const { data, error } = await supabase.from('group_messages').insert({ group_id: group.id, user_id: me, ...msg }).select().single()
    if (error) {
      toast(error.message, 'error')
      return false
    }
    addMessage(data as GroupMessage)
    return true
  }

  // Live updates. Realtime only delivers rows this member may read (RLS). Deletes can't be filtered server-side.
  useEffect(() => {
    const gid = group.id
    let wasDown = false
    // After a dropped connection, re-read everything so nothing sent meanwhile is missed.
    const resync = async () => {
      const [msgs, mems, sess] = await Promise.all([
        supabase.from('group_messages').select('*').eq('group_id', gid).order('created_at', { ascending: false }).limit(80),
        supabase.from('group_members').select('*').eq('group_id', gid).order('joined_at'),
        supabase.from('group_sessions').select('*').eq('group_id', gid).maybeSingle(),
      ])
      if (msgs.data) setMessages((msgs.data as GroupMessage[]).reverse())
      if (mems.data) setMembers(mems.data as GroupMember[])
      if (sess.data) setSession(sess.data as GroupSession)
    }
    const channel = supabase
      .channel(`group-${gid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${gid}` }, (p) => addMessage(p.new as GroupMessage))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'group_messages' }, (p) => {
        const id = (p.old as Partial<GroupMessage>).id
        setMessages((m) => m.filter((x) => x.id !== id))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_members', filter: `group_id=eq.${gid}` }, (p) => {
        const row = p.new as GroupMember
        setMembers((ms) => (ms.some((x) => x.user_id === row.user_id) ? ms : [...ms, row]))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'group_members', filter: `group_id=eq.${gid}` }, (p) => {
        const row = p.new as GroupMember
        setMembers((ms) => ms.map((x) => (x.user_id === row.user_id ? row : x)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'group_members' }, (p) => {
        const old = p.old as Partial<GroupMember>
        if (old.group_id !== gid) return
        if (old.user_id === me) return router.replace('/groups')
        setMembers((ms) => ms.filter((x) => x.user_id !== old.user_id))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'group_sessions', filter: `group_id=eq.${gid}` }, (p) => {
        const s = p.new as GroupSession
        if (s.call_url && s.call_url !== callRef.current && s.started_by !== me) toast('A call just started. Join it from the top of the page.', 'info')
        setSession(s)
        setTimeout(refreshBoard, 4000) // let everyone's finished session land first
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (wasDown) resync()
          wasDown = false
          setLive(true)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          wasDown = true
          setLive(false)
        }
      })
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, me])

  // Presence: a heartbeat every 30 seconds while the tab is visible ("here now" = seen in the last 70 seconds).
  // It also notices if you were removed while away, even if the live update was missed.
  useEffect(() => {
    joinedAt.current = nowMs()
    const beat = () => {
      if (document.visibilityState !== 'visible') return
      supabase.from('group_members').update({ last_seen: new Date().toISOString() }).eq('group_id', group.id).eq('user_id', me).select('user_id')
        .then(({ data, error }) => {
          if (!error && data?.length === 0) {
            toast('You’re no longer in this group.', 'info')
            router.replace('/groups')
          }
        })
    }
    beat()
    const id = setInterval(beat, BEAT_MS)
    document.addEventListener('visibilitychange', beat)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', beat)
    }
  }, [group.id, me, router, toast])

  // When the shared timer runs out: log the minutes you were here for, celebrate, ask how it went, and flip to the next phase.
  // The conditional update (matching ends_at) means only the first member's flip applies.
  useEffect(() => {
    const endsAt = session.ends_at
    if (!endsAt || now === 0 || Date.parse(endsAt) > now || handledEnd.current === endsAt) return
    handledEnd.current = endsAt
    if (session.phase === 'work') {
      const end = Date.parse(endsAt)
      const mins = Math.min(session.minutes, Math.floor((end - Math.max(end - session.minutes * 60_000, joinedAt.current)) / 60_000))
      if (mins >= 1) {
        celebrate(undefined, true)
        logSession(mins, 'work').then(() => {
          refreshBoard()
          setCheckIn(true)
        })
      }
    }
    const next = session.phase === 'work' ? { phase: 'break', minutes: PRESETS.break[0] } : { phase: 'work', minutes: PRESETS.work[0] }
    supabase.from('group_sessions').update({ ...next, ends_at: null, paused_seconds: null }).eq('group_id', group.id).eq('ends_at', endsAt)
      .select().maybeSingle().then(({ data }) => data && setSession(data as GroupSession))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, session])

  const updateSession = (patch: Partial<GroupSession>) => {
    setSession((s) => ({ ...s, ...patch }))
    supabase.from('group_sessions').update({ ...patch, started_by: me }).eq('group_id', group.id).then(({ error }) => {
      if (!error) return
      toast(error.message.includes('call_url') ? 'That isn’t a meeting link we can share.' : error.message, 'error')
      router.refresh()
    })
  }
  const startFocus = (minutes: number) => {
    nudgeGroup(group.id, minutes).then((r) => { if (r.sent) toast('Members who are away got a heads-up.', 'info') })
  }

  const byId = useMemo(() => new Map(members.map((m) => [m.user_id, m])), [members])
  const owner = group.owner_id === me
  const focusing = !!session.ends_at && session.phase === 'work'
  const nextAt = now ? nextSession(group.next_session_at, !!group.session_weekly, now) : null
  const myStatus = byId.get(me)?.status ?? ''

  return (
    <div className="page max-w-[1240px]">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="hand text-2xl">Study group</p>
          <h1 className="page-title break-words">{group.name}</h1>
          {group.description && <p className="page-sub">{group.description}</p>}
          {nextAt && (
            <p className="mt-3 flex flex-wrap items-center gap-2">
              <span className="chip bg-yellow" suppressHydrationWarning>
                <CalendarDotsIcon size={13} weight="fill" aria-hidden="true" />
                {group.session_weekly ? 'Every week · next' : 'Next session'}: {when(nextAt)} · {fromNow(Date.parse(nextAt) - now)}
              </span>
              <a href={`/groups/${group.id}/session.ics`} download className="chip bg-surface hover:bg-yellow"><CalendarPlusIcon size={13} weight="bold" aria-hidden="true" />Add to calendar</a>
            </p>
          )}
        </div>
        {session.call_url ? (
          <div className="flex flex-wrap items-center gap-2">
            <a href={session.call_url} target="_blank" rel="noopener noreferrer" className="btn btn-lg bg-mint">
              <VideoCameraIcon size={20} weight="fill" aria-hidden="true" />{callLabel(session.call_url)}
            </a>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateSession({ call_url: null })}>
              <PhoneDisconnectIcon size={15} weight="bold" aria-hidden="true" />End call
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-lg bg-mint" onClick={() => setCallOpen((o) => !o)} aria-expanded={callOpen} aria-controls="call-setup">
            <VideoCameraIcon size={20} weight="fill" aria-hidden="true" />Start a call
          </button>
        )}
      </header>

      {callOpen && !session.call_url && (
        <CallSetup
          callRoom={group.call_room}
          onClose={() => setCallOpen(false)}
          onShare={(url) => {
            updateSession({ call_url: url })
            setCallOpen(false)
            toast('Call shared. Everyone in the group sees the Join button now.')
          }}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <SharedTimer session={session} now={now} startedBy={session.started_by ? byId.get(session.started_by)?.display_name : undefined} onChange={updateSession} onStartFocus={startFocus} />
          {checkIn && (
            <CheckIn
              status={myStatus}
              onDone={async (text) => {
                if (text && !(await post({ kind: 'text', body: text }))) return
                setCheckIn(false)
              }}
            />
          )}
          <Chat me={me} messages={messages} post={post} setMessages={setMessages} members={byId} resources={resources} session={session} focusing={focusing} live={live} />
        </div>

        <aside className="flex flex-col gap-5">
          <Members groupId={group.id} me={me} owner={owner} members={members} now={now} onRemoved={(id) => setMembers((ms) => ms.filter((x) => x.user_id !== id))} />
          <WeeklyGoal goal={group.weekly_goal_minutes} board={board} me={me} />
          <section className="card flex flex-col gap-3" aria-labelledby="gr-h">
            <h2 id="gr-h" className="text-lg font-extrabold flex items-center gap-2"><LinkSimpleIcon size={20} weight="bold" aria-hidden="true" />Shared library</h2>
            <AddResourceForm groupId={group.id} onAdded={(id, title) => { post({ kind: 'resource', resource_id: id, body: title || 'Shared a link' }) }} />
            {resources.length > 0 && (
              <div className="flex flex-col gap-4">
                {resources.map((r) => <ResourceCard key={r.id} resource={r} canEdit={r.user_id === me} extra={<span className="chip">{byId.get(r.user_id)?.display_name ?? 'Former member'}</span>} />)}
              </div>
            )}
          </section>
          <Invite code={group.invite_code} url={inviteUrl} />
          <Manage group={group} owner={owner} />
        </aside>
      </div>
    </div>
  )
}

/** Share a Google Meet (or Zoom, Teams, Discord) link, or start a no-setup Jitsi room. */
function CallSetup({ callRoom, onShare, onClose }: { callRoom: string; onShare: (url: string) => void; onClose: () => void }) {
  const [error, setError] = useState('')
  const share = (raw: string) => {
    const url = raw.trim()
    if (!isCallLink(url)) return setError('Paste a Google Meet, Zoom, Teams or Discord link that starts with https://')
    onShare(url)
  }
  return (
    <section id="call-setup" className="card bg-mint mb-6 grid gap-5 md:grid-cols-[1.3fr_1fr]" aria-label="Start a call">
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); share(String(new FormData(e.currentTarget).get('url') ?? '')) }}>
        <h2 className="text-lg font-extrabold">Google Meet</h2>
        <ol className="text-sm font-medium list-decimal pl-5 flex flex-col gap-1">
          <li><a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" className="font-bold underline">Create a new Meet<ArrowSquareOutIcon size={12} weight="bold" className="inline ml-0.5 -mt-0.5" aria-hidden="true" /></a> in a new tab.</li>
          <li>Copy its link (meet.google.com/…) and paste it here.</li>
        </ol>
        <label htmlFor="call-url" className="sr-only">Meeting link</label>
        <div className="flex gap-2">
          <input id="call-url" name="url" type="url" inputMode="url" placeholder="https://meet.google.com/abc-defg-hij" className="form-control" autoComplete="off" required />
          <button type="submit" className="btn btn-primary shrink-0">Share</button>
        </div>
        {error && <p className="alert-error" role="alert">{error}</p>}
        <p className="text-xs font-bold">Zoom, Teams and Discord links work too.</p>
      </form>
      <div className="flex flex-col gap-3 md:border-l-2 md:border-dashed md:border-ink/30 md:pl-5">
        <h2 className="text-lg font-extrabold">Or a quick Jitsi call</h2>
        <p className="text-sm font-medium">Free, nothing to set up and no account needed to join. The first person in may be asked to sign in to open the room.</p>
        <div className="flex flex-wrap gap-2 mt-auto">
          <button type="button" className="btn" onClick={() => onShare(`https://meet.jit.si/${callRoom}`)}><VideoCameraIcon size={16} weight="fill" aria-hidden="true" />Start Jitsi call</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </section>
  )
}

function SharedTimer({ session, now, startedBy, onChange, onStartFocus }: {
  session: GroupSession
  now: number
  startedBy?: string
  onChange: (p: Partial<GroupSession>) => void
  onStartFocus: (minutes: number) => void
}) {
  const running = !!session.ends_at
  const paused = !running && session.paused_seconds !== null
  const left = now ? secondsLeft(session, now) : session.paused_seconds ?? session.minutes * 60
  const pct = 1 - left / (session.minutes * 60)
  const work = session.phase === 'work'

  const start = () => {
    onChange({ ends_at: new Date(nowMs() + (session.paused_seconds ?? session.minutes * 60) * 1000).toISOString(), paused_seconds: null })
    if (work && !paused) onStartFocus(session.minutes)
  }
  const pause = () => onChange({ ends_at: null, paused_seconds: secondsLeft(session, nowMs()) })
  const reset = () => onChange({ ends_at: null, paused_seconds: null })
  const pick = (phase: 'work' | 'break', minutes: number) => onChange({ phase, minutes, ends_at: null, paused_seconds: null })

  return (
    <section className={`card flex flex-col gap-4 ${work ? 'bg-pink' : 'bg-mint'}`} aria-labelledby="timer-h">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="timer-h" className="text-lg font-extrabold">{work ? 'Group focus' : 'Group break'}</h2>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Timer length">
          {PRESETS.work.map((m) => <button key={`w${m}`} type="button" className={`chip ${work && session.minutes === m ? 'bg-ink text-surface' : 'bg-surface hover:bg-yellow'}`} onClick={() => pick('work', m)} disabled={running} aria-pressed={work && session.minutes === m}>Focus {m}</button>)}
          {PRESETS.break.map((m) => <button key={`b${m}`} type="button" className={`chip ${!work && session.minutes === m ? 'bg-ink text-surface' : 'bg-surface hover:bg-yellow'}`} onClick={() => pick('break', m)} disabled={running} aria-pressed={!work && session.minutes === m}>Break {m}</button>)}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="font-mono text-6xl font-bold tabular-nums tracking-tight" role="timer" aria-live="off">{formatTime(left)}</p>
        <div className="flex gap-2">
          {running ? (
            <button type="button" className="btn btn-lg" onClick={pause}><PauseIcon size={20} weight="fill" aria-hidden="true" />Pause</button>
          ) : (
            <button type="button" className="btn btn-lg btn-primary" onClick={start}><PlayIcon size={20} weight="fill" aria-hidden="true" />{paused ? 'Resume' : 'Start for everyone'}</button>
          )}
          <button type="button" className="btn btn-lg btn-icon !px-0 w-[3.4rem]" onClick={reset} aria-label="Reset timer"><ArrowCounterClockwiseIcon size={20} weight="bold" aria-hidden="true" /></button>
        </div>
      </div>
      <div className="h-3 rounded-full border-2 border-ink bg-surface overflow-hidden" aria-hidden="true">
        <div className="h-full bg-ink transition-[width] duration-1000 ease-linear" style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%` }} />
      </div>
      <p className="text-sm font-bold">
        {running ? `${work ? 'Everyone is focusing' : 'Break time'}${startedBy ? `, started by ${startedBy}` : ''}. ${work ? 'Chat is quiet until the break.' : 'Chat away.'}` : paused ? 'Paused for everyone.' : 'Set what you’re working on, then start. Finished focus counts toward everyone’s streak.'}
      </p>
    </section>
  )
}

/** After a group focus: say whether you finished what you planned. Reporting back to the group is what keeps people accountable. */
function CheckIn({ status, onDone }: { status: string; onDone: (text: string | null) => Promise<void> }) {
  const [pending, startTransition] = useTransition()
  const say = (text: string | null) => startTransition(async () => { await onDone(text) })
  return (
    <section className="card bg-yellow rise flex flex-col gap-3" aria-labelledby="ci-h">
      <h2 id="ci-h" className="text-lg font-extrabold">Session done. How did it go?</h2>
      {status ? (
        <>
          <p className="font-medium">You planned: <b className="break-words">{status}</b></p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn bg-mint" disabled={pending} onClick={() => say(`✅ Finished: ${status}`)}>Finished it</button>
            <button type="button" className="btn" disabled={pending} onClick={() => say(`⏳ Still working on: ${status}`)}>Still going</button>
            <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => say(null)}>Skip</button>
          </div>
        </>
      ) : (
        <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); const t = String(new FormData(e.currentTarget).get('done') ?? '').trim(); say(t ? `✅ Done: ${t}` : null) }}>
          <label htmlFor="ci-done" className="font-medium">What did you get done? Your group sees it in the chat.</label>
          <div className="flex gap-2">
            <input id="ci-done" name="done" type="text" maxLength={200} placeholder="Solved 6 of the 8 normalisation problems" className="form-control" autoComplete="off" />
            <button type="submit" className="btn btn-primary shrink-0" disabled={pending}>Share</button>
          </div>
          <button type="button" className="btn btn-ghost btn-sm self-start" disabled={pending} onClick={() => say(null)}>Skip</button>
        </form>
      )}
    </section>
  )
}

function Chat({ me, messages, post, setMessages, members, resources, session, focusing, live }: {
  me: string
  messages: GroupMessage[]
  post: (msg: NewMessage) => Promise<boolean>
  setMessages: React.Dispatch<React.SetStateAction<GroupMessage[]>>
  members: Map<string, GroupMember>
  resources: Resource[]
  session: GroupSession
  focusing: boolean
  live: boolean | null
}) {
  const { confirm } = useFeedback()
  const [quiz, setQuiz] = useState(false)
  const [error, setError] = useState('')
  const [peek, setPeek] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set())
  const [, startTransition] = useTransition()
  const list = useRef<HTMLOListElement>(null)
  const form = useRef<HTMLFormElement>(null)

  // Quiet mode: during group focus, other people's new messages wait for the break (or until you choose to look).
  const focusStart = focusing ? Date.parse(session.ends_at!) - session.minutes * 60_000 : 0
  const quiet = focusing && peek !== session.ends_at
  const visible = quiet ? messages.filter((m) => m.user_id === me || Date.parse(m.created_at) < focusStart) : messages
  const held = messages.length - visible.length
  const resourceById = new Map(resources.map((r) => [r.id, r]))

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight })
  }, [visible.length])

  const send = (fd: FormData) => startTransition(async () => {
    const body = String(fd.get('body') ?? '').trim()
    const answer = String(fd.get('answer') ?? '').trim()
    if (!body) return
    if (quiz && !answer) return setError('Add the answer so people can check themselves.')
    setError('')
    if (!(await post({ kind: quiz ? 'quiz' : 'text', body: body.slice(0, 2000), answer: quiz ? answer.slice(0, 1000) : null }))) return
    setQuiz(false)
    form.current?.reset()
  })
  const remove = async (m: GroupMessage) => {
    if (!(await confirm({ title: 'Delete this message?', body: m.body.slice(0, 140), confirmLabel: 'Delete', danger: true }))) return
    setMessages((all) => all.filter((x) => x.id !== m.id))
    await supabase.from('group_messages').delete().eq('id', m.id).eq('user_id', me)
  }

  return (
    <section className="card p-0 flex flex-col h-[70dvh] lg:h-[calc(100dvh-24rem)] min-h-[420px]" aria-labelledby="chat-h">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b-2 border-ink">
        <h2 id="chat-h" className="text-lg font-extrabold">Chat</h2>
        <div className="flex gap-1.5">
          {live === false && <span className="chip chip-danger"><WifiSlashIcon size={12} weight="bold" aria-hidden="true" />Reconnecting…</span>}
          {quiet && <span className="chip chip-warning"><MoonIcon size={12} weight="fill" aria-hidden="true" />Quiet while focusing</span>}
        </div>
      </div>
      <ol ref={list} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" aria-live="polite" aria-relevant="additions">
        {visible.length === 0 && <li className="m-auto text-center font-bold text-muted max-w-[36ch]">Say hi, or post a quiz question. Explaining something to the group is one of the best ways to learn it.</li>}
        {visible.map((m) => {
          const mine = m.user_id === me
          const who = members.get(m.user_id)?.display_name ?? 'Former member'
          const res = m.resource_id ? resourceById.get(m.resource_id) : undefined
          return (
            <li key={m.id} className={`group flex flex-col max-w-[85%] ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
              <span className="text-xs font-bold text-muted px-1" suppressHydrationWarning>{mine ? 'You' : who} · {clock(m.created_at)}</span>
              <div className={`relative rounded-[14px] border-2 border-ink px-3 py-2 shadow-[var(--shadow-sm)] break-words whitespace-pre-wrap ${m.kind === 'quiz' ? 'bg-yellow' : mine ? 'bg-accent-soft' : 'bg-surface'}`}>
                {m.kind === 'quiz' && <span className="hand text-lg block -mb-0.5">Quiz</span>}
                {m.kind === 'resource' ? (
                  <a href={res?.url ?? '#'} target="_blank" rel="noopener noreferrer" className="font-bold underline flex items-center gap-1.5"><LinkSimpleIcon size={14} weight="bold" aria-hidden="true" />{res?.title ?? m.body}</a>
                ) : (
                  <p className="font-medium">{m.body}</p>
                )}
                {m.kind === 'quiz' && m.answer && (
                  revealed.has(m.id) ? (
                    <p className="mt-2 pt-2 border-t-2 border-dashed border-ink/30 font-bold">{m.answer}</p>
                  ) : (
                    <button type="button" className="btn btn-sm mt-2" onClick={() => setRevealed((s) => new Set(s).add(m.id))}><EyeIcon size={14} weight="bold" aria-hidden="true" />Answer it in your head, then reveal</button>
                  )
                )}
              </div>
              {mine && (
                <button type="button" onClick={() => remove(m)} className="text-xs font-bold text-muted hover:text-danger px-1 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100" aria-label="Delete message">
                  <TrashIcon size={12} weight="bold" className="inline -mt-0.5" aria-hidden="true" /> Delete
                </button>
              )}
            </li>
          )
        })}
      </ol>
      {held > 0 && (
        <div className="mx-4 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-[12px] border-2 border-ink bg-yellow px-3 py-2 text-sm font-bold" role="status">
          {held} new {held === 1 ? 'message' : 'messages'} waiting for the break
          <button type="button" className="btn btn-sm" onClick={() => setPeek(session.ends_at)}>Show now</button>
        </div>
      )}
      <form ref={form} action={send} className="border-t-2 border-ink p-3 flex flex-col gap-2">
        {error && <p className="alert-error" role="alert">{error}</p>}
        <div className="flex gap-2 items-end">
          <button type="button" onClick={() => setQuiz((q) => !q)} className={`btn btn-icon shrink-0 ${quiz ? 'bg-yellow' : ''}`} aria-pressed={quiz} aria-label="Ask a quiz question" title="Ask a quiz question">
            <QuestionIcon size={18} weight="bold" aria-hidden="true" />
          </button>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="chat-body" className="sr-only">{quiz ? 'Quiz question' : 'Message'}</label>
            <input id="chat-body" name="body" type="text" maxLength={2000} placeholder={quiz ? 'Quiz question: what does 3NF remove?' : focusing ? 'Focus time. Messages wait for the break.' : 'Message the group…'} className="form-control" autoComplete="off" required />
            {quiz && (
              <>
                <label htmlFor="chat-answer" className="sr-only">Answer</label>
                <input id="chat-answer" name="answer" type="text" maxLength={1000} placeholder="Answer (hidden until someone reveals it)" className="form-control" autoComplete="off" />
              </>
            )}
          </div>
          <SubmitButton className="btn btn-primary btn-icon shrink-0"><PaperPlaneRightIcon size={18} weight="fill" aria-label="Send" /></SubmitButton>
        </div>
      </form>
    </section>
  )
}

function Members({ groupId, me, owner, members, now, onRemoved }: {
  groupId: string
  me: string
  owner: boolean
  members: GroupMember[]
  now: number
  onRemoved: (userId: string) => void
}) {
  const { confirm, toast } = useFeedback()
  const [busy, setBusy] = useState<string | null>(null)
  const online = (m: GroupMember) => !!now && !!m.last_seen && now - Date.parse(m.last_seen) < ONLINE_MS
  const sorted = [...members].sort((a, b) => Number(online(b)) - Number(online(a)) || a.display_name.localeCompare(b.display_name))
  const mine = members.find((m) => m.user_id === me)
  const here = members.filter(online).length

  const saveStatus = (status: string) => {
    if (status === (mine?.status ?? '')) return
    supabase.from('group_members').update({ status: status.slice(0, 80) || null }).eq('group_id', groupId).eq('user_id', me)
      .then(({ error }) => toast(error ? error.message : status ? 'Status saved. Your group can see it.' : 'Status cleared.', error ? 'error' : 'ok'))
  }
  const remove = async (m: GroupMember) => {
    const ok = await confirm({ title: `Remove ${m.display_name}?`, body: 'They leave the group right away. They can come back only with the invite code.', confirmLabel: 'Remove', danger: true })
    if (!ok) return
    setBusy(m.user_id)
    const res = await removeMember(groupId, m.user_id)
    setBusy(null)
    if (res?.error) return toast(res.error, 'error')
    onRemoved(m.user_id)
    toast(`${m.display_name} was removed from the group.`)
  }

  return (
    <section className="card flex flex-col gap-3" aria-labelledby="mem-h">
      <h2 id="mem-h" className="text-lg font-extrabold">Here now <span className="chip ml-1">{here} of {members.length}</span></h2>
      <div>
        <label htmlFor="my-status" className="label">What are you working on?</label>
        <input id="my-status" type="text" maxLength={80} defaultValue={mine?.status ?? ''} placeholder="DBMS chapter 3 problems" className="form-control"
          onBlur={(e) => saveStatus(e.target.value.trim())} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
      </div>
      <ul className="flex flex-col gap-2.5">
        {sorted.map((m) => (
          <li key={m.user_id} className={`flex items-start gap-2.5 ${busy === m.user_id ? 'opacity-50' : ''}`}>
            <span className={`mt-1.5 size-3 shrink-0 rounded-full border-2 border-ink ${online(m) ? 'bg-success' : 'bg-surface'}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight break-words">
                {m.display_name}{m.user_id === me && <span className="text-muted font-medium"> (you)</span>}
                {m.role === 'owner' && <CrownIcon size={14} weight="fill" className="inline ml-1 -mt-0.5 text-warning" aria-label="Owner" />}
                <span className="sr-only">{online(m) ? ', here now' : ', away'}</span>
              </p>
              {m.status && <p className="text-sm text-muted font-medium break-words">{m.status}</p>}
            </div>
            {owner && m.user_id !== me && (
              <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={`Remove ${m.display_name} from the group`} disabled={busy === m.user_id} onClick={() => remove(m)}>
                <XIcon size={14} weight="bold" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function WeeklyGoal({ goal, board, me }: { goal: number; board: BoardRow[]; me: string }) {
  const total = board.reduce((s, r) => s + Number(r.minutes), 0)
  const pct = Math.min(1, total / goal)
  return (
    <section className="card bg-orange flex flex-col gap-3" aria-labelledby="goal-h">
      <h2 id="goal-h" className="text-lg font-extrabold flex items-center gap-2"><TargetIcon size={20} weight="fill" aria-hidden="true" />This week together</h2>
      <p className="font-bold"><span className="text-3xl font-extrabold">{fmtMinutes(total)}</span> of {fmtMinutes(goal)} goal</p>
      <div className="h-3 rounded-full border-2 border-ink bg-surface overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)} aria-label="Weekly group goal">
        <div className="h-full bg-ink" style={{ width: `${pct * 100}%` }} />
      </div>
      {pct >= 1 && <p className="hand text-2xl">Goal smashed. Nice work, team.</p>}
      <ol className="flex flex-col gap-1">
        {board.filter((r) => Number(r.minutes) > 0).map((r, i) => (
          <li key={r.user_id} className="flex justify-between gap-2 text-sm font-bold">
            <span className="truncate">{i + 1}. {r.display_name}{r.user_id === me ? ' (you)' : ''}</span>
            <span className="font-mono shrink-0">{fmtMinutes(Number(r.minutes))}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs font-bold">Counts every finished focus session, solo or together.</p>
    </section>
  )
}

function Invite({ code, url }: { code: string; url: string }) {
  const { toast } = useFeedback()
  const [copied, setCopied] = useState<'' | 'code' | 'link'>('')
  const copy = async (what: 'code' | 'link') => {
    await navigator.clipboard.writeText(what === 'code' ? code : url)
    setCopied(what)
    toast(what === 'code' ? 'Invite code copied.' : 'Invite link copied. Send it to a friend.')
    setTimeout(() => setCopied(''), 1600)
  }
  return (
    <section className="card bg-sky flex flex-col gap-3" aria-labelledby="inv-h">
      <h2 id="inv-h" className="text-lg font-extrabold">Invite friends</h2>
      <p className="font-mono text-3xl font-bold tracking-[0.2em]">{code}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={() => copy('code')}>{copied === 'code' ? <CheckIcon size={14} weight="bold" aria-hidden="true" /> : <CopyIcon size={14} weight="bold" aria-hidden="true" />}Copy code</button>
        <button type="button" className="btn btn-sm" onClick={() => copy('link')}>{copied === 'link' ? <CheckIcon size={14} weight="bold" aria-hidden="true" /> : <LinkSimpleIcon size={14} weight="bold" aria-hidden="true" />}Copy invite link</button>
      </div>
    </section>
  )
}

function Manage({ group, owner }: { group: StudyGroup; owner: boolean }) {
  const { confirm, toast } = useFeedback()
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  if (!owner) {
    const leave = async () => {
      if (!(await confirm({ title: `Leave ${group.name}?`, body: 'You can rejoin later with the invite code.', confirmLabel: 'Leave', danger: true }))) return
      startTransition(async () => { const r = await leaveGroup(group.id); if (r?.error) toast(r.error, 'error') })
    }
    return (
      <button type="button" className="btn btn-danger self-start" disabled={pending} onClick={leave}>
        <SignOutIcon size={16} weight="bold" aria-hidden="true" />Leave group
      </button>
    )
  }

  const save = async (fd: FormData) => {
    const local = String(fd.get('next_session_at') ?? '')
    if (local) fd.set('next_session_at', new Date(local).toISOString()) // local time -> UTC before it leaves the browser
    const r = await updateGroup(group.id, fd)
    setError(r?.error ?? '')
    if (!r?.error) toast('Group settings saved.')
  }
  const remove = async () => {
    if (!(await confirm({ title: `Delete ${group.name}?`, body: 'This deletes it for everyone, with its chat and shared links. It can’t be undone.', confirmLabel: 'Delete group', danger: true }))) return
    startTransition(async () => { const r = await deleteGroup(group.id); if (r?.error) toast(r.error, 'error') })
  }

  return (
    <details className="card">
      <summary className="font-extrabold cursor-pointer">Group settings</summary>
      <form action={save} className="flex flex-col gap-3 mt-3">
        {error && <p className="alert-error" role="alert">{error}</p>}
        <div>
          <label htmlFor="gs-name" className="label">Name</label>
          <input id="gs-name" name="name" type="text" defaultValue={group.name} maxLength={60} className="form-control" required />
        </div>
        <div>
          <label htmlFor="gs-desc" className="label">Description</label>
          <input id="gs-desc" name="description" type="text" defaultValue={group.description ?? ''} maxLength={280} className="form-control" />
        </div>
        <div>
          <label htmlFor="gs-goal" className="label">Weekly goal (hours, whole group)</label>
          <input id="gs-goal" name="goal_hours" type="number" min={1} max={160} step={0.5} defaultValue={group.weekly_goal_minutes / 60} className="form-control w-32" required />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="label">Next group session <span className="font-normal text-faint">(optional)</span></legend>
          <input id="gs-next" name="next_session_at" type="datetime-local" defaultValue={toLocalInput(group.next_session_at)} className="form-control" aria-label="Date and time" />
          <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
            <input type="checkbox" name="session_weekly" defaultChecked={!!group.session_weekly} className="size-4" />Repeats every week
          </label>
          <p className="text-xs font-medium text-muted">Members see a countdown and can add it to their calendar. Clear the date to remove it.</p>
        </fieldset>
        <SubmitButton className="btn btn-primary self-start">Save</SubmitButton>
      </form>
      <button type="button" className="btn btn-danger mt-4" disabled={pending} onClick={remove}>
        <TrashIcon size={16} weight="bold" aria-hidden="true" />Delete group
      </button>
    </details>
  )
}
