import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import RegisterPage from './RegisterPage.jsx';

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

async function selectProvince(user, province) {
  await user.click(screen.getByPlaceholderText(/select province/i));
  const option = screen
    .getAllByRole('option', { hidden: true })
    .find((node) => node.textContent?.trim() === province);

  if (!option) {
    throw new Error(`Province option not found: ${province}`);
  }

  fireEvent.click(option);
}

async function completeEligibilityStep(user, overrides = {}) {
  const {
    canadaStatus = 'Canadian Citizen',
    line1 = '13478 78th Ave',
    city = 'Surrey',
    province = 'BC',
    postalCode = 'V1M 3B5',
  } = overrides;

  if (canadaStatus) {
    await user.click(screen.getByLabelText(new RegExp(canadaStatus, 'i')));
  }

  await user.type(screen.getByLabelText(/address line 1/i), line1);
  await user.type(screen.getByPlaceholderText(/e\.g\. surrey/i), city);
  await selectProvince(user, province);
  await user.type(screen.getByLabelText(/postal code/i), postalCode);
  await user.click(screen.getByRole('button', { name: /^next$/i }));
  await screen.findByText(/account information/i);
}

async function completeAccountInfoWithoutDob(user, overrides = {}) {
  const {
    username = 'john123',
    password = 'StrongP@ss1',
    firstName = 'Alex',
    lastName = 'Doe',
    email = 'alex@example.com',
    phone = '6045551234',
    language = 'English',
  } = overrides;

  await user.type(screen.getByPlaceholderText(/e\.g\. john123/i), username);
  await user.type(screen.getByPlaceholderText(/^enter password$/i), password);
  await user.type(screen.getByPlaceholderText(/^re-enter password$/i), password);
  await user.type(screen.getByPlaceholderText(/^e\.g\. alex$/i), firstName);
  await user.type(screen.getByPlaceholderText(/^e\.g\. doe$/i), lastName);
  await user.type(screen.getByPlaceholderText(/^e\.g\. alexdoe@gmail\.com$/i), email);
  await user.type(screen.getByPlaceholderText(/\(123\) 456-7890/i), phone);
  await user.click(screen.getByLabelText(/^no$/i));
  await user.type(screen.getByPlaceholderText(/e\.g\. english, french, mandarin, etc\./i), language);
}

describe('RegisterPage eligibility warnings', () => {
  it('shows an alert for an ineligible immigration status', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.click(
      screen.getByLabelText(/visitor or international student with less than 6 months in canada/i),
    );

    expect(
      screen.getByText(/ineligible immigration status/i),
    ).toBeInTheDocument();
  });

  it('shows the location reminder when the city is outside the eligible area', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByPlaceholderText(/e\.g\. surrey/i), 'Vancouver');
    await user.tab();

    expect(
      screen.getByText(/clients must reside in the surrey, north delta, or cloverdale, north of 40th avenue/i),
    ).toBeInTheDocument();
  });

  it('shows the province reminder when the province is outside BC', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await selectProvince(user, 'AB');

    expect(
      screen.getByText(/clients must reside in british columbia \(bc\), canada/i),
    ).toBeInTheDocument();
  });
});

describe('RegisterPage age validation', () => {
  it('requires a date of birth before moving past account information', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await completeEligibilityStep(user);
    await completeAccountInfoWithoutDob(user);
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(screen.getByText(/account information/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^review$/i })).not.toBeInTheDocument();
  }, 10000);

  it('shows the age restriction when the entered date of birth is under 18', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await completeEligibilityStep(user);
    await user.type(screen.getByLabelText(/date of birth/i), '2020 03 25');

    expect(screen.getByText(/clients must be at least 18 years old/i)).toBeInTheDocument();
  });

  it('accepts a valid adult date of birth without showing the age alert', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await completeEligibilityStep(user);
    const dobInput = screen.getByLabelText(/date of birth/i);
    await user.type(dobInput, '2020 03 25');
    expect(screen.getByText(/clients must be at least 18 years old/i)).toBeInTheDocument();

    await user.clear(dobInput);
    await user.type(dobInput, '2000 03 24');

    await waitFor(() => {
      expect(screen.queryByText(/clients must be at least 18 years old/i)).not.toBeInTheDocument();
    });
  });
});
