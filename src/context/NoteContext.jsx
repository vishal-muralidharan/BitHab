import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const NoteContext = createContext();

export function useNotes() {
  return useContext(NoteContext);
}

export function NoteProvider({ children }) {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotes() {
      if (!currentUser) {
        setNotes([]);
        setLoading(false);
        return;
      }
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists() && docSnap.data().notes) {
          setNotes(docSnap.data().notes);
        } else {
          setNotes([]);
        }
      } catch (error) {
        console.error("Error loading notes:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadNotes();
  }, [currentUser]);

  async function saveNotes(newNotes) {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        notes: newNotes,
        lastUpdated: Date.now(),
        lastUpdatedBy: 'react_notes_page'
      }, { merge: true });
      
      setNotes(newNotes);
    } catch (error) {
      console.error("Error saving notes:", error);
      throw error;
    }
  }

  function addNote(title, content, type = 'general') {
    const newNote = {
      id: 'note-' + Date.now(),
      title: title || 'Untitled Note',
      content: content || '',
      type: type, // 'general' or 'daily'
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    return saveNotes([...notes, newNote]);
  }

  function updateNote(noteId, updates) {
    const updatedNotes = notes.map(n => {
      if (n.id === noteId) {
        return { ...n, ...updates, updatedAt: Date.now() };
      }
      return n;
    });
    return saveNotes(updatedNotes);
  }

  function toggleFavorite(noteId) {
    const updatedNotes = notes.map(n => {
      if (n.id === noteId) {
        return { ...n, isFavorite: !n.isFavorite, updatedAt: Date.now() };
      }
      return n;
    });
    return saveNotes(updatedNotes);
  }

  function deleteNote(noteId) {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    return saveNotes(updatedNotes);
  }

  const value = {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    saveNotes
  };

  return (
    <NoteContext.Provider value={value}>
      {children}
    </NoteContext.Provider>
  );
}
