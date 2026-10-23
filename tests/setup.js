import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock DOM globals
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const localStorageMock = (function () {
  let store = {};
  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Global Firebase Mocks
vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    onAuthStateChanged: vi.fn((auth, cb) => {
      // Provide mock user by default
      cb({ uid: 'test-user-123', email: 'test@bithab.local' });
      return vi.fn(); // unsubscribe mock
    }),
    signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: 'test-user-123' } })),
    createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: 'test-user-123' } })),
    signOut: vi.fn(() => Promise.resolve()),
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn(() => Promise.resolve({ user: { uid: 'test-user-123' } })),
  };
});

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    doc: vi.fn((db, coll, id) => ({ id, path: `${coll}/${id}` })),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
    onSnapshot: vi.fn((ref, callback) => {
      callback({ exists: () => true, data: () => ({}) });
      return vi.fn();
    }),
    setDoc: vi.fn(() => Promise.resolve()),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
    collection: vi.fn((_db, ...pathSegments) => ({ path: pathSegments.join('/') })),
    query: vi.fn((coll) => coll),
    where: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true, forEach: vi.fn() })),
  };
});

vi.mock('../src/config/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-123', email: 'test@bithab.local' } },
}));
