// 'use client'
import './globals.css'
import { Inter } from 'next/font/google'
import Navigation from './components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'StudyVerse',
  description: 'A comprehensive study management platform with task management, notes, pomodoro timer, and GPA calculator',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  )
}