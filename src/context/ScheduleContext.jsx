import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
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
    if (!currentUser) {
      setSchedules({});
      setLogs({});
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    let isMounted = true;

    // Initial fetch via getDoc with subcollection compatibility fallback
    async function initialFetch() {
      try {
        const docSnap = await getDoc(userDocRef);
        if (isMounted && docSnap && docSnap.exists()) {
          const data = docSnap.data();
          if (data.schedules && typeof data.schedules === 'object') setSchedules(data.schedules);
          let userLogs = (data.logs && typeof data.logs === 'object') ? data.logs : {};

          // Legacy subcollection fallback if top-level logs is empty
          if (Object.keys(userLogs).length === 0) {
            try {
              const logsCol = collection(db, 'users', currentUser.uid, 'logs');
              const subSnap = await getDocs(logsCol);
              if (!subSnap.empty) {
                const subLogs = {};
                subSnap.forEach(subDoc => {
                  const subData = subDoc.data();
                  if (Array.isArray(subData.loggedSubActivityIds)) {
                    subLogs[subDoc.id] = subData.loggedSubActivityIds;
                  }
                });
                if (Object.keys(subLogs).length > 0) {
                  userLogs = subLogs;
                  await setDoc(userDocRef, { logs: subLogs }, { merge: true });
                }
              }
            } catch (err) {
              console.warn("Subcollection logs fallback check error:", err);
            }
          }

          if (isMounted) setLogs(userLogs);
        }
      } catch (error) {
        console.error("Error loading schedule data initial fetch:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    initialFetch();

    // Real-time onSnapshot subscription
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (isMounted && docSnap && docSnap.exists()) {
        const data = docSnap.data();
        if (data.schedules && typeof data.schedules === 'object') {
          setSchedules(prev => JSON.stringify(prev) === JSON.stringify(data.schedules) ? prev : data.schedules);
        }
        if (data.logs && typeof data.logs === 'object') {
          setLogs(prev => JSON.stringify(prev) === JSON.stringify(data.logs) ? prev : data.logs);
        }
      }
      if (isMounted) setLoading(false);
    }, (error) => {
      console.error("Error in ScheduleContext onSnapshot listener:", error);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser]);

  async function saveScheduleData(newSchedules, newLogs, updatedDateStr, newDayLogs) {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        schedules: newSchedules,
        logs: newLogs,
        lastUpdated: Date.now()
      }, { merge: true });

      // Synchronize with legacy logs subcollection for backward compatibility
      if (updatedDateStr && Array.isArray(newDayLogs)) {
        try {
          const subLogRef = doc(db, 'users', currentUser.uid, 'logs', updatedDateStr);
          await setDoc(subLogRef, {
            loggedSubActivityIds: newDayLogs,
            lastUpdated: Date.now()
          }, { merge: true });
        } catch {
          // Gracefully continue
        }
      }
      
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
    
    return saveScheduleData(schedules, newLogs, dateStr, newDayLogs);
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
