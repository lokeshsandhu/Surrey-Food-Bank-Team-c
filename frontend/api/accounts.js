
import { apiUrl } from "./baseUrl";

// API functions for accounts endpoints

const API_BASE = apiUrl("/api/accounts");


/**
 * Create a new account.
 * Example:
 *   createAccount({
 *     username: "johndoe",
 *     password: "password123",
 *     email: "john@example.com",
 *     baby_or_pregnant: false
 *   });
 */
export function createAccount(data) {
  return fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(res => res.json());
}


/**
 * Get account details by username.
 * Example:
 *   getAccount("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "johndoe");
 */
export function getAccount(token, username) {
  return fetch(`${API_BASE}/${username}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}

/**
 * Get account email by username.
 * Example:
 *   getAccountEmail("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "johndoe");
 */
export function getAccountEmail(token, username) {
  return fetch(`${API_BASE}/email/${username}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}


/**
 * Update account details.
 * Example:
 *   updateAccount(
 *     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "johndoe",
 *     { email: "newemail@example.com", baby_or_pregnant: true }
 *   );
 * You only need to include the fields you want to update in the data object.
 */
export function updateAccount(token, username, data) {
  return fetch(`${API_BASE}/${username}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  }).then(res => res.json());
}


/**
 * Check if username exists in database
 * Example:
 *   usernameExists("johndoe");
 */
export function usernameExists(username) {
  return fetch(`${API_BASE}/exists/${username}`).then(res => res.json());
}

/**
 * Check if email exists in database
 * Example:
 *   emailExists("email@email.com");
 *   emailExists("email@email.com", "johndoe", 5);
 */
export function emailExists(email, username = null, familyMemberId = null) {
  const params = new URLSearchParams();

  if (username) {
    params.set("username", username);
  }

  if (familyMemberId !== null && familyMemberId !== undefined) {
    params.set("family_member_id", String(familyMemberId));
  }

  const queryString = params.toString();
  const url = `${API_BASE}/email-exists/${encodeURIComponent(email)}${queryString ? `?${queryString}` : ""}`;

  return fetch(url).then(res => res.json());
}
