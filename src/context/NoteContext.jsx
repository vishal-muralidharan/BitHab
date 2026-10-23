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
          const rawNotes = docSnap.data().notes || [];
          const normalized = rawNotes.map(n => ({
            ...n,
            title: n.title || (n.type === 'daily' ? n.date : 'Untitled'),
            date: n.date || (n.type === 'daily' ? new Date().toISOString().split('T')[0] : null),
            content: n.content || n.note || '',
            type: n.type || 'daily',
            favorite: n.favorite !== undefined ? !!n.favorite : !!n.isFavorite,
            isFavorite: n.favorite !== undefined ? !!n.favorite : !!n.isFavorite,
            updatedAt: n.updatedAt || Date.now()
          }));
          setNotes(normalized);
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

  function addNote(titleOrDate, content = '', type = 'daily') {
    const todayStr = new Date().toISOString().split('T')[0];
    const newNote = {
      id: 'note_' + Date.now(),
      type: type,
      title: type === 'general' ? (titleOrDate || 'Untitled') : todayStr,
      date: type === 'daily' ? (titleOrDate || todayStr) : null,
      content: content || '',
      favorite: false,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    return saveNotes([newNote, ...notes]);
  }

  function updateNote(noteId, updates) {
    const updatedNotes = notes.map(n => {
      if (n.id === noteId) {
        return { 
          ...n, 
          ...updates, 
          favorite: updates.favorite !== undefined ? updates.favorite : (updates.isFavorite !== undefined ? updates.isFavorite : n.favorite),
          isFavorite: updates.favorite !== undefined ? updates.favorite : (updates.isFavorite !== undefined ? updates.isFavorite : n.isFavorite),
          updatedAt: Date.now() 
        };
      }
      return n;
    });
    return saveNotes(updatedNotes);
  }

  function toggleFavorite(noteId) {
    const updatedNotes = notes.map(n => {
      if (n.id === noteId) {
        const nextFav = !n.favorite;
        return { ...n, favorite: nextFav, isFavorite: nextFav, updatedAt: Date.now() };
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
