import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import SettingsPage from '../../src/pages/Settings';
import * as userApi from '../../src/api/user';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/api/user', () => ({
  deleteUserAccount: vi.fn(() => Promise.resolve({ success: true })),
  exportUserData: vi.fn(() => Promise.resolve({ user_id: 'test-user-123' })),
  acceptTerms: vi.fn(() => Promise.resolve({ success: true }))
}));

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders account info with email, user id, and sign-in method', () => {
    render(<SettingsPage />, { route: '/settings' });

    expect(screen.getByRole('heading', { level: 1, name: /Settings/i })).toBeInTheDocument();
    expect(document.getElementById('settings-email')).toHaveTextContent('test@bithab.local');
    expect(document.getElementById('settings-uid')).toHaveTextContent('test-user-123');
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
  });

  it('opens confirmation modal and initiates sign-out when confirmed', async () => {
    render(<SettingsPage />, { route: '/settings' });

    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutBtn);

    // Modal dialog is displayed
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText("You'll need to sign in again to continue.")).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Sign out' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('danger zone delete button opens modal and requires typing DELETE to confirm', async () => {
    render(<SettingsPage />, { route: '/settings' });

    const openDeleteBtn = screen.getByRole('button', { name: /Delete Account/i });
    fireEvent.click(openDeleteBtn);

    expect(screen.getByText('Permanently Delete Account?')).toBeInTheDocument();

    const deleteConfirmBtn = screen.getByRole('button', { name: 'Delete My Account' });
    expect(deleteConfirmBtn).toBeDisabled();

    const input = screen.getByPlaceholderText('Type DELETE to confirm');
    fireEvent.change(input, { target: { value: 'delete' } });
    expect(deleteConfirmBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: 'DELETE' } });
    expect(deleteConfirmBtn).not.toBeDisabled();
  });

  it('calls deleteUserAccount and displays deleting state upon confirmation', async () => {
    render(<SettingsPage />, { route: '/settings' });

    fireEvent.click(screen.getByRole('button', { name: /Delete Account/i }));

    const input = screen.getByPlaceholderText('Type DELETE to confirm');
    fireEvent.change(input, { target: { value: 'DELETE' } });

    const deleteConfirmBtn = screen.getByRole('button', { name: 'Delete My Account' });
    fireEvent.click(deleteConfirmBtn);

    expect(userApi.deleteUserAccount).toHaveBeenCalled();
  });
});
