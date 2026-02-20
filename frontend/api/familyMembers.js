
// API functions for family members endpoints

const API_BASE = "http://localhost:3000/api/family-members";


/**
 * Get family members by first name.
 * Example:
 *   getFamilyMembersByFName("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "Jane");
 */
export function getFamilyMembersByFName(token, f_name) {
  return fetch(`${API_BASE}/search/by-fname?f_name=${encodeURIComponent(f_name)}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}


/**
 * Get family members by last name.
 * Example:
 *   getFamilyMembersByLName("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "Doe");
 */
export function getFamilyMembersByLName(token, l_name) {
  return fetch(`${API_BASE}/search/by-lname?l_name=${encodeURIComponent(l_name)}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}


/**
 * Create a new family member.
 * Example:
 *   createFamilyMember("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", {
 *     username: "johndoe",
 *     f_name: "Jane",
 *     l_name: "Doe",
 *     age: 12,
 *     relationship: "child"
 *   });
 */
export function createFamilyMember(token, data) {
  return fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  }).then(res => res.json());
}


/**
 * Get all family members for a username.
 * Example:
 *   getFamilyMembers("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "johndoe");
 */
export function getFamilyMembers(token, username) {
  return fetch(`${API_BASE}/${username}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}


/**
 * Update a family member's details.
 * Example:
 *   updateFamilyMember(
 *     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "johndoe",
 *     "Jane",
 *     { age: 13, relationship: "daughter" }
 *   );
 */
export function updateFamilyMember(token, username, f_name, data) {
  return fetch(`${API_BASE}/${username}/${encodeURIComponent(f_name)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  }).then(res => res.json());
}


/**
 * Delete a family member by username and first name.
 * Example:
 *   deleteFamilyMember("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "johndoe", "Jane");
 */
export function deleteFamilyMember(token, username, f_name) {
  return fetch(`${API_BASE}/${username}/${encodeURIComponent(f_name)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}
