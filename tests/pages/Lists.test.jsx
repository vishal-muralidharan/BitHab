import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Lists from '../../src/pages/Lists';
import { ListProvider } from '../../src/context/ListContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Lists Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders lists header, shows empty state, and creates a new checklist', async () => {
    render(
      <MemoryRouter initialEntries={['/lists']}>
        <AuthProvider>
          <ListProvider>
            <Lists />
          </ListProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    expect(screen.getByRole('heading', { level: 1, name: 'Lists' })).toBeInTheDocument();
    expect(screen.getByText('No lists yet')).toBeInTheDocument();

    // Open add list form
    await act(async () => {
      screen.getByRole('button', { name: /New List/i }).click();
    });

    const titleInput = screen.getByPlaceholderText('List Title...');
    fireEvent.change(titleInput, { target: { value: 'Travel Packing' } });

    await act(async () => {
      screen.getByRole('button', { name: 'Create' }).click();
    });

    expect(screen.getByText('Travel Packing')).toBeInTheDocument();
    expect(screen.getByText('Empty list')).toBeInTheDocument();
  });

  it('adds items, checks off items, and deletes items within a list', async () => {
    render(
      <MemoryRouter initialEntries={['/lists']}>
        <AuthProvider>
          <ListProvider>
            <Lists />
          </ListProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    // Create list
    await act(async () => {
      screen.getByRole('button', { name: /New List/i }).click();
    });
    fireEvent.change(screen.getByPlaceholderText('List Title...'), { target: { value: 'Camping Gear' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Create' }).click();
    });

    // Add item
    const addItemInput = screen.getByPlaceholderText('Add an item...');
    fireEvent.change(addItemInput, { target: { value: 'Tent poles' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Add item' }).click();
    });

    expect(screen.getByText('Tent poles')).toBeInTheDocument();

    // Check item
    const itemCheckbox = screen.getByRole('checkbox');
    expect(itemCheckbox.checked).toBe(false);

    await act(async () => {
      itemCheckbox.click();
    });
    expect(itemCheckbox.checked).toBe(true);

    // Delete item
    const deleteItemBtn = screen.getByRole('button', { name: 'Delete item' });
    await act(async () => {
      deleteItemBtn.click();
    });

    expect(screen.queryByText('Tent poles')).not.toBeInTheDocument();
  });

  it('deletes an entire list with confirmation', async () => {
    render(
      <MemoryRouter initialEntries={['/lists']}>
        <AuthProvider>
          <ListProvider>
            <Lists />
          </ListProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    // Create list
    await act(async () => {
      screen.getByRole('button', { name: /New List/i }).click();
    });
    fireEvent.change(screen.getByPlaceholderText('List Title...'), { target: { value: 'Books to Buy' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Create' }).click();
    });

    expect(screen.getByText('Books to Buy')).toBeInTheDocument();

    // Delete list
    const deleteListBtn = screen.getByRole('button', { name: 'Delete list' });
    await act(async () => {
      deleteListBtn.click();
    });

    expect(screen.getByText(/Are you sure you want to delete "Books to Buy"?/i)).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button', { name: 'Yes' }).click();
    });

    expect(screen.queryByText('Books to Buy')).not.toBeInTheDocument();
  });

  it('supports inline list title rename, inline item editing, completed separation, and accessible error alert', async () => {
    const firestore = await import('firebase/firestore');

    render(
      <MemoryRouter initialEntries={['/lists']}>
        <AuthProvider>
          <ListProvider>
            <Lists />
          </ListProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    // Create checklist
    await act(async () => {
      screen.getByRole('button', { name: /New List/i }).click();
    });
    fireEvent.change(screen.getByPlaceholderText('List Title...'), { target: { value: 'Sprint Tasks' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Create' }).click();
    });

    // Rename list inline
    await act(async () => {
      screen.getByRole('button', { name: 'Rename list' }).click();
    });
    const renameInput = screen.getByLabelText('Edit list title');
    fireEvent.change(renameInput, { target: { value: 'Sprint Tasks v2' } });
    await act(async () => {
      fireEvent.submit(renameInput.closest('form'));
    });
    expect(screen.getByText('Sprint Tasks v2')).toBeInTheDocument();

    // Add two items rapidly
    const addItemInput = screen.getByPlaceholderText('Add an item...');
    fireEvent.change(addItemInput, { target: { value: 'First task' } });
    await act(async () => {
      fireEvent.submit(addItemInput.closest('form'));
    });
    fireEvent.change(addItemInput, { target: { value: 'Second task' } });
    await act(async () => {
      fireEvent.submit(addItemInput.closest('form'));
    });

    // Edit first item inline
    const editButtons = screen.getAllByRole('button', { name: 'Edit item' });
    await act(async () => {
      editButtons[0].click();
    });
    const editItemInput = screen.getByLabelText('Edit item text');
    fireEvent.change(editItemInput, { target: { value: 'First task edited' } });
    await act(async () => {
      fireEvent.submit(editItemInput.closest('form'));
    });
    expect(screen.getByText('First task edited')).toBeInTheDocument();

    // Check off first item -> separates into Completed section
    const checkboxes = screen.getAllByRole('checkbox');
    await act(async () => {
      checkboxes[0].click();
    });
    expect(screen.getByText(/Completed \(1\)/i)).toBeInTheDocument();

    // Verify failure shows accessible role="alert" banner and rolls back
    vi.spyOn(firestore, 'setDoc').mockRejectedValueOnce(new Error('Network error'));
    fireEvent.change(addItemInput, { target: { value: 'Failing task' } });
    await act(async () => {
      fireEvent.submit(addItemInput.closest('form'));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Failing task')).not.toBeInTheDocument();
  });
});
