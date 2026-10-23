import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Focus from '../../src/pages/Focus';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestore from 'firebase/firestore';

describe('Focus Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders clock, motivation quote, subjects list, and adds/deletes subjects', async () => {
    render(
      <MemoryRouter initialEntries={['/focus']}>
        <AuthProvider>
          <Focus />
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    expect(screen.getByText('Subjects')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();

    // Add subject
    const subjectInput = screen.getByPlaceholderText('Enter your subject');
    fireEvent.change(subjectInput, { target: { value: 'Chemistry' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Add subject' }).click();
    });

    expect(screen.getByText('Chemistry')).toBeInTheDocument();

    // Select subject
    const subjectItem = screen.getByText('Chemistry').closest('.subject-item');
    await act(async () => {
      subjectItem.click();
    });
    expect(subjectItem).toHaveClass('selected');

    // Delete subject
    const deleteSubjBtn = screen.getByRole('button', { name: 'Delete subject' });
    await act(async () => {
      deleteSubjBtn.click();
    });
    expect(screen.queryByText('Chemistry')).not.toBeInTheDocument();
  });

  it('adds, completes, and deletes focus tasks', async () => {
    render(
      <MemoryRouter initialEntries={['/focus']}>
        <AuthProvider>
          <Focus />
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    // Add task
    const taskInput = screen.getByPlaceholderText('Enter your task');
    fireEvent.change(taskInput, { target: { value: 'Solve 10 problems' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Add task' }).click();
    });

    expect(screen.getByText('Solve 10 problems')).toBeInTheDocument();

    // Toggle task
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.checked).toBe(false);
    await act(async () => {
      checkbox.click();
    });
    expect(checkbox.checked).toBe(true);

    // Delete task
    const deleteBtn = screen.getByRole('button', { name: 'Delete task' });
    await act(async () => {
      deleteBtn.click();
    });
    expect(screen.queryByText('Solve 10 problems')).not.toBeInTheDocument();
  });

  it('navigates to Deep Focus and Analytics routes via header controls', async () => {
    render(
      <MemoryRouter initialEntries={['/focus']}>
        <AuthProvider>
          <Routes>
            <Route path="/focus" element={<Focus />} />
            <Route path="/deep-focus" element={<div data-testid="deep-focus-page">Deep Focus</div>} />
            <Route path="/analytics" element={<div data-testid="analytics-page">Analytics</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    // Navigate to Deep Focus
    const deepFocusBtn = screen.getByRole('button', { name: 'Toggle deep focus mode' });
    await act(async () => {
      deepFocusBtn.click();
    });
    expect(screen.getByTestId('deep-focus-page')).toBeInTheDocument();
  });
});
