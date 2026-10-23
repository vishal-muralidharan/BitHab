import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const ScheduleContext = createContext();

export function useSchedule() {
  return useContext(ScheduleContext);
}

export function ScheduleProvider({ children }) {
  const { currentUser } = useAuth();
  
  // schedules maps dateStr (YYYY-MM-DD) -> array of activityIds
  const [schedules, setSchedules] = useState({});
  // logs maps dateStr (YYYY-MM-DD) -> array of activityIds that were completed
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScheduleData() {
      if (!currentUser) {
        setSchedules({});
        setLogs({});
        setLoading(false);
        return;
      }
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.schedules) setSchedules(data.schedules);
          if (data.logs) setLogs(data.logs);
        }
      } catch (error) {
        console.error("Error loading schedule data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadScheduleData();
  }, [currentUser]);

  async function saveScheduleData(newSchedules, newLogs) {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        schedules: newSchedules,
        logs: newLogs,
        lastUpdated: Date.now()
      }, { merge: true });
      
      setSchedules(newSchedules);
      setLogs(newLogs);
    } catch (error) {
      console.error("Error saving schedule data:", error);
      throw error;
    }
  }

  // Add an activity to a specific date
  function scheduleActivity(activityId, dateStr) {
    const currentDaySchedules = schedules[dateStr] || [];
    if (currentDaySchedules.includes(activityId)) return Promise.resolve(); // Already scheduled
    
    const newSchedules = {
      ...schedules,
      [dateStr]: [...currentDaySchedules, activityId]
    };
    
    return saveScheduleData(newSchedules, logs);
  }

  // Remove an activity from a specific date
  function unscheduleActivity(activityId, dateStr) {
    const currentDaySchedules = schedules[dateStr] || [];
    if (!currentDaySchedules.includes(activityId)) return Promise.resolve();
    
    const newSchedules = {
      ...schedules,
      [dateStr]: currentDaySchedules.filter(id => id !== activityId)
    };
    
    return saveScheduleData(newSchedules, logs);
  }

  // Toggle activity completion for a date
  function toggleActivityLog(activityId, dateStr) {
    const currentDayLogs = logs[dateStr] || [];
    const isCompleted = currentDayLogs.includes(activityId);
    
    let newDayLogs;
    if (isCompleted) {
      newDayLogs = currentDayLogs.filter(id => id !== activityId);
    } else {
      newDayLogs = [...currentDayLogs, activityId];
    }
    
    const newLogs = {
      ...logs,
      [dateStr]: newDayLogs
    };
    
    return saveScheduleData(schedules, newLogs);
  }

  const value = {
    schedules,
    logs,
    loading,
    scheduleActivity,
    unscheduleActivity,
    toggleActivityLog
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}
