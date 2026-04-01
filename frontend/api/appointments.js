import { apiUrl } from "./baseUrl";

// API functions for appointments endpoints

const API_BASE = apiUrl("/api/appointments");

export const BOOKING_STATUS = Object.freeze({
  UPCOMING: "upcoming",
  ARRIVED: "arrived",
  DID_NOT_SHOW: "did_not_show"
});


/**
 * Get appointments in a date range.
 * Required fields: start, end (YYYY-MM-DD)
 * Example:
 *   getAppointmentsInDateRange(token, "2024-06-01", "2024-06-30");
 */
export function getAppointmentsInDateRange(token, start, end) {
  return fetch(`${API_BASE}/search/date-range?start=${start}&end=${end}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}


/**
 * Get appointments in a date and time range.
 * Required fields: date (YYYY-MM-DD), start, end (HH:mm)
 * Example:
 *   getAppointmentsInDateTimeRange(token, "2024-06-01", "09:00", "12:00");
 */
export function getAppointmentsInDateTimeRange(token, date, start, end) {
  return fetch(`${API_BASE}/search/date-time-range?date=${date}&start=${start}&end=${end}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}


/**
 * Create multiple appointments in a time range (admin only).
 * Required fields: appt_date (YYYY-MM-DD), start_time (HH:mm), end_time (HH:mm)
 * Optional: appt_notes, capacity
 * Example:
 *   createAppointmentsInTimeRange(token, {
 *     appt_date: "2024-06-01",
 *     start_time: "09:00",
 *     end_time: "12:00",
 *     appt_notes: "Morning slots",
 *     capacity: 3
 *   });
 */
export function createAppointmentsInTimeRange(token, data) {
  return fetch(`${API_BASE}/appointments-in-range`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  }).then(res => res.json());
}


/**
 * Delete an appointment by date and start time (admin only).
 * Required fields: appt_date (YYYY-MM-DD), start_time (HH:mm)
 * Example:
 *   deleteAppointment(token, "2024-06-01", "10:00");
 */
export function deleteAppointment(token, appt_date, start_time) {
  return fetch(`${API_BASE}/appointment`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ appt_date, start_time })
  }).then(res => res.json());
}


/**
 * Update an appointment slot or set/clear a booking (admin only).
 * Required fields: appt_date (YYYY-MM-DD), start_time (HH:mm), updateData (object with fields to update)
 * updateData can include: end_time, appt_notes, capacity, username, booking_status
 * - username: "someuser" adds a booking on that slot (if capacity allows)
 * - username: null clears all bookings for that slot
 * - booking_status: one of BOOKING_STATUS.UPCOMING | BOOKING_STATUS.ARRIVED | BOOKING_STATUS.DID_NOT_SHOW
 * Example:
 *   updateAppointment(token, "2024-06-01", "10:00", { capacity: 3 });
 */
export function updateAppointment(token, appt_date, start_time, updateData) {
  return fetch(`${API_BASE}/update`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ appt_date, start_time, updateData })
  }).then(res => res.json());
}

/**
 * Update booking status for a specific user in a specific slot (admin only).
 * Required fields: appt_date (YYYY-MM-DD), start_time (HH:mm), username, bookingStatus
 * bookingStatus must be one of BOOKING_STATUS values.
 */
export function updateBookingStatus(token, appt_date, start_time, username, bookingStatus) {
  return updateAppointment(token, appt_date, start_time, {
    username,
    booking_status: bookingStatus
  });
}

/**
 * Mark a booking as arrived.
 */
export function markBookingArrived(token, appt_date, start_time, username) {
  return updateBookingStatus(token, appt_date, start_time, username, BOOKING_STATUS.ARRIVED);
}

/**
 * Mark a booking as did not show.
 */
export function markBookingDidNotShow(token, appt_date, start_time, username) {
  return updateBookingStatus(token, appt_date, start_time, username, BOOKING_STATUS.DID_NOT_SHOW);
}


/**
 * Delete all appointments for a username (admin only).
 * Required field: username
 * Example:
 *   deleteAppointmentFromUsername(token, "johndoe");
 */
export function deleteAppointmentFromUsername(token, username) {
  return fetch(`${API_BASE}/delete/username`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ username })
  }).then(res => res.json());
}

/**
 * Get all appointments booked by a user (admin only).
 * Response rows include booking_status.
 * Example:
 *   getUsernameAppointments(token);
 */
export function getUsernameAppointments(token, username) {
  return fetch(`${API_BASE}/get/${username}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}

/**
 * Book an appointment (client only).
 * Required fields: appt_date (YYYY-MM-DD), start_time (HH:mm)
 * Example:
 *   bookAppointment(token, {
 *     appt_date: "2024-06-01",
 *     start_time: "10:00"
 *   });
 */
export function bookAppointment(token, data) {
  return fetch(`${API_BASE}/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  }).then(res => res.json());
}


/**
 * Get all appointments booked by the current user (client only).
 * Response rows include booking_status.
 * Example:
 *   getMyAppointments(token);
 */
export function getMyAppointments(token) {
  return fetch(`${API_BASE}/mine`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}
