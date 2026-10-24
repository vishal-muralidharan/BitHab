import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TermsAgreementModal from '../../src/components/layout/TermsAgreementModal';
import * as authModule from '../../src/context/AuthContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children
}));

describe('TermsAgreementModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when user is authenticated but has not agreed to terms', () => {
    const mockAcceptTerms = vi.fn(() => Promise.resolve());
    vi.mocked(authModule.useAuth).mockReturnValue({
      currentUser: { uid: 'user-unconsented' },
      agreedToTerms: false,
      acceptTerms: mockAcceptTerms
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <TermsAgreementModal />
      </MemoryRouter>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Updated Terms & Privacy Policy/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Terms of Service/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Privacy Policy/i })).toBeInTheDocument();

    const continueBtn = screen.getByRole('button', { name: 'Continue' });
    expect(continueBtn).toBeDisabled();
  });

  it('enables Continue button when checked and invokes acceptTerms', async () => {
    const mockAcceptTerms = vi.fn(() => Promise.resolve());
    vi.mocked(authModule.useAuth).mockReturnValue({
      currentUser: { uid: 'user-unconsented' },
      agreedToTerms: false,
      acceptTerms: mockAcceptTerms
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <TermsAgreementModal />
      </MemoryRouter>
    );

    const checkbox = screen.getByRole('checkbox');
    const continueBtn = screen.getByRole('button', { name: 'Continue' });

    expect(continueBtn).toBeDisabled();
    fireEvent.click(checkbox);
    expect(continueBtn).not.toBeDisabled();

    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(mockAcceptTerms).toHaveBeenCalled();
    });
  });

  it('does not render modal if user already agreed to terms', () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      currentUser: { uid: 'user-consented' },
      agreedToTerms: true,
      acceptTerms: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <TermsAgreementModal />
      </MemoryRouter>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
