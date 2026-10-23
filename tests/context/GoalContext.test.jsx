import { render, screen, act } from '@testing-library/react';
import { GoalProvider, useGoals } from '../../src/context/GoalContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestore from 'firebase/firestore';

function GoalConsumer() {
  const { 
    goals, 
    addGoal, 
    editGoal, 
    deleteGoal,
    toggleGoal,
    addSubgoal,
    toggleSubgoal,
    editSubgoal,
    deleteSubgoal
  } = useGoals();

  return (
    <div>
      <div data-testid="goals-count">{goals.length}</div>
      <ul>
        {goals.map(g => (
          <li key={g.id} data-testid={`goal-${g.id}`}>
            <span data-testid={`goal-name-${g.id}`}>{g.name}</span>
            <span data-testid={`goal-status-${g.id}`}>{g.completed ? 'completed' : 'pending'}</span>
            <button onClick={() => toggleGoal(g.id)}>Toggle Goal</button>
            <button onClick={() => editGoal(g.id, `${g.name} Renamed`)}>Edit Goal</button>
            <button onClick={() => deleteGoal(g.id)}>Delete Goal</button>
            <button onClick={() => addSubgoal(g.id, 'Sub Step 1')}>Add Subgoal</button>
            
            <ul data-testid={`subgoals-${g.id}`}>
              {g.subgoals?.map(sg => (
                <li key={sg.id} data-testid={`subgoal-${sg.id}`}>
                  <span>{sg.name}</span>
                  <span data-testid={`sub-status-${sg.id}`}>{sg.completed ? 'done' : 'open'}</span>
                  <button onClick={() => toggleSubgoal(g.id, sg.id)}>Toggle Sub</button>
                  <button onClick={() => editSubgoal(g.id, sg.id, `${sg.name} Updated`)}>Edit Sub</button>
                  <button onClick={() => deleteSubgoal(g.id, sg.id)}>Delete Sub</button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <button onClick={() => addGoal('Read 20 pages')}>Add Goal</button>
    </div>
  );
}

describe('GoalContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles goal creation, toggling, editing, and deletion', async () => {
    render(
      <AuthProvider>
        <GoalProvider>
          <GoalConsumer />
        </GoalProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('goals-count')).toHaveTextContent('0');

    // Add goal
    await act(async () => {
      screen.getByText('Add Goal').click();
    });
    expect(screen.getByTestId('goals-count')).toHaveTextContent('1');
    expect(screen.getByText('Read 20 pages')).toBeInTheDocument();

    // Toggle goal completion
    await act(async () => {
      screen.getByText('Toggle Goal').click();
    });
    expect(screen.getByText('completed')).toBeInTheDocument();

    // Edit goal
    await act(async () => {
      screen.getByText('Edit Goal').click();
    });
    expect(screen.getByText('Read 20 pages Renamed')).toBeInTheDocument();

    // Add subgoal
    await act(async () => {
      screen.getByText('Add Subgoal').click();
    });
    expect(screen.getByText('Sub Step 1')).toBeInTheDocument();
    expect(screen.getByText('open')).toBeInTheDocument();

    // Toggle subgoal
    await act(async () => {
      screen.getByText('Toggle Sub').click();
    });
    expect(screen.getByText('done')).toBeInTheDocument();

    // Edit subgoal
    await act(async () => {
      screen.getByText('Edit Sub').click();
    });
    expect(screen.getByText('Sub Step 1 Updated')).toBeInTheDocument();

    // Delete subgoal
    await act(async () => {
      screen.getByText('Delete Sub').click();
    });
    expect(screen.queryByText('Sub Step 1 Updated')).not.toBeInTheDocument();

    // Delete goal
    await act(async () => {
      screen.getByText('Delete Goal').click();
    });
    expect(screen.getByTestId('goals-count')).toHaveTextContent('0');
  });

  it('normalizes legacy Firestore schema with title and current/target counts', async () => {
    const legacyGoal = {
      id: 'legacy_1',
      title: 'Legacy Fitness Goal',
      current: 10,
      target: 10,
      subgoals: [{ id: 'sub_legacy', name: 'Morning run' }]
    };

    vi.spyOn(firestore, 'getDoc').mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        goals: [legacyGoal]
      })
    });

    render(
      <AuthProvider>
        <GoalProvider>
          <GoalConsumer />
        </GoalProvider>
      </AuthProvider>
    );

    // Wait for loadGoals effect
    await act(async () => {});

    expect(screen.getByTestId('goals-count')).toHaveTextContent('1');
    expect(screen.getByText('Legacy Fitness Goal')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('Morning run')).toBeInTheDocument();
  });
});
