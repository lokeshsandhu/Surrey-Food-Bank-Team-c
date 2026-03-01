// API functions for family members endpoints

const API_BASE = "http://localhost:3000/api/family-members";


/**
 * Get family members by first name (admin only).
 * Required field: f_name
 * Example:
 *   getFamilyMembersByFName(token, "Jane");
 */
export function getFamilyMembersByFName(token, f_name) {
  return fetch(`${API_BASE}/search/by-fname?f_name=${encodeURIComponent(f_name)}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}


/**
 * Get family members by last name (admin only).
 * Required field: l_name
 * Example:
 *   getFamilyMembersByLName(token, "Doe");
 */
export function getFamilyMembersByLName(token, l_name) {
  return fetch(`${API_BASE}/search/by-lname?l_name=${encodeURIComponent(l_name)}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}


/**
 * Create a new family member.
 * Required fields: username, f_name
 * Optional: l_name, dob, phone, email, relationship
 * Example:
 *   createFamilyMember(token, {
 *     username: "johndoe",
 *     f_name: "Jane",
 *     l_name: "Doe",
 *     dob: "2014-06-01",
 *     phone: "1234567890",
 *     email: "jane@example.com",
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
 * Required field: username
 * Example:
 *   getFamilyMembers(token, "johndoe");
 */
export function getFamilyMembers(token, username) {
  return fetch(`${API_BASE}/${username}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}


/**
 * Update a family member's details.
 * Required fields: username, f_name (in URL)
 * Optional fields in data: l_name, dob, phone, email, relationship
 * Example:
 *   updateFamilyMember(token, "johndoe", "Jane", { relationship: "daughter", dob: "2013-06-01" });
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
 * Required fields: username, f_name (in URL)
 * Example:
 *   deleteFamilyMember(token, "johndoe", "Jane");
 */
export function deleteFamilyMember(token, username, f_name) {
  return fetch(`${API_BASE}/${username}/${encodeURIComponent(f_name)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}

/**
 * Get all family members with relationship = 'owner'.
 * Example:
 *   getOwnerFamilyMembers(token);
 */
export function getOwnerFamilyMembers(token) {
  return fetch(`${API_BASE}/owners`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
}
