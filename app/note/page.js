'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import { supabase } from '@/utils/supabase' 



export default function NotesPage() {
  const router = useRouter()
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState({ title: '', content: '' })
  const [editingNote, setEditingNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('loading')

  //  useEffect(() => {
  //   const checkUser = async () => {
  //     const { data: { session } } = await supabase.auth.getSession()
  //     if (!session) {
  //       router.push('/login')
  //     } else {
  //       fetchNotes()
  //     }
  //   }
  //   checkUser()
  // }, ) 
   useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }
        await fetchNotes()
      } catch (error) {
        console.error('Error checking session:', error)
        // router.replace('/')
      } finally {
        setStatus(false)
      }
    }

    checkUser()
  }, ) 
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        fetchNotes()
      }
    }
    checkUser()
  }, ) 
const handleSubmit = async (e) => {
  e.preventDefault()
  try {
    setError(null)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('notes')
      .insert({
        title: newNote.title,
        content: newNote.content,
        user_id: session.user.id
      })
      .select()

    if (error) throw error

    setNewNote({ title: '', content: '' })
    await fetchNotes()
  } catch (error) {
    setError('Error creating note. Please try again later.')
    console.error('Error creating note:', error.message)
  }
}

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingNote) return
  
    try {
      setError(null)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('notes')
        .update({
          title: editingNote.title,
          content: editingNote.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingNote.id)
        .eq('user_id', session.user.id)

      if (error) throw error

      setEditingNote(null)
      await fetchNotes()
    } catch (error) {
      setError('Error updating note. Please try again later.')
      console.error('Error updating note:', error)
    }
  }

const deleteNote = async (noteId) => {
   try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', session.user.id)

    if (error) throw error
    await fetchNotes()
  } catch (error) {
    console.error('Error deleting note:', error)
  }
  }

  const fetchNotes = async () => {
    try {
      setError(null)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session')
      }
  
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
  
      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      setError('Error fetching notes. Please try again later.')
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  if (error) {
    return <div className={styles.error}>{error}</div>
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
          <div key={note.id} className={styles.noteCard}> {/* Changed from _id to id */}
            <div className={styles.noteContent}>
              <h3>{note.title}</h3>
              <p>{note.content}</p>
              <p className={styles.noteDate}>
                Last updated: {new Date(note.updated_at).toLocaleString()} {/* Changed from updatedAt to updated_at */}
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
                onClick={() => deleteNote(note.id)} 
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


