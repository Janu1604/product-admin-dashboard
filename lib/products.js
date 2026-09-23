// All product-related API calls live here, away from the UI components,
// per the assignment rule "put API calls in separate files".

import api from './api';

function withSort(params, sortBy, order) {
  if (sortBy) {
    params.sortBy = sortBy;
    params.order = order || 'asc';
  }
  return params;
}

export function fetchProducts({ limit, skip, sortBy, order, signal }) {
  const params = withSort({ limit, skip }, sortBy, order);
  return api.get('/products', { params, signal });
}

export function searchProducts({ q, limit, skip, sortBy, order, signal }) {
  const params = withSort({ q, limit, skip }, sortBy, order);
  return api.get('/products/search', { params, signal });
}

export function fetchProductsByCategory({ category, limit, skip, sortBy, order, signal }) {
  const params = withSort({ limit, skip }, sortBy, order);
  return api.get(`/products/category/${encodeURIComponent(category)}`, { params, signal });
}

export function fetchCategories(signal) {
  return api.get('/products/categories', { signal });
}

export function fetchProductById(id, signal) {
  return api.get(`/products/${id}`, { signal });
}

export function addProduct(payload) {
  return api.post('/products/add', payload);
}

export function updateProduct(id, payload) {
  return api.put(`/products/${id}`, payload);
}

export function deleteProduct(id) {
  return api.delete(`/products/${id}`);
}
