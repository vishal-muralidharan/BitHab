import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const ReminderContext = createContext();

export function useReminders() {
  return useContext(ReminderContext);
}

export function ReminderProvider({ children }) {
  const { currentUser } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizeReminders = useCallback((rawReminders) => {
    if (!Array.isArray(rawReminders)) return [];
    const todayStr = new Date().toISOString().split('T')[0];
    return rawReminders.map(r => ({
      ...r,
      text: r.text || '',
      date: r.date || todayStr,
      time: r.time || '09:00',
      completed: !!r.completed
    }));
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setReminders([]);
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    let isMounted = true;

    // Initial fetch via getDoc
    async function initialFetch() {
      try {
        const docSnap = await getDoc(userDocRef);
        if (isMounted && docSnap && docSnap.exists() && docSnap.data().reminders) {
          setReminders(normalizeReminders(docSnap.data().reminders));
        }
      } catch (error) {
        console.error("Error loading reminders initial fetch:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    initialFetch();

    // Real-time onSnapshot subscription
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (isMounted && docSnap && docSnap.exists() && docSnap.data().reminders) {
        setReminders(normalizeReminders(docSnap.data().reminders));
      }
      if (isMounted) setLoading(false);
    }, (error) => {
      console.error("Error in ReminderContext onSnapshot listener:", error);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser, normalizeReminders]);

  async function saveReminders(newReminders) {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        reminders: newReminders,
        lastUpdated: Date.now(),
        lastUpdatedBy: 'react_reminders_page'
      }, { merge: true });
      
      setReminders(newReminders);
    } catch (error) {
      console.error("Error saving reminders:", error);
      throw error;
    }
  }

  function addReminder(text, date, time) {
    const today = new Date();
    const defaultDate = date || today.toISOString().split('T')[0];
    const defaultTime = time || '09:00';

    const newReminder = {
      id: 'reminder_' + Date.now(),
      text: text,
      date: defaultDate,
      time: defaultTime,
      completed: false,
      createdAt: Date.now()
    };
    
    return saveReminders([...reminders, newReminder]);
  }

  function editReminder(reminderId, newText, newDate, newTime) {
    const updatedReminders = reminders.map(r => {
      if (r.id === reminderId) {
        return {
          ...r,
          text: newText,
          date: newDate || r.date,
          time: newTime || r.time
        };
      }
      return r;
    });
    return saveReminders(updatedReminders);
  }

  function toggleCompleted(reminderId) {
    const updatedReminders = reminders.map(r => {
      if (r.id === reminderId) {
        return { ...r, completed: !r.completed };
      }
      return r;
    });
    return saveReminders(updatedReminders);
  }

  function deleteReminder(reminderId) {
    const updatedReminders = reminders.filter(r => r.id !== reminderId);
    return saveReminders(updatedReminders);
  }

  const value = {
    reminders,
    loading,
    addReminder,
    editReminder,
    deleteReminder,
    toggleCompleted,
    saveReminders
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
}
