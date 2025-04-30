'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface Note {
  _id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export default function NotesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState({ title: '', content: '' })
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchNotes()
    }
  }, [status])

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes')
      const data = await response.json()
      setNotes(data)
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNote),
      })

      if (response.ok) {
        setNewNote({ title: '', content: '' })
        fetchNotes()
      }
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote) return

    try {
      const response = await fetch(`/api/notes/${editingNote._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingNote.title,
          content: editingNote.content,
        }),
      })

      if (response.ok) {
        setEditingNote(null)
        fetchNotes()
      }
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchNotes()
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  return (
    <div className={styles.container}>
      <h1>Notes</h1>

      {editingNote ? (
        <form onSubmit={handleUpdate} className={styles.noteForm}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Note title"
              value={editingNote.title}
              onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Note content"
              value={editingNote.content}
              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
              className="form-control"
              required
            />
          </div>
          <div className={styles.formActions}>
            <button type="submit" className="btn btn-primary">
              Update Note
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingNote(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className={styles.noteForm}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Note title"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Note content"
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              className="form-control"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Add Note
          </button>
        </form>
      )}

      <div className={styles.notesList}>
        {notes.map((note) => (
          <div key={note._id} className={styles.noteCard}>
            <div className={styles.noteContent}>
              <h3>{note.title}</h3>
              <p>{note.content}</p>
              <p className={styles.noteDate}>
                Last updated: {new Date(note.updatedAt).toLocaleString()}
              </p>
            </div>
            <div className={styles.noteActions}>
              <button
                onClick={() => setEditingNote(note)}
                className="btn btn-primary"
              >
                Edit
              </button>
              <button
                onClick={() => deleteNote(note._id)}
                className="btn btn-secondary"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 