import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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

  const normalizeGoals = useCallback((rawGoals) => {
    if (!Array.isArray(rawGoals)) return [];
    return rawGoals.map(g => ({
      ...g,
      name: g.name || g.title || 'Unnamed Goal',
      title: g.title || g.name || 'Unnamed Goal',
      completed: typeof g.completed === 'boolean' 
        ? g.completed 
        : (g.current !== undefined && g.target !== undefined && g.current >= g.target),
      subgoals: Array.isArray(g.subgoals) ? g.subgoals : []
    }));
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setGoals([]);
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    let isMounted = true;

    // Initial fetch via getDoc (supports tests and immediate cache hits)
    async function initialFetch() {
      try {
        const docSnap = await getDoc(userDocRef);
        if (isMounted && docSnap && docSnap.exists() && docSnap.data().goals) {
          setGoals(normalizeGoals(docSnap.data().goals));
        }
      } catch (error) {
        console.error("Error loading goals initial fetch:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    initialFetch();

    // Real-time onSnapshot subscription for live updates without re-login
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (isMounted && docSnap && docSnap.exists() && docSnap.data().goals) {
        const normalized = normalizeGoals(docSnap.data().goals);
        setGoals(prev => JSON.stringify(prev) === JSON.stringify(normalized) ? prev : normalized);
      }
      if (isMounted) setLoading(false);
    }, (error) => {
      console.error("Error in GoalContext onSnapshot listener:", error);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser, normalizeGoals]);

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

  function addGoal(name) {
    const newGoal = {
      id: 'goal_' + Date.now(),
      name: name,
      title: name,
      completed: false,
      subgoals: [],
      createdAt: Date.now()
    };
    
    return saveGoals([...goals, newGoal]);
  }

  function toggleGoal(goalId) {
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        return { ...g, completed: !g.completed };
      }
      return g;
    });
    return saveGoals(updatedGoals);
  }

  function editGoal(goalId, newName, subgoals = null) {
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          name: newName,
          title: newName,
          subgoals: subgoals !== null ? subgoals : g.subgoals
        };
      }
      return g;
    });
    return saveGoals(updatedGoals);
  }

  function deleteGoal(goalId) {
    const updatedGoals = goals.filter(g => g.id !== goalId);
    return saveGoals(updatedGoals);
  }

  function addSubgoal(goalId, subgoalName) {
    const newSub = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: subgoalName,
      completed: false,
      createdAt: Date.now()
    };
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          subgoals: [...(g.subgoals || []), newSub]
        };
      }
      return g;
    });
    return saveGoals(updatedGoals);
  }

  function toggleSubgoal(goalId, subgoalId) {
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        const updatedSubs = (g.subgoals || []).map(sg => {
          if (sg.id === subgoalId) {
            return { ...sg, completed: !sg.completed };
          }
          return sg;
        });
        return { ...g, subgoals: updatedSubs };
      }
      return g;
    });
    return saveGoals(updatedGoals);
  }

  function editSubgoal(goalId, subgoalId, newName) {
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        const updatedSubs = (g.subgoals || []).map(sg => {
          if (sg.id === subgoalId) {
            return { ...sg, name: newName };
          }
          return sg;
        });
        return { ...g, subgoals: updatedSubs };
      }
      return g;
    });
    return saveGoals(updatedGoals);
  }

  function deleteSubgoal(goalId, subgoalId) {
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        const updatedSubs = (g.subgoals || []).filter(sg => sg.id !== subgoalId);
        return { ...g, subgoals: updatedSubs };
      }
      return g;
    });
    return saveGoals(updatedGoals);
  }

  const value = {
    goals,
    loading,
    addGoal,
    toggleGoal,
    editGoal,
    deleteGoal,
    addSubgoal,
    toggleSubgoal,
    editSubgoal,
    deleteSubgoal,
    saveGoals
  };

  return (
    <GoalContext.Provider value={value}>
      {children}
    </GoalContext.Provider>
  );
}
