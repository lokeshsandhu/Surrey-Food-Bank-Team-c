import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RegisterPage from './RegisterPage.jsx';
import {
  INELIGIBLE_CANADA_STATUS,
  isEligibleCity,
  isEligibleProvince,
  validateAdultDob,
} from '../utils/registerValidation.js';

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../api/accounts.js', () => ({
  createAccount: vi.fn(),
  usernameExists: vi.fn().mockResolvedValue({ exists: false }),
}));

vi.mock('../../api/auth.js', () => ({
  login: vi.fn(),
  me: vi.fn(),
}));

vi.mock('../../api/familyMembers.js', () => ({
  createFamilyMember: vi.fn(),
}));

function renderRegisterPage() {
  return render(
    <MantineProvider>
      <RegisterPage />
    </MantineProvider>,
  );
}

describe('registerValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('requires a date of birth', () => {
    expect(validateAdultDob(null)).toBe('Please enter your date of birth.');
  });

  it('rejects users younger than 18', () => {
    expect(validateAdultDob('2008-03-25')).toBe('You must be at least 18 years old to register.');
  });

  it('accepts users who are already 18', () => {
    expect(validateAdultDob('2008-03-24')).toBeNull();
  });

  it('accepts only supported Surrey-area cities', () => {
    expect(isEligibleCity('Surrey')).toBe(true);
    expect(isEligibleCity('north delta')).toBe(true);
    expect(isEligibleCity('Vancouver')).toBe(false);
  });

  it('accepts only British Columbia as the eligible province', () => {
    expect(isEligibleProvince('BC')).toBe(true);
    expect(isEligibleProvince('bc')).toBe(true);
    expect(isEligibleProvince('AB')).toBe(false);
  });

  it('keeps the ineligible immigration status string centralized', () => {
    expect(INELIGIBLE_CANADA_STATUS).toContain('less than 6 months in Canada');
  });
});

describe('RegisterPage eligibility warnings', () => {
  it('shows an alert for an ineligible immigration status', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.click(
      screen.getByLabelText(/visitor or international student with less than 6 months in canada/i),
    );

    expect(
      screen.getByText(/you may not be eligible for this program/i),
    ).toBeInTheDocument();
  });

  it('shows the location reminder when the city is outside the eligible area', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByPlaceholderText(/e\.g\. surrey/i), 'Vancouver');
    await user.tab();

    expect(
      screen.getByText(/clients must reside within surrey, north delta, or cloverdale/i),
    ).toBeInTheDocument();
  });
});
