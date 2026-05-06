const TOKEN_KEY = "token";
const LEGACY_USER_KEY = "user";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function clearLegacyStoredUser() {
  localStorage.removeItem(LEGACY_USER_KEY);
}
