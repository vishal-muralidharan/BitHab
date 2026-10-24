import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import DPDPPage from '../../src/pages/DPDP';
import * as userApi from '../../src/api/user';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/api/user', () => ({
  deleteUserAccount: vi.fn(() => Promise.resolve({ success: true })),
  exportUserData: vi.fn(() => Promise.resolve({ user_id: 'test-user-123', profile: {} })),
  acceptTerms: vi.fn(() => Promise.resolve({ success: true }))
}));

describe('DPDP Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all four DPDP sections and back link', () => {
    render(<DPDPPage />, { route: '/dpdp' });

    expect(screen.getByRole('heading', { level: 1, name: /Manage My Data \(DPDP\)/i })).toBeInTheDocument();
    expect(screen.getByText('Back to Settings')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /1\. Data We Process/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /2\. Your Rights under the DPDP Act, 2023/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /3\. Data Management Tools/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /4\. Grievance Redressal/i })).toBeInTheDocument();
  });

  it('download data button calls exportUserData helper', async () => {
    // Mock URL.createObjectURL and revokeObjectURL
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    render(<DPDPPage />, { route: '/dpdp' });

    const downloadBtn = screen.getByRole('button', { name: /Download My Data/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(userApi.exportUserData).toHaveBeenCalled();
    });
  });

  it('verifies required [TODO] and [CONFIRM] markers are present in the DOM', () => {
    render(<DPDPPage />, { route: '/dpdp' });

    expect(screen.getByText(/\[TODO: Insert Grievance Officer Name\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[TODO: Insert Designation/i)).toBeInTheDocument();
    expect(screen.getByText(/\[TODO: Insert Contact Email/i)).toBeInTheDocument();
    expect(screen.getByText(/\[TODO: Insert Registered Address\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[CONFIRM: 30 days response timeframe pursuant to DPDP Act, 2023\]/i)).toBeInTheDocument();
  });
});
