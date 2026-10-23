import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const ActivityContext = createContext();

export function useActivities() {
  return useContext(ActivityContext);
}

export function ActivityProvider({ children }) {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [focusLogs, setFocusLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load activities from Firebase
  useEffect(() => {
    async function loadActivities() {
      if (!currentUser) {
        setActivities([]);
        setLoading(false);
        return;
      }
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.activities) setActivities(data.activities);
          if (data.focusLogs) setFocusLogs(data.focusLogs);
        } else {
          setActivities([]);
          setFocusLogs([]);
        }
      } catch (error) {
        console.error("Error loading activities:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadActivities();
  }, [currentUser]);

  // Save activities to Firebase
  async function saveActivities(newActivities) {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        activities: newActivities,
        lastUpdated: Date.now()
      }, { merge: true });
      
      setActivities(newActivities);
    } catch (error) {
      console.error("Error saving activities:", error);
      throw error;
    }
  }

  // Save focus logs to Firebase
  async function logFocusSession(activityId, durationInSeconds) {
    if (!currentUser) return;
    
    const newLog = {
      id: `focus-${Date.now()}`,
      activityId,
      duration: durationInSeconds,
      timestamp: Date.now()
    };
    
    const newFocusLogs = [...focusLogs, newLog];
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        focusLogs: newFocusLogs,
        lastUpdated: Date.now()
      }, { merge: true });
      
      setFocusLogs(newFocusLogs);
    } catch (error) {
      console.error("Error saving focus log:", error);
      throw error;
    }
  }

  function addActivity(name) {
    const newActivity = {
      id: 'activity-' + Date.now(),
      name: name,
      subActivities: [],
      createdAt: Date.now()
    };
    
    return saveActivities([...activities, newActivity]);
  }

  function editActivity(activityId, newName) {
    const updatedActivities = activities.map(a => 
      a.id === activityId ? { ...a, name: newName } : a
    );
    return saveActivities(updatedActivities);
  }

  function deleteActivity(activityId) {
    const updatedActivities = activities.filter(a => a.id !== activityId);
    return saveActivities(updatedActivities);
  }

  function addSubActivity(activityId, name, color = '#3B82F6') {
    const newSub = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      color: color || '#3B82F6'
    };
    const updatedActivities = activities.map(a => {
      if (a.id === activityId) {
        return {
          ...a,
          subActivities: [...(a.subActivities || []), newSub]
        };
      }
      return a;
    });
    return saveActivities(updatedActivities);
  }

  function editSubActivity(activityId, subId, newName, newColor) {
    const updatedActivities = activities.map(a => {
      if (a.id === activityId) {
        return {
          ...a,
          subActivities: (a.subActivities || []).map(sub => 
            sub.id === subId ? { ...sub, name: newName, color: newColor || sub.color } : sub
          )
        };
      }
      return a;
    });
    return saveActivities(updatedActivities);
  }

  function deleteSubActivity(activityId, subId) {
    const updatedActivities = activities.map(a => {
      if (a.id === activityId) {
        return {
          ...a,
          subActivities: (a.subActivities || []).filter(sub => sub.id !== subId)
        };
      }
      return a;
    });
    return saveActivities(updatedActivities);
  }

  const value = {
    activities,
    focusLogs,
    loading,
    addActivity,
    editActivity,
    deleteActivity,
    addSubActivity,
    editSubActivity,
    deleteSubActivity,
    saveActivities,
    logFocusSession
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}
