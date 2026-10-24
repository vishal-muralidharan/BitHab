import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const NoteContext = createContext();

export function useNotes() {
  return useContext(NoteContext);
}

function normalizeNote(n) {
  const isDaily = n.type === 'daily' || Boolean(n.date && !n.title);
  const dateStr = n.date || (isDaily ? new Date().toISOString().split('T')[0] : null);
  const id = n.id || (dateStr ? `note_${dateStr}` : `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const content = n.content || n.note || '';
  const title = n.title || (isDaily ? (dateStr || 'Daily Note') : 'Untitled Note');
  const fav = n.favorite !== undefined ? Boolean(n.favorite) : Boolean(n.isFavorite);

  return {
    id,
    type: isDaily ? 'daily' : 'general',
    title,
    date: dateStr,
    content,
    favorite: fav,
    isFavorite: fav,
    createdAt: n.createdAt || Date.now(),
    updatedAt: n.updatedAt || Date.now()
  };
}

function extractNotes(rawNotes) {
  if (Array.isArray(rawNotes)) {
    return rawNotes.map(normalizeNote);
  }
  if (typeof rawNotes === 'object' && rawNotes !== null) {
    return Object.entries(rawNotes).map(([dateStr, noteVal]) => {
      const content = typeof noteVal === 'string' ? noteVal : (noteVal?.content || noteVal?.note || '');
      return normalizeNote({
        id: `note_${dateStr}`,
        type: 'daily',
        date: dateStr,
        title: dateStr,
        content
      });
    });
  }
  return [];
}

function mergeNotes(primary, secondary) {
  const map = new Map();
  secondary.forEach(n => {
    const key = n.type === 'daily' && n.date ? `daily_${n.date}` : n.id;
    map.set(key, n);
  });
  primary.forEach(n => {
    const key = n.type === 'daily' && n.date ? `daily_${n.date}` : n.id;
    map.set(key, n);
  });
  return Array.from(map.values());
}

export function NoteProvider({ children }) {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    let isMounted = true;

    // Initial fetch via getDoc
    async function initialFetch() {
      try {
        const docSnap = await getDoc(userDocRef);
        if (isMounted && docSnap && docSnap.exists() && docSnap.data().notes) {
          const parsed = extractNotes(docSnap.data().notes);
          setNotes(prev => mergeNotes(prev, parsed));
        }
      } catch (error) {
        console.error("Error loading notes initial fetch:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    initialFetch();

    // Real-time onSnapshot listener on root user doc
    const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
      if (isMounted && docSnap && docSnap.exists() && docSnap.data().notes) {
        const parsed = extractNotes(docSnap.data().notes);
        setNotes(prev => JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed);
      }
      if (isMounted) setLoading(false);
    }, (error) => {
      console.error("Error in NoteContext onSnapshot listener:", error);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribeDoc === 'function') unsubscribeDoc();
    };
  }, [currentUser]);

  async function saveNotes(newNotes) {
    if (!currentUser) return;
    
    // Sanitize payload to never pass undefined to Firestore (Rule 5)
    const sanitizedNotes = newNotes.map(n => ({
      id: n.id || String(Date.now()),
      type: n.type || 'daily',
      title: n.title ? String(n.title).trim() : '',
      date: n.date || null,
      content: n.content ? String(n.content).trim() : '',
      favorite: Boolean(n.favorite),
      isFavorite: Boolean(n.isFavorite),
      createdAt: n.createdAt || Date.now(),
      updatedAt: Date.now()
    }));

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        notes: sanitizedNotes,
        lastUpdated: Date.now(),
        lastUpdatedBy: 'react_notes_page'
      }, { merge: true });
      
      setNotes(sanitizedNotes);

      // Best-effort dual-write for daily notes to subcollection for legacy compatibility
      for (const note of sanitizedNotes) {
        if (note.type === 'daily' && note.date) {
          try {
            const subRef = doc(db, 'users', currentUser.uid, 'notes', note.date);
            await setDoc(subRef, {
              note: note.content,
              content: note.content,
              date: note.date,
              type: 'daily',
              updatedAt: Date.now()
            }, { merge: true });
          } catch {
            // Ignore subcollection write errors
          }
        }
      }
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

  async function deleteNote(noteId) {
    const noteToDelete = notes.find(n => n.id === noteId);
    const updatedNotes = notes.filter(n => n.id !== noteId);

    // If deleting a daily note, also remove from subcollection
    if (currentUser && noteToDelete && noteToDelete.type === 'daily' && noteToDelete.date) {
      try {
        const subRef = doc(db, 'users', currentUser.uid, 'notes', noteToDelete.date);
        await deleteDoc(subRef);
      } catch {
        // Ignore subcollection delete error
      }
    }

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
