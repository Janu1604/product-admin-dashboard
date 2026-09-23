// Small wrapper around localStorage so the rest of the app never touches
// window/localStorage directly. Keeping this in one file makes it easy to
// swap storage (e.g. to cookies) later without touching every page.
//
// Also hosts the login API call itself, so it lives alongside the other
// auth-related logic instead of inside the login page component (API calls
// stay out of UI code, same rule as lib/products.js).

import api from './api';

export const TOKEN_KEY = 'padb_token';
export const USER_KEY = 'padb_user';

export function login(username, password) {
  return api.post('/auth/login', { username, password });
}

export function saveAuth(token, user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
