// This is the ONE Axios instance used by the whole app (assignment rule:
// "Create one shared Axios setup file"). Every request goes through here,
// so the token attachment and error handling only need to be written once.

import axios from 'axios';
import { getToken, clearAuth } from './auth';

const api = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 10000,
});

// Request interceptor: attach the login token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: normalize every error into { status, message }
// so components don't each have to dig through error.response.data.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Requests we cancelled on purpose (see useDebounce/AbortController usage)
    // should not be treated as real errors.
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    // If the token is rejected, log the user out and send them back to login.
    if (status === 401 && typeof window !== 'undefined') {
      clearAuth();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject({ status, message });
  }
);

export default api;
