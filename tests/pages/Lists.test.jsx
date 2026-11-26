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

  it('renders lists header, shows empty state, and creates a new checklist card showing heading and summary', async () => {
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
    expect(screen.getByText('Checklist · Empty list')).toBeInTheDocument();
  });

  it('opens list editor popup on click to add, check off, edit, switch types, and delete items', async () => {
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

    // Modal should not be open yet; card shows only heading + summary
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Add an item...')).not.toBeInTheDocument();

    // Click heading card to open popup
    await act(async () => {
      screen.getByRole('button', { name: /Open Camping Gear/i }).click();
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Switch type inside popup
    const numberedBtn = screen.getByRole('button', { name: 'Numbered' });
    await act(async () => {
      numberedBtn.click();
    });
    expect(numberedBtn).toHaveAttribute('aria-pressed', 'true');

    // Switch back to Checklist
    const checklistBtn = screen.getByRole('button', { name: 'Checklist' });
    await act(async () => {
      checklistBtn.click();
    });
    expect(checklistBtn).toHaveAttribute('aria-pressed', 'true');

    // Add item inside popup
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

    // Close popup with Done
    await act(async () => {
      screen.getByRole('button', { name: 'Done' }).click();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deletes an entire list with confirmation from the card', async () => {
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

  it('supports editing title and items inside popup, separated completed items, Escape close, and error alert', async () => {
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

    // Items are not inline in the narrow card grid
    expect(screen.queryByLabelText('Edit list title')).not.toBeInTheDocument();

    // Open popup
    await act(async () => {
      screen.getByRole('button', { name: /Open Sprint Tasks/i }).click();
    });

    // Rename list in popup title input
    const renameInput = screen.getByLabelText('Edit list title');
    fireEvent.change(renameInput, { target: { value: 'Sprint Tasks v2' } });
    await act(async () => {
      fireEvent.submit(renameInput.closest('form'));
    });
    expect(screen.getByText('Sprint Tasks v2')).toBeInTheDocument();

    // Add two items inside popup
    const addItemInput = screen.getByPlaceholderText('Add an item...');
    fireEvent.change(addItemInput, { target: { value: 'First task' } });
    await act(async () => {
      fireEvent.submit(addItemInput.closest('form'));
    });
    fireEvent.change(addItemInput, { target: { value: 'Second task' } });
    await act(async () => {
      fireEvent.submit(addItemInput.closest('form'));
    });

    // Edit first item inline inside popup
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

    // Escape closes the editor popup
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Checklist · 1 left · 1 done')).toBeInTheDocument();
  });
});
