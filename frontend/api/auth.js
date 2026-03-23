
import { apiUrl } from "./baseUrl";

// API functions for authentication endpoints

/**
 * Login and get a JWT token.
 * Example:
 *   login("johndoe", "password123");
 *   // Save the returned token for future API calls.
 */
export function login(username, password) {
  return fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  }).then(res => res.json());
}

/**
 * Get user info from a JWT token.
 * Example:
 *   me("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
 *   // Returns user info, including role (admin/client).
 */
export function me(token) {
  return fetch(apiUrl("/api/auth/me"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}
