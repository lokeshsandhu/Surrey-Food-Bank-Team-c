
// API functions for appointments endpoints

const API_BASE = "http://localhost:3000/api/appointments";


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
 * Get appointments in a time range.
 * Required fields: start, end (HH:mm)
 * Example:
 *   getAppointmentsInTimeRange(token, "09:00", "12:00");
 */
export function getAppointmentsInTimeRange(token, start, end) {
  return fetch(`${API_BASE}/search/time-range?start=${start}&end=${end}`, {
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
 * Optional: appt_notes
 * Example:
 *   createAppointmentsInTimeRange(token, {
 *     appt_date: "2024-06-01",
 *     start_time: "09:00",
 *     end_time: "12:00",
 *     appt_notes: "Morning slots"
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
 * Create a single available appointment slot (admin only).
 * Required fields: appt_date (YYYY-MM-DD), start_time (HH:mm), end_time (HH:mm)
 * Optional: appt_notes
 * Example:
 *   createAppointment(token, {
 *     appt_date: "2024-06-01",
 *     start_time: "10:00",
 *     end_time: "10:15",
 *     appt_notes: "Special slot"
 *   });
 */
export function createAppointment(token, data) {
  return fetch(`${API_BASE}/appointment`, {
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
 * Get all appointments (admin only).
 * Example:
 *   getAllAppointments(token);
 */
export function getAllAppointments(token) {
  return fetch(`${API_BASE}/all`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}


/**
 * Update an appointment (admin only).
 * Required fields: appt_date (YYYY-MM-DD), start_time (HH:mm), updateData (object with fields to update)
 * Example:
 *   updateAppointment(token, "2024-06-01", "10:00", { username: "janedoe" });
 */
export function updateAppointment(token, appt_date, start_time, updateData) {
  return fetch(`${API_BASE}/update`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ appt_date, start_time, updateData })
  }).then(res => res.json());
}


/**
 * Delete all appointments for a date (admin only).
 * Required field: appt_date (YYYY-MM-DD)
 * Example:
 *   deleteAppointmentFromDate(token, "2024-06-01");
 */
export function deleteAppointmentFromDate(token, appt_date) {
  return fetch(`${API_BASE}/delete/date`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ appt_date })
  }).then(res => res.json());
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
 * Delete an appointment for a username, date, and start time (admin only).
 * Required fields: username, appt_date (YYYY-MM-DD), start_time (HH:mm)
 * Example:
 *   deleteAppointmentFromUsernameDateStart(token, "johndoe", "2024-06-01", "10:00");
 */
export function deleteAppointmentFromUsernameDateStart(token, username, appt_date, start_time) {
  return fetch(`${API_BASE}/delete/username-date-start`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ username, appt_date, start_time })
  }).then(res => res.json());
}


/**
 * Find an appointment by date and start time (admin only).
 * Required fields: appt_date (YYYY-MM-DD), start_time (HH:mm)
 * Example:
 *   findAppointmentFromApptDateAndStartTime(token, "2024-06-01", "10:00");
 */
export function findAppointmentFromApptDateAndStartTime(token, appt_date, start_time) {
  return fetch(`${API_BASE}/find/date-start?appt_date=${appt_date}&start_time=${start_time}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}


/**
 * Get all available appointments (client only).
 * Example:
 *   getAvailableAppointments(token);
 */
export function getAvailableAppointments(token) {
  return fetch(`${API_BASE}/available`, {
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
 * Cancel a booked appointment (client only).
 * Required fields: appt_date (YYYY-MM-DD), start_time (HH:mm)
 * Example:
 *   cancelAppointment(token, "2024-06-01", "10:00");
 */
export function cancelAppointment(token, appt_date, start_time) {
  return fetch(`${API_BASE}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ appt_date, start_time })
  }).then(res => res.json());
}

/**
 * Get all appointments booked by the current user (client only).
 * Example:
 *   getMyAppointments(token);
 */
export function getMyAppointments(token) {
  return fetch(`${API_BASE}/mine`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}

/**
 * Update a booked appointment (client only).
 * Required fields: appt_date (YYYY-MM-DD), start_time (HH:mm), newAppointment (object)
 * Example:
 *   updateMyAppointment(token, "2024-06-01", "10:00", { appt_date: "2024-06-08", start_time: "09:00" });
 */
export function updateMyAppointment(token, appt_date, start_time, newAppointment) {
  return fetch(`${API_BASE}/update-mine`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ appt_date, start_time, newAppointment })
  }).then(res => res.json());
}
