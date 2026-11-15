'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  PaperPlaneRightIcon, QuestionIcon, TrashIcon, PlayIcon, PauseIcon, ArrowCounterClockwiseIcon, VideoCameraIcon,
  CopyIcon, CheckIcon, MoonIcon, CrownIcon, XIcon, LinkSimpleIcon, EyeIcon, SignOutIcon, TargetIcon,
} from '@phosphor-icons/react/dist/ssr'
import type { StudyGroup, GroupMember, GroupMessage, GroupSession, Resource } from '@/types/db'
import { supabase } from '@/utils/supabase/client'
import { fmtMinutes, nowMs } from '@/lib/time'
import { celebrate } from '@/lib/celebrate'
import { formatTime } from '@/lib/use-pomodoro'
import ResourceCard from '@/app/components/ResourceCard'
import AddResourceForm from '@/app/components/AddResourceForm'
import SubmitButton from '@/app/components/SubmitButton'
import { logSession } from '../../pomodoro/actions'
import { leaveGroup, deleteGroup, removeMember, updateGroup } from '../actions'

export type BoardRow = { user_id: string; display_name: string; minutes: number }

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
  const now = useNow()
  const [members, setMembers] = useState(initialMembers)
  const [messages, setMessages] = useState(initialMessages)
  const [session, setSession] = useState(initialSession)
  const [board, setBoard] = useState(initialBoard)
  const joinedAt = useRef(0)
  const handledEnd = useRef<string | null>(null)

  const refreshBoard = () => {
    supabase.rpc('group_focus_week', { gid: group.id }).then(({ data }) => data && setBoard(data as BoardRow[]))
  }

  // Live updates. Realtime only delivers rows this member may read (RLS). Deletes can't be filtered server-side.
  useEffect(() => {
    const gid = group.id
    const channel = supabase
      .channel(`group-${gid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${gid}` }, (p) => {
        const msg = p.new as GroupMessage
        setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]))
      })
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
        setSession(p.new as GroupSession)
        setTimeout(refreshBoard, 4000) // let everyone's finished session land first
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, me])

  // Presence: a heartbeat every 30 seconds while the tab is visible. "Here now" means seen in the last 70 seconds.
  useEffect(() => {
    joinedAt.current = nowMs()
    const beat = () => {
      if (document.visibilityState !== 'visible') return
      supabase.from('group_members').update({ last_seen: new Date().toISOString() }).eq('group_id', group.id).eq('user_id', me).then(() => {})
    }
    beat()
    const id = setInterval(beat, BEAT_MS)
    document.addEventListener('visibilitychange', beat)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', beat)
    }
  }, [group.id, me])

  // When the shared timer runs out: log the minutes you were here for, celebrate, and flip to the next phase.
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
        logSession(mins, 'work').then(refreshBoard)
      }
    }
    const next = session.phase === 'work' ? { phase: 'break', minutes: PRESETS.break[0] } : { phase: 'work', minutes: PRESETS.work[0] }
    supabase.from('group_sessions').update({ ...next, ends_at: null, paused_seconds: null }).eq('group_id', group.id).eq('ends_at', endsAt)
      .select().maybeSingle().then(({ data }) => data && setSession(data as GroupSession))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, session])

  const updateSession = (patch: Partial<GroupSession>) => {
    setSession((s) => ({ ...s, ...patch }))
    supabase.from('group_sessions').update({ ...patch, started_by: me }).eq('group_id', group.id).then(({ error }) => error && router.refresh())
  }

  const byId = useMemo(() => new Map(members.map((m) => [m.user_id, m])), [members])
  const owner = group.owner_id === me
  const focusing = !!session.ends_at && session.phase === 'work'

  return (
    <div className="page max-w-[1240px]">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="hand text-2xl">Study group</p>
          <h1 className="page-title break-words">{group.name}</h1>
          {group.description && <p className="page-sub">{group.description}</p>}
        </div>
        <a href={`https://meet.jit.si/${group.call_room}`} target="_blank" rel="noopener noreferrer" className="btn btn-lg bg-mint">
          <VideoCameraIcon size={20} weight="fill" aria-hidden="true" />Join the call
        </a>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <SharedTimer session={session} now={now} startedBy={session.started_by ? byId.get(session.started_by)?.display_name : undefined} onChange={updateSession} />
          <Chat groupId={group.id} me={me} messages={messages} setMessages={setMessages} members={byId} resources={resources} session={session} focusing={focusing} />
        </div>

        <aside className="flex flex-col gap-5">
          <Members groupId={group.id} me={me} owner={owner} members={members} now={now} />
          <WeeklyGoal goal={group.weekly_goal_minutes} board={board} me={me} />
          <section className="card flex flex-col gap-3" aria-labelledby="gr-h">
            <h2 id="gr-h" className="text-lg font-extrabold flex items-center gap-2"><LinkSimpleIcon size={20} weight="bold" aria-hidden="true" />Shared library</h2>
            <AddResourceForm
              groupId={group.id}
              onAdded={(id, title) => {
                supabase.from('group_messages').insert({ group_id: group.id, user_id: me, kind: 'resource', resource_id: id, body: title || 'Shared a link' })
                  .select().single().then(({ data }) => data && setMessages((m) => (m.some((x) => x.id === data.id) ? m : [...m, data as GroupMessage])))
              }}
            />
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

function SharedTimer({ session, now, startedBy, onChange }: { session: GroupSession; now: number; startedBy?: string; onChange: (p: Partial<GroupSession>) => void }) {
  const running = !!session.ends_at
  const paused = !running && session.paused_seconds !== null
  const left = now ? secondsLeft(session, now) : session.paused_seconds ?? session.minutes * 60
  const pct = 1 - left / (session.minutes * 60)
  const work = session.phase === 'work'

  const start = () => onChange({ ends_at: new Date(nowMs() + (session.paused_seconds ?? session.minutes * 60) * 1000).toISOString(), paused_seconds: null })
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
        {running ? `${work ? 'Everyone is focusing' : 'Break time'}${startedBy ? `, started by ${startedBy}` : ''}. ${work ? 'Chat is quiet until the break.' : 'Chat away.'}` : paused ? 'Paused for everyone.' : 'One timer for the whole group. Finished focus counts toward everyone’s streak.'}
      </p>
    </section>
  )
}

function Chat({ groupId, me, messages, setMessages, members, resources, session, focusing }: {
  groupId: string
  me: string
  messages: GroupMessage[]
  setMessages: React.Dispatch<React.SetStateAction<GroupMessage[]>>
  members: Map<string, GroupMember>
  resources: Resource[]
  session: GroupSession
  focusing: boolean
}) {
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
    const { data, error: err } = await supabase
      .from('group_messages')
      .insert({ group_id: groupId, user_id: me, kind: quiz ? 'quiz' : 'text', body: body.slice(0, 2000), answer: quiz ? answer.slice(0, 1000) : null })
      .select()
      .single()
    if (err) return setError(err.message)
    setError('')
    setQuiz(false)
    form.current?.reset()
    setMessages((m) => (m.some((x) => x.id === data.id) ? m : [...m, data as GroupMessage]))
  })
  const remove = (id: string) => startTransition(async () => {
    setMessages((m) => m.filter((x) => x.id !== id))
    await supabase.from('group_messages').delete().eq('id', id).eq('user_id', me)
  })

  return (
    <section className="card p-0 flex flex-col h-[70dvh] lg:h-[calc(100dvh-24rem)] min-h-[420px]" aria-labelledby="chat-h">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b-2 border-ink">
        <h2 id="chat-h" className="text-lg font-extrabold">Chat</h2>
        {quiet && <span className="chip chip-warning"><MoonIcon size={12} weight="fill" aria-hidden="true" />Quiet while focusing</span>}
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
                <button type="button" onClick={() => remove(m.id)} className="text-xs font-bold text-muted hover:text-danger px-1 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100" aria-label="Delete message">
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

function Members({ groupId, me, owner, members, now }: { groupId: string; me: string; owner: boolean; members: GroupMember[]; now: number }) {
  const [, startTransition] = useTransition()
  const online = (m: GroupMember) => !!now && !!m.last_seen && now - Date.parse(m.last_seen) < ONLINE_MS
  const sorted = [...members].sort((a, b) => Number(online(b)) - Number(online(a)) || a.display_name.localeCompare(b.display_name))
  const mine = members.find((m) => m.user_id === me)
  const here = members.filter(online).length

  const saveStatus = (status: string) => {
    if (status === (mine?.status ?? '')) return
    supabase.from('group_members').update({ status: status.slice(0, 80) || null }).eq('group_id', groupId).eq('user_id', me).then(() => {})
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
          <li key={m.user_id} className="flex items-start gap-2.5">
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
              <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={`Remove ${m.display_name} from the group`}
                onClick={() => confirm(`Remove ${m.display_name} from the group?`) && startTransition(async () => { await removeMember(groupId, m.user_id) })}>
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
  const [copied, setCopied] = useState<'' | 'code' | 'link'>('')
  const copy = async (what: 'code' | 'link') => {
    await navigator.clipboard.writeText(what === 'code' ? code : url)
    setCopied(what)
    setTimeout(() => setCopied(''), 1600)
  }
  return (
    <section className="card bg-sky flex flex-col gap-3" aria-labelledby="inv-h">
      <h2 id="inv-h" className="text-lg font-extrabold">Invite friends</h2>
      <p className="font-mono text-3xl font-bold tracking-[0.2em]">{code}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={() => copy('code')}>{copied === 'code' ? <CheckIcon size={14} weight="bold" aria-hidden="true" /> : <CopyIcon size={14} weight="bold" aria-hidden="true" />}{copied === 'code' ? 'Copied' : 'Copy code'}</button>
        <button type="button" className="btn btn-sm" onClick={() => copy('link')}>{copied === 'link' ? <CheckIcon size={14} weight="bold" aria-hidden="true" /> : <LinkSimpleIcon size={14} weight="bold" aria-hidden="true" />}{copied === 'link' ? 'Copied' : 'Copy invite link'}</button>
      </div>
      <p className="text-xs font-bold">The call runs on Jitsi Meet. The first person in may be asked to sign in there to open the room.</p>
    </section>
  )
}

function Manage({ group, owner }: { group: StudyGroup; owner: boolean }) {
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  if (!owner) {
    return (
      <button type="button" className="btn btn-danger self-start" disabled={pending}
        onClick={() => confirm(`Leave ${group.name}?`) && startTransition(async () => { const r = await leaveGroup(group.id); if (r?.error) setError(r.error) })}>
        <SignOutIcon size={16} weight="bold" aria-hidden="true" />Leave group{error && `: ${error}`}
      </button>
    )
  }
  return (
    <details className="card">
      <summary className="font-extrabold cursor-pointer">Group settings</summary>
      <form action={async (fd) => setError((await updateGroup(group.id, fd))?.error ?? '')} className="flex flex-col gap-3 mt-3">
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
        <SubmitButton className="btn btn-primary self-start">Save</SubmitButton>
      </form>
      <button type="button" className="btn btn-danger mt-4" disabled={pending}
        onClick={() => confirm(`Delete ${group.name} for everyone? Chat and shared links go too. This can't be undone.`) && startTransition(async () => { const r = await deleteGroup(group.id); if (r?.error) setError(r.error) })}>
        <TrashIcon size={16} weight="bold" aria-hidden="true" />Delete group
      </button>
    </details>
  )
}
