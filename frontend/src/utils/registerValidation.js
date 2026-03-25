import dayjs from 'dayjs';

export const INELIGIBLE_CANADA_STATUS = '(Ineligible) Visitor or International student with less than 6 months in Canada';

const ELIGIBLE_CITIES = new Set(['surrey', 'north delta', 'cloverdale']);

export function isEligibleCity(city) {
  return ELIGIBLE_CITIES.has((city ?? '').trim().toLowerCase());
}

export function isEligibleProvince(province) {
  return (province ?? '').trim().toUpperCase() === 'BC';
}

export function validateAdultDob(value) {
  if (!value || value.length === 0) {
    return 'Please enter your date of birth.';
  }

  const birthDate = dayjs(value);
  if (!birthDate.isValid()) {
    return 'Please enter your date of birth.';
  }

  if (dayjs().diff(birthDate, 'year') < 18) {
    return 'You must be at least 18 years old to register.';
  }

  return null;
}
