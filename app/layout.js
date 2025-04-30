import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'StudyVerse - Your Study Companion',
  description: 'A comprehensive study management platform with task management, notes, pomodoro timer, and GPA calculator',
}

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <>
        <nav className="navbar">
          <div className="container">
            <div className="nav-content">
              <Link href="/" className="logo">StudyVerse</Link>
              <div className="nav-links">
                <Link href="/tasks">Tasks</Link>
                <Link href="/notes">Notes</Link>
                <Link href="/pomodoro">Pomodoro</Link>
                <Link href="/gpa">CGPA Calculator</Link>
                <Link href="/quotes">Daily Quotes</Link>
              </div>
              <div className="auth-buttons">
                <Link href="/login" className="btn btn-secondary">Login</Link>
                <Link href="/register" className="btn btn-primary">Register</Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="container">
          {children}
        </main>
        </>
       </body>
     </html>
  )
} 