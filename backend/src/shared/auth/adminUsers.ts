export const ADMIN_USERNAMES = new Set(["admin"]);

export function isAdminUsername(username: unknown): boolean {
    return typeof username === "string" && ADMIN_USERNAMES.has(username.trim().toLowerCase());
}
