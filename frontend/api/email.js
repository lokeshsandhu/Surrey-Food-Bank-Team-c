import { apiUrl } from "./baseUrl";

// API functions for email endpoints

const API_BASE = apiUrl("/api/email");


/**
 * Send confirmation email for successful bookings
 * Required fields: date, time, username, email
 * Example:
 *   getFamilyMembersByFName(token, {
 *      date: ,
 *      time: ,
 *      username: "jane123",
 *      email: "email@email.com"
 * });
 */
export function sendConfirmationEmail(token, data) {
  return fetch(`${API_BASE}/send-confirmation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  }).then(res => res.json());
}

/**
 * Send recovery email to reset account password
 * Required fields: email, link
 * Example:
 *   getFamilyMembersByFName(token, {
 *      email: "email@email.com",
 *      link: ""
 * });
 */
export function sendRecoveryEmail(token, data) {
  return fetch(`${API_BASE}/send-recovery`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  }).then(res => res.json());
}