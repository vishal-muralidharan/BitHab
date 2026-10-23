import { render, screen, act } from '@testing-library/react';
import { NoteProvider, useNotes } from '../../src/context/NoteContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestore from 'firebase/firestore';

function NoteConsumer() {
  const { 
    notes, 
    addNote, 
    updateNote, 
    deleteNote, 
    toggleFavorite 
  } = useNotes();

  return (
    <div>
      <div data-testid="notes-count">{notes.length}</div>
      <ul>
        {notes.map(n => (
          <li key={n.id} data-testid={`note-${n.id}`}>
            <span data-testid={`note-title-${n.id}`}>{n.title}</span>
            <span data-testid={`note-content-${n.id}`}>{n.content}</span>
            <span data-testid={`note-type-${n.id}`}>{n.type}</span>
            <span data-testid={`note-fav-${n.id}`}>{n.favorite ? 'starred' : 'unstarred'}</span>
            <button onClick={() => toggleFavorite(n.id)}>Toggle Star</button>
            <button onClick={() => updateNote(n.id, { content: 'Updated Note Content' })}>Update Content</button>
            <button onClick={() => deleteNote(n.id)}>Delete Note</button>
          </li>
        ))}
      </ul>
      <button onClick={() => addNote('Ideas for Project', 'Build clean tests', 'general')}>Add General Note</button>
      <button onClick={() => addNote('2026-10-23', 'Daily standup notes', 'daily')}>Add Daily Note</button>
    </div>
  );
}

describe('NoteContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('manages notes lifecycle: daily vs general notes, editing, starring, and deletion', async () => {
    render(
      <AuthProvider>
        <NoteProvider>
          <NoteConsumer />
        </NoteProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('notes-count')).toHaveTextContent('0');

    // Add general note
    await act(async () => {
      screen.getByText('Add General Note').click();
    });
    expect(screen.getByTestId('notes-count')).toHaveTextContent('1');
    expect(screen.getByText('Ideas for Project')).toBeInTheDocument();
    expect(screen.getByText('Build clean tests')).toBeInTheDocument();
    expect(screen.getByText('general')).toBeInTheDocument();
    expect(screen.getByText('unstarred')).toBeInTheDocument();

    // Toggle favorite
    await act(async () => {
      screen.getByText('Toggle Star').click();
    });
    expect(screen.getByText('starred')).toBeInTheDocument();

    // Update note content
    await act(async () => {
      screen.getByText('Update Content').click();
    });
    expect(screen.getByText('Updated Note Content')).toBeInTheDocument();

    // Add daily note
    await act(async () => {
      screen.getByText('Add Daily Note').click();
    });
    expect(screen.getByTestId('notes-count')).toHaveTextContent('2');
    expect(screen.getByText('Daily standup notes')).toBeInTheDocument();

    // Delete note
    await act(async () => {
      screen.getAllByText('Delete Note')[0].click();
    });
    expect(screen.getByTestId('notes-count')).toHaveTextContent('1');
  });

  it('normalizes legacy notes with legacy "note" field and "isFavorite" boolean', async () => {
    const legacyNote = {
      id: 'legacy_note_1',
      title: 'Old Journal',
      note: 'Ancient thoughts from 2025',
      isFavorite: true,
      type: 'daily'
    };

    vi.spyOn(firestore, 'getDoc').mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        notes: [legacyNote]
      })
    });

    render(
      <AuthProvider>
        <NoteProvider>
          <NoteConsumer />
        </NoteProvider>
      </AuthProvider>
    );

    await act(async () => {});

    expect(screen.getByTestId('notes-count')).toHaveTextContent('1');
    expect(screen.getByText('Old Journal')).toBeInTheDocument();
    expect(screen.getByText('Ancient thoughts from 2025')).toBeInTheDocument();
    expect(screen.getByText('starred')).toBeInTheDocument();
  });
});
