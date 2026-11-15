import { BellIcon, DeviceMobileIcon } from '@phosphor-icons/react/dist/ssr'
import { Reminders, Install } from './reminders'

export const metadata = { title: 'Settings' }

export default function SettingsPage() {
  return (
    <div className="page max-w-[720px]">
      <header className="mb-6">
        <h1 className="page-title"><span className="hl">Settings</span></h1>
        <p className="page-sub">Reminders and the app on your phone.</p>
      </header>
      <div className="flex flex-col gap-5">
        <section className="card" aria-labelledby="rem-h">
          <h2 id="rem-h" className="text-xl font-extrabold flex items-center gap-2 mb-3"><BellIcon size={22} weight="fill" aria-hidden="true" />Reminders</h2>
          <Reminders />
        </section>
        <section className="card bg-sky" aria-labelledby="inst-h">
          <h2 id="inst-h" className="text-xl font-extrabold flex items-center gap-2 mb-3"><DeviceMobileIcon size={22} weight="fill" aria-hidden="true" />Install</h2>
          <Install />
        </section>
      </div>
    </div>
  )
}
