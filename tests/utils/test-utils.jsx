import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../src/context/AuthContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { ActivityProvider } from '../../src/context/ActivityContext';
import { GoalProvider } from '../../src/context/GoalContext';
import { ReminderProvider } from '../../src/context/ReminderContext';
import { NoteProvider } from '../../src/context/NoteContext';
import { ListProvider } from '../../src/context/ListContext';
import { ScheduleProvider } from '../../src/context/ScheduleContext';

const customRender = (ui, { route = '/', path = '*', ...options } = {}) => {
  const AllTheProviders = ({ children }) => {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <ThemeProvider>
            <ActivityProvider>
              <GoalProvider>
                <ReminderProvider>
                  <NoteProvider>
                    <ListProvider>
                      <ScheduleProvider>
                        <Routes>
                          <Route path={path} element={children} />
                        </Routes>
                      </ScheduleProvider>
                    </ListProvider>
                  </NoteProvider>
                </ReminderProvider>
              </GoalProvider>
            </ActivityProvider>
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override default render
export { customRender as render };
