let accessToken = null;
let refreshPromise = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = typeof token === "string" && token.trim() ? token : null;
}

export function clearAccessToken() {
  accessToken = null;
}

export function getRefreshPromise() {
  return refreshPromise;
}

export function setRefreshPromise(promise) {
  refreshPromise = promise;
}
