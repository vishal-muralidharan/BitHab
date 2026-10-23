import { render, screen, act } from '@testing-library/react';
import { ListProvider, useLists } from '../../src/context/ListContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestore from 'firebase/firestore';

function ListConsumer() {
  const { 
    lists, 
    addList, 
    updateList, 
    deleteList, 
    addListItem, 
    toggleListItem, 
    deleteListItem 
  } = useLists();

  return (
    <div>
      <div data-testid="lists-count">{lists.length}</div>
      <ul>
        {lists.map(list => (
          <li key={list.id} data-testid={`list-${list.id}`}>
            <span data-testid={`list-title-${list.id}`}>{list.title}</span>
            <span data-testid={`list-type-${list.id}`}>{list.type}</span>
            <button onClick={() => updateList(list.id, { title: `${list.title} Renamed` })}>Rename List</button>
            <button onClick={() => deleteList(list.id)}>Delete List</button>
            <button onClick={() => addListItem(list.id, 'Apples')}>Add Item</button>

            <ul data-testid={`items-${list.id}`}>
              {list.items.map(item => (
                <li key={item.id} data-testid={`item-${item.id}`}>
                  <span>{item.text}</span>
                  <span data-testid={`item-status-${item.id}`}>{item.completed ? 'checked' : 'unchecked'}</span>
                  <button onClick={() => toggleListItem(list.id, item.id)}>Toggle Item</button>
                  <button onClick={() => deleteListItem(list.id, item.id)}>Delete Item</button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <button onClick={() => addList('Groceries', 'checklist')}>Create Checklist</button>
    </div>
  );
}

describe('ListContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles lists and list items CRUD operations', async () => {
    render(
      <AuthProvider>
        <ListProvider>
          <ListConsumer />
        </ListProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('lists-count')).toHaveTextContent('0');

    // Create list
    await act(async () => {
      screen.getByText('Create Checklist').click();
    });
    expect(screen.getByTestId('lists-count')).toHaveTextContent('1');
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('checklist')).toBeInTheDocument();

    // Rename list
    await act(async () => {
      screen.getByText('Rename List').click();
    });
    expect(screen.getByText('Groceries Renamed')).toBeInTheDocument();

    // Add list item
    await act(async () => {
      screen.getByText('Add Item').click();
    });
    expect(screen.getByText('Apples')).toBeInTheDocument();
    expect(screen.getByText('unchecked')).toBeInTheDocument();

    // Toggle item completion
    await act(async () => {
      screen.getByText('Toggle Item').click();
    });
    expect(screen.getByText('checked')).toBeInTheDocument();

    // Delete item
    await act(async () => {
      screen.getByText('Delete Item').click();
    });
    expect(screen.queryByText('Apples')).not.toBeInTheDocument();

    // Delete list
    await act(async () => {
      screen.getByText('Delete List').click();
    });
    expect(screen.getByTestId('lists-count')).toHaveTextContent('0');
  });

  it('normalizes legacy Firestore lists lacking items array', async () => {
    const rawList = {
      id: 'legacy_list_1',
      title: 'Pack Luggage'
      // items array is missing
    };

    vi.spyOn(firestore, 'getDoc').mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        lists: [rawList]
      })
    });

    render(
      <AuthProvider>
        <ListProvider>
          <ListConsumer />
        </ListProvider>
      </AuthProvider>
    );

    await act(async () => {});

    expect(screen.getByTestId('lists-count')).toHaveTextContent('1');
    expect(screen.getByText('Pack Luggage')).toBeInTheDocument();
  });
});
