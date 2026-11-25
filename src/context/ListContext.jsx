import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const ListContext = createContext();

export function useLists() {
  return useContext(ListContext);
}

function createUniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function sanitizeLists(rawLists) {
  if (!Array.isArray(rawLists)) return [];
  return rawLists
    .filter(list => list && typeof list === 'object')
    .map(list => ({
      id: list.id || createUniqueId('list'),
      title: list.title || 'Untitled List',
      type: list.type || 'checklist',
      createdAt: typeof list.createdAt === 'number' ? list.createdAt : Date.now(),
      items: Array.isArray(list.items)
        ? list.items
            .filter(item => item && typeof item === 'object')
            .map(item => ({
              id: item.id || createUniqueId('item'),
              text: typeof item.text === 'string' ? item.text : String(item.text ?? ''),
              completed: Boolean(item.completed)
            }))
        : []
    }));
}

export function ListProvider({ children }) {
  const { currentUser } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const listsRef = useRef([]);
  const writeChainRef = useRef(Promise.resolve());
  const mutationSeqRef = useRef(0);
  const pendingWritesRef = useRef(0);

  const normalizeLists = useCallback((rawLists) => {
    return sanitizeLists(rawLists);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      listsRef.current = [];
      setLists([]);
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    let isMounted = true;

    async function initialFetch() {
      try {
        const docSnap = await getDoc(userDocRef);
        if (isMounted && pendingWritesRef.current === 0 && docSnap && docSnap.exists() && docSnap.data().lists) {
          const normalized = normalizeLists(docSnap.data().lists);
          listsRef.current = normalized;
          setLists(normalized);
        }
      } catch (error) {
        console.error('Error loading lists initial fetch:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    initialFetch();

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (isMounted && pendingWritesRef.current === 0 && docSnap && docSnap.exists() && docSnap.data().lists) {
        const normalized = normalizeLists(docSnap.data().lists);
        listsRef.current = normalized;
        setLists(prev => JSON.stringify(prev) === JSON.stringify(normalized) ? prev : normalized);
      }
      if (isMounted) setLoading(false);
    }, (error) => {
      console.error('Error in ListContext onSnapshot listener:', error);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser, normalizeLists]);

  function commitListsUpdate(updater) {
    const prevLists = listsRef.current;
    const nextLists = sanitizeLists(updater(prevLists));
    const seq = ++mutationSeqRef.current;

    listsRef.current = nextLists;
    setLists(nextLists);

    if (!currentUser) return Promise.resolve();

    const userDocRef = doc(db, 'users', currentUser.uid);
    pendingWritesRef.current += 1;

    const writePromise = writeChainRef.current
      .catch(() => {})
      .then(async () => {
        await setDoc(userDocRef, {
          lists: nextLists,
          lastUpdated: Date.now()
        }, { merge: true });
      })
      .catch((error) => {
        if (mutationSeqRef.current === seq) {
          listsRef.current = prevLists;
          setLists(prevLists);
        }
        console.error('Error saving lists:', error);
        throw error;
      })
      .finally(() => {
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
      });

    writeChainRef.current = writePromise;
    return writePromise;
  }

  function saveLists(newLists) {
    return commitListsUpdate(() => newLists);
  }

  function addList(title, type = 'checklist') {
    const newList = {
      id: createUniqueId('list'),
      title,
      type: type || 'checklist',
      items: [],
      createdAt: Date.now()
    };

    return commitListsUpdate(prev => [...prev, newList]);
  }

  function updateList(id, updatedData) {
    return commitListsUpdate(prev =>
      prev.map(list => (list.id === id ? { ...list, ...updatedData } : list))
    );
  }

  function deleteList(id) {
    return commitListsUpdate(prev => prev.filter(list => list.id !== id));
  }

  function addListItem(listId, text) {
    const listExists = listsRef.current.some(l => l.id === listId);
    if (!listExists) return Promise.reject(new Error('List not found'));

    const newItem = {
      id: createUniqueId('item'),
      text,
      completed: false
    };

    return commitListsUpdate(prev =>
      prev.map(l => (l.id === listId ? { ...l, items: [...l.items, newItem] } : l))
    );
  }

  function updateListItem(listId, itemId, updates) {
    const listExists = listsRef.current.some(l => l.id === listId);
    if (!listExists) return Promise.reject(new Error('List not found'));

    return commitListsUpdate(prev =>
      prev.map(l => {
        if (l.id !== listId) return l;
        return {
          ...l,
          items: l.items.map(item => (item.id === itemId ? { ...item, ...updates } : item))
        };
      })
    );
  }

  function toggleListItem(listId, itemId) {
    const listExists = listsRef.current.some(l => l.id === listId);
    if (!listExists) return Promise.reject(new Error('List not found'));

    return commitListsUpdate(prev =>
      prev.map(l => {
        if (l.id !== listId) return l;
        return {
          ...l,
          items: l.items.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          )
        };
      })
    );
  }

  function deleteListItem(listId, itemId) {
    const listExists = listsRef.current.some(l => l.id === listId);
    if (!listExists) return Promise.reject(new Error('List not found'));

    return commitListsUpdate(prev =>
      prev.map(l => {
        if (l.id !== listId) return l;
        return {
          ...l,
          items: l.items.filter(item => item.id !== itemId)
        };
      })
    );
  }

  const value = {
    lists,
    loading,
    addList,
    updateList,
    deleteList,
    addListItem,
    updateListItem,
    toggleListItem,
    deleteListItem,
    saveLists
  };

  return (
    <ListContext.Provider value={value}>
      {children}
    </ListContext.Provider>
  );
}
