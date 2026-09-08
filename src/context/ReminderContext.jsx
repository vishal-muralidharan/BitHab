import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

  useEffect(() => {
    async function loadReminders() {
      if (!currentUser) {
        setReminders([]);
        setLoading(false);
        return;
      }
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists() && docSnap.data().reminders) {
          setReminders(docSnap.data().reminders);
        } else {
          setReminders([]);
        }
      } catch (error) {
        console.error("Error loading reminders:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadReminders();
  }, [currentUser]);

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

  function addReminder(text, time) {
    const newReminder = {
      id: 'reminder-' + Date.now(),
      text: text,
      time: time || null, // Optional time
      completed: false,
      createdAt: Date.now()
    };
    
    return saveReminders([...reminders, newReminder]);
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
