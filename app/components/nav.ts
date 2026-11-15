import {
  SquaresFourIcon, ListChecksIcon, NotePencilIcon, TimerIcon, CalendarDotsIcon, GraduationCapIcon, QuotesIcon,
  BooksIcon, PlayCircleIcon, CardsIcon, UserCheckIcon, AlarmIcon, UsersThreeIcon, GearSixIcon, DotsThreeOutlineIcon,
} from '@phosphor-icons/react/dist/ssr'

export type NavLink = { href: string; label: string; Icon: typeof SquaresFourIcon; blurb?: string; tone?: string }

/** One source of truth for navigation: the desktop sidebar, the phone tab bar and the More page. */
export const NAV_SECTIONS: { title: string; links: NavLink[] }[] = [
  {
    title: 'Study',
    links: [
      { href: '/dashboard', label: 'Today', Icon: SquaresFourIcon, blurb: 'Your day at a glance', tone: 'bg-yellow' },
      { href: '/task', label: 'Tasks', Icon: ListChecksIcon, blurb: 'Deadlines and to-dos', tone: 'bg-surface' },
      { href: '/note', label: 'Notes', Icon: NotePencilIcon, blurb: 'Sticky notes for every class', tone: 'bg-pink' },
      { href: '/pomodoro', label: 'Focus', Icon: TimerIcon, blurb: 'Timer, with a lecture beside it', tone: 'bg-orange' },
      { href: '/planner', label: 'Planner', Icon: CalendarDotsIcon, blurb: 'Your week, blocked out', tone: 'bg-sky' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { href: '/subjects', label: 'Subjects', Icon: BooksIcon, blurb: 'Everything for one class', tone: 'bg-mint' },
      { href: '/resources', label: 'Library', Icon: PlayCircleIcon, blurb: 'Videos, links and PDFs', tone: 'bg-surface' },
      { href: '/flashcards', label: 'Flashcards', Icon: CardsIcon, blurb: 'Review before you forget', tone: 'bg-yellow' },
    ],
  },
  {
    title: 'Track',
    links: [
      { href: '/attendance', label: 'Attendance', Icon: UserCheckIcon, blurb: 'Stay above your target', tone: 'bg-sky' },
      { href: '/exams', label: 'Exams', Icon: AlarmIcon, blurb: 'Countdowns and calendar', tone: 'bg-pink' },
      { href: '/gpa', label: 'CGPA', Icon: GraduationCapIcon, blurb: 'Credit-weighted, saved', tone: 'bg-mint' },
    ],
  },
  {
    title: 'Together',
    links: [{ href: '/groups', label: 'Study groups', Icon: UsersThreeIcon, blurb: 'Chat, focus and quiz together', tone: 'bg-orange' }],
  },
  {
    title: 'More',
    links: [
      { href: '/quotes', label: 'Quotes', Icon: QuotesIcon, blurb: 'One good line', tone: 'bg-surface' },
      { href: '/settings', label: 'Settings', Icon: GearSixIcon, blurb: 'Reminders and install', tone: 'bg-surface' },
    ],
  },
]

export const ALL_LINKS = NAV_SECTIONS.flatMap((s) => s.links)

/** Phone tab bar: four favourites plus More. */
export const TAB_LINKS: NavLink[] = [
  ALL_LINKS.find((l) => l.href === '/dashboard')!,
  ALL_LINKS.find((l) => l.href === '/task')!,
  ALL_LINKS.find((l) => l.href === '/pomodoro')!,
  ALL_LINKS.find((l) => l.href === '/groups')!,
  { href: '/more', label: 'More', Icon: DotsThreeOutlineIcon },
]
