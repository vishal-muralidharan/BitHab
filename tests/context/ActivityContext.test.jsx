import { render, screen, act } from '@testing-library/react';
import { ActivityProvider, useActivities } from '../../src/context/ActivityContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

function ActivityConsumer() {
  const { 
    activities, 
    addActivity, 
    editActivity, 
    deleteActivity,
    addSubActivity,
    editSubActivity,
    deleteSubActivity
  } = useActivities();

  return (
    <div>
      <div data-testid="count">{activities.length}</div>
      <ul>
        {activities.map(a => (
          <li key={a.id} data-testid={`activity-${a.id}`}>
            <span>{a.name}</span>
            <span data-testid={`sub-count-${a.id}`}>{a.subActivities?.length || 0}</span>
            <button onClick={() => editActivity(a.id, `${a.name} Updated`)}>Edit Act</button>
            <button onClick={() => deleteActivity(a.id)}>Delete Act</button>
            <button onClick={() => addSubActivity(a.id, 'Sub 1', '#ff0000')}>Add Sub</button>
            {a.subActivities?.map(sub => (
              <div key={sub.id} data-testid={`sub-${sub.id}`}>
                <span>{sub.name}</span>
                <button onClick={() => editSubActivity(a.id, sub.id, `${sub.name} Edited`, '#00ff00')}>Edit Sub</button>
                <button onClick={() => deleteSubActivity(a.id, sub.id)}>Delete Sub</button>
              </div>
            ))}
          </li>
        ))}
      </ul>
      <button onClick={() => addActivity('Exercise')}>Add Exercise</button>
    </div>
  );
}

describe('ActivityContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('manages activities and subactivities lifecycle', async () => {
    render(
      <AuthProvider>
        <ActivityProvider>
          <ActivityConsumer />
        </ActivityProvider>
      </AuthProvider>
    );

    // Initial count
    expect(screen.getByTestId('count')).toHaveTextContent('0');

    // Add activity
    await act(async () => {
      screen.getByText('Add Exercise').click();
    });
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByText('Exercise')).toBeInTheDocument();

    // Edit activity
    await act(async () => {
      screen.getByText('Edit Act').click();
    });
    expect(screen.getByText('Exercise Updated')).toBeInTheDocument();

    // Add subactivity
    await act(async () => {
      screen.getByText('Add Sub').click();
    });
    expect(screen.getByText('Sub 1')).toBeInTheDocument();

    // Edit subactivity
    await act(async () => {
      screen.getByText('Edit Sub').click();
    });
    expect(screen.getByText('Sub 1 Edited')).toBeInTheDocument();

    // Delete subactivity
    await act(async () => {
      screen.getByText('Delete Sub').click();
    });
    expect(screen.queryByText('Sub 1 Edited')).not.toBeInTheDocument();

    // Delete activity
    await act(async () => {
      screen.getByText('Delete Act').click();
    });
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
