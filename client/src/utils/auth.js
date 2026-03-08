const ACCESS_TOKEN_STORAGE_KEY = "edusync_access_token";

let accessToken = null;
let refreshPromise = null;

function hasSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readStoredToken() {
  if (!hasSessionStorage()) return null;

  const storedToken = window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  return typeof storedToken === "string" && storedToken.trim() ? storedToken : null;
}

function writeStoredToken(token) {
  if (!hasSessionStorage()) return;

  if (token) {
    window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    return;
  }

  window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

accessToken = readStoredToken();

export function getAccessToken() {
  if (accessToken) {
    return accessToken;
  }

  accessToken = readStoredToken();
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = typeof token === "string" && token.trim() ? token : null;
  writeStoredToken(accessToken);
}

export function clearAccessToken() {
  accessToken = null;
  writeStoredToken(null);
}

export function getRefreshPromise() {
  return refreshPromise;
}

export function setRefreshPromise(promise) {
  refreshPromise = promise;
}
