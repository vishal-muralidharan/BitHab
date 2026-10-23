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
});
