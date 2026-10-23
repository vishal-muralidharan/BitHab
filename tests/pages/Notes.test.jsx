import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Notes from '../../src/pages/Notes';
import { NoteProvider } from '../../src/context/NoteContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Notes Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notes page, creates a daily note, and edits note content', async () => {
    render(
      <MemoryRouter initialEntries={['/notes']}>
        <AuthProvider>
          <NoteProvider>
            <Notes />
          </NoteProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    expect(screen.getByRole('heading', { level: 1, name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByText('No daily notes yet. Click "New Note" to create one')).toBeInTheDocument();

    // Create daily note
    await act(async () => {
      screen.getByRole('button', { name: /New Note/i }).click();
    });

    const textarea = screen.getByPlaceholderText('Write your note here');
    expect(textarea).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Finished daily goals and reviewed tasks' } });
    });
    expect(textarea.value).toBe('Finished daily goals and reviewed tasks');
  });

  it('switches between Daily and General notes tabs and filters favorites', async () => {
    render(
      <MemoryRouter initialEntries={['/notes']}>
        <AuthProvider>
          <NoteProvider>
            <Notes />
          </NoteProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    // Switch to General tab
    const generalTab = screen.getByRole('button', { name: /General/i });
    await act(async () => {
      generalTab.click();
    });

    expect(screen.getByText('No general notes yet. Click "New Note" to create one')).toBeInTheDocument();

    // Create a general note
    await act(async () => {
      screen.getByRole('button', { name: /New Note/i }).click();
    });

    const titleInput = screen.getByDisplayValue('Untitled Note');
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Project Roadmap' } });
    });

    // Star/Favorite note
    const favBtn = screen.getByTitle('Toggle favorite');
    await act(async () => {
      favBtn.click();
    });

    // Filter by Favorites
    const favoritesFilter = screen.getByRole('button', { name: /Favorites/i });
    await act(async () => {
      favoritesFilter.click();
    });

    expect(screen.getByDisplayValue('Project Roadmap')).toBeInTheDocument();
  });

  it('deletes note with confirmation modal', async () => {
    render(
      <MemoryRouter initialEntries={['/notes']}>
        <AuthProvider>
          <NoteProvider>
            <Notes />
          </NoteProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    // Add note
    await act(async () => {
      screen.getByRole('button', { name: /New Note/i }).click();
    });

    const deleteBtn = screen.getByTitle('Delete note');
    await act(async () => {
      deleteBtn.click();
    });

    expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button', { name: 'Yes' }).click();
    });

    expect(screen.queryByPlaceholderText('Write your note here')).not.toBeInTheDocument();
  });
});
