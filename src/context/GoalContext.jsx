import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const GoalContext = createContext();

export function useGoals() {
  return useContext(GoalContext);
}

export function GoalProvider({ children }) {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGoals() {
      if (!currentUser) {
        setGoals([]);
        setLoading(false);
        return;
      }
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists() && docSnap.data().goals) {
          setGoals(docSnap.data().goals);
        } else {
          setGoals([]);
        }
      } catch (error) {
        console.error("Error loading goals:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadGoals();
  }, [currentUser]);

  async function saveGoals(newGoals) {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        goals: newGoals,
        lastUpdated: Date.now(),
        lastUpdatedBy: 'react_goals_page'
      }, { merge: true });
      
      setGoals(newGoals);
    } catch (error) {
      console.error("Error saving goals:", error);
      throw error;
    }
  }

  function addGoal(title) {
    const newGoal = {
      id: 'goal-' + Date.now(),
      title: title,
      target: 0,
      current: 0,
      createdAt: Date.now()
    };
    
    return saveGoals([...goals, newGoal]);
  }

  function deleteGoal(goalId) {
    const updatedGoals = goals.filter(g => g.id !== goalId);
    return saveGoals(updatedGoals);
  }

  const value = {
    goals,
    loading,
    addGoal,
    deleteGoal,
    saveGoals
  };

  return (
    <GoalContext.Provider value={value}>
      {children}
    </GoalContext.Provider>
  );
}
