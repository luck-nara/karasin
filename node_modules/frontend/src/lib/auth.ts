export const ADMIN_AUTH_KEY = "karasin_admin_auth";

export function isAdminSession(): boolean {
  return sessionStorage.getItem(ADMIN_AUTH_KEY) === "1";
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_AUTH_KEY);
}
