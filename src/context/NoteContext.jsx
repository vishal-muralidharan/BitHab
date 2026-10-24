import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const NoteContext = createContext();

export function useNotes() {
  return useContext(NoteContext);
}

function normalizeNote(n) {
  const isDaily = n.type === 'daily' || Boolean(n.date && !n.title) || (/^\d{4}-\d{2}-\d{2}$/.test(n.id) && !n.title);
  const dateStr = n.date || (/^\d{4}-\d{2}-\d{2}$/.test(n.id) ? n.id : (isDaily ? new Date().toISOString().split('T')[0] : null));
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
      const fav = typeof noteVal === 'object' ? Boolean(noteVal?.favorite || noteVal?.isFavorite) : false;
      return normalizeNote({
        id: `note_${dateStr}`,
        type: 'daily',
        date: dateStr,
        title: dateStr,
        content,
        favorite: fav
      });
    });
  }
  return [];
}

function mergeNotes(primary, secondary) {
  const map = new Map();
  // Insert secondary source first
  if (Array.isArray(secondary)) {
    secondary.forEach(n => {
      if (!n) return;
      const key = n.type === 'daily' && n.date ? `daily_${n.date}` : n.id;
      map.set(key, n);
    });
  }
  // Overlay primary
  if (Array.isArray(primary)) {
    primary.forEach(n => {
      if (!n) return;
      const key = n.type === 'daily' && n.date ? `daily_${n.date}` : n.id;
      const existing = map.get(key);
      if (existing) {
        const content = n.content && n.content.trim() ? n.content : (existing.content || '');
        const favorite = n.favorite || existing.favorite;
        map.set(key, { ...existing, ...n, content, favorite });
      } else {
        map.set(key, n);
      }
    });
  }
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

    // Helper to read legacy/vanilla subcollections: /users/{userId}/notes and /users/{userId}/generalNotes
    async function fetchSubcollections() {
      const subNotes = [];
      try {
        const dailyCol = collection(db, 'users', currentUser.uid, 'notes');
        const dailySnap = await getDocs(dailyCol);
        if (dailySnap && !dailySnap.empty) {
          dailySnap.forEach(d => {
            const data = d.data() || {};
            const content = data.content || data.note || '';
            const dateStr = data.date || d.id;
            subNotes.push(normalizeNote({
              id: d.id,
              type: 'daily',
              date: dateStr,
              title: dateStr,
              content,
              favorite: data.favorite !== undefined ? Boolean(data.favorite) : Boolean(data.isFavorite),
              createdAt: data.createdAt,
              updatedAt: data.updatedAt
            }));
          });
        }
      } catch (err) {
        console.warn("Error reading daily notes subcollection:", err);
      }

      try {
        const generalCol = collection(db, 'users', currentUser.uid, 'generalNotes');
        const genSnap = await getDocs(generalCol);
        if (genSnap && !genSnap.empty) {
          genSnap.forEach(d => {
            const data = d.data() || {};
            const content = data.content || data.note || '';
            const title = data.title || 'Untitled Note';
            subNotes.push(normalizeNote({
              id: d.id,
              type: 'general',
              title,
              content,
              favorite: data.favorite !== undefined ? Boolean(data.favorite) : Boolean(data.isFavorite),
              createdAt: data.createdAt,
              updatedAt: data.updatedAt
            }));
          });
        }
      } catch (err) {
        console.warn("Error reading general notes subcollection:", err);
      }

      return subNotes;
    }

    // Initial fetch via getDoc and subcollections
    async function initialFetch() {
      try {
        const [docSnap, subNotes] = await Promise.all([
          getDoc(userDocRef),
          fetchSubcollections()
        ]);

        let rootNotes = [];
        if (docSnap && docSnap.exists()) {
          const data = docSnap.data();
          if (data.notes) {
            rootNotes = extractNotes(data.notes);
          }
          if (data.dailyNotes && typeof data.dailyNotes === 'object') {
            rootNotes = mergeNotes(rootNotes, extractNotes(data.dailyNotes));
          }
          if (data.generalNotes && typeof data.generalNotes === 'object') {
            rootNotes = mergeNotes(rootNotes, extractNotes(data.generalNotes));
          }
        }

        if (isMounted) {
          const combined = mergeNotes(rootNotes, subNotes);
          setNotes(prev => {
            const merged = mergeNotes(combined, prev);
            return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
          });
          // If subcollection or legacy notes exist and root doc didn't have them all, sync to root doc
          if (combined.length > 0 && combined.length > rootNotes.length) {
            try {
              const sanitized = combined.map(n => ({
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
              await setDoc(userDocRef, {
                notes: sanitized,
                lastUpdated: Date.now(),
                lastUpdatedBy: 'notes_sync'
              }, { merge: true });
            } catch (syncErr) {
              console.warn("Error syncing merged notes to user doc:", syncErr);
            }
          }
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
      if (!isMounted) return;
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        let parsed = [];
        if (data.notes) {
          parsed = extractNotes(data.notes);
        } else if (data.dailyNotes || data.generalNotes) {
          parsed = mergeNotes(extractNotes(data.dailyNotes || {}), extractNotes(data.generalNotes || {}));
        }
        if (parsed.length > 0) {
          setNotes(prev => {
            const merged = mergeNotes(parsed, prev);
            return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
          });
        }
      }
      setLoading(false);
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

      // Best-effort dual-write to subcollections for full backward compatibility
      for (const note of sanitizedNotes) {
        if (note.type === 'daily' && note.date) {
          try {
            const subRef = doc(db, 'users', currentUser.uid, 'notes', note.date);
            await setDoc(subRef, {
              note: note.content,
              content: note.content,
              date: note.date,
              type: 'daily',
              favorite: Boolean(note.favorite),
              updatedAt: Date.now()
            }, { merge: true });
          } catch {
            // Ignore subcollection write errors
          }
        } else if (note.type === 'general' && note.id) {
          try {
            const subRef = doc(db, 'users', currentUser.uid, 'generalNotes', note.id);
            await setDoc(subRef, {
              title: note.title || 'Untitled Note',
              note: note.content,
              content: note.content,
              type: 'general',
              favorite: Boolean(note.favorite),
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
      title: type === 'general' ? (titleOrDate || 'Untitled Note') : todayStr,
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

    // If deleting a note, also remove from respective subcollection
    if (currentUser && noteToDelete) {
      if (noteToDelete.type === 'daily' && noteToDelete.date) {
        try {
          const subRef = doc(db, 'users', currentUser.uid, 'notes', noteToDelete.date);
          await deleteDoc(subRef);
        } catch {
          // Ignore subcollection delete error
        }
      } else if (noteToDelete.type === 'general' && noteToDelete.id) {
        try {
          const subRef = doc(db, 'users', currentUser.uid, 'generalNotes', noteToDelete.id);
          await deleteDoc(subRef);
        } catch {
          // Ignore subcollection delete error
        }
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
