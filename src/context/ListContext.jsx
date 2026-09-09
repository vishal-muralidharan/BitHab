import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const ListContext = createContext();

export function useLists() {
  return useContext(ListContext);
}

export function ListProvider({ children }) {
  const { currentUser } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLists() {
      if (!currentUser) {
        setLists([]);
        setLoading(false);
        return;
      }
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists() && docSnap.data().lists) {
          setLists(docSnap.data().lists);
        } else {
          setLists([]);
        }
      } catch (error) {
        console.error("Error loading lists:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadLists();
  }, [currentUser]);

  async function saveLists(newLists) {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        lists: newLists,
        lastUpdated: Date.now()
      }, { merge: true });
      
      setLists(newLists);
    } catch (error) {
      console.error("Error saving lists:", error);
      throw error;
    }
  }

  function addList(title) {
    const newList = {
      id: `list-${Date.now()}`,
      title,
      items: [], // Array of { id, text, completed }
      createdAt: Date.now()
    };
    
    return saveLists([...lists, newList]);
  }

  function updateList(id, updatedData) {
    const newLists = lists.map(list => 
      list.id === id ? { ...list, ...updatedData } : list
    );
    return saveLists(newLists);
  }

  function deleteList(id) {
    const newLists = lists.filter(list => list.id !== id);
    return saveLists(newLists);
  }

  // Helper function for list items
  function addListItem(listId, text) {
    const list = lists.find(l => l.id === listId);
    if (!list) return Promise.reject("List not found");
    
    const newItem = {
      id: `item-${Date.now()}`,
      text,
      completed: false
    };
    
    return updateList(listId, { items: [...list.items, newItem] });
  }

  function toggleListItem(listId, itemId) {
    const list = lists.find(l => l.id === listId);
    if (!list) return Promise.reject("List not found");
    
    const newItems = list.items.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    
    return updateList(listId, { items: newItems });
  }

  function deleteListItem(listId, itemId) {
    const list = lists.find(l => l.id === listId);
    if (!list) return Promise.reject("List not found");
    
    const newItems = list.items.filter(item => item.id !== itemId);
    
    return updateList(listId, { items: newItems });
  }

  const value = {
    lists,
    loading,
    addList,
    updateList,
    deleteList,
    addListItem,
    toggleListItem,
    deleteListItem
  };

  return (
    <ListContext.Provider value={value}>
      {children}
    </ListContext.Provider>
  );
}
