'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  fetchProducts,
  searchProducts,
  fetchProductsByCategory,
  fetchCategories,
  deleteProduct,
} from '../lib/products';
import { useDebounce } from '../lib/hooks';
import { applyOverridesToList, deleteProductOverride } from '../lib/localOverrides';
import Loader from './Loader';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import ConfirmModal from './ConfirmModal';

const PAGE_SIZES = [10, 20, 50];

// Defends against bad URL values like ?page=abc or ?page=-1
function parsePositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return n;
}

function normalizeCategories(raw) {
  // DummyJSON has returned categories both as plain strings and as
  // {slug, name, url} objects depending on version, so handle both.
  return raw.map((c) =>
    typeof c === 'string' ? { slug: c, name: c } : { slug: c.slug, name: c.name }
  );
}

export default function ProductsListClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageFromUrl = parsePositiveInt(searchParams.get('page'), 1);
  const limitFromUrl = PAGE_SIZES.includes(Number(searchParams.get('limit')))
    ? Number(searchParams.get('limit'))
    : 10;
  const searchFromUrl = searchParams.get('q') || '';
  const categoryFromUrl = searchParams.get('category') || '';
  const sortByFromUrl = searchParams.get('sortBy') || '';
  const orderFromUrl = searchParams.get('order') === 'desc' ? 'desc' : 'asc';

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, 500);

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | idle | error
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Holds the AbortController for the most recent request so we can cancel
  // it if the user keeps typing/clicking before it finishes. This is what
  // stops slow, stale responses from overwriting newer ones.
  const abortRef = useRef(null);

  function updateUrl(next) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === '' || value === undefined || value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  // When the debounced search value changes, push it into the URL and
  // reset to page 1. We also clear the category filter here because the
  // DummyJSON API cannot search and filter-by-category at the same time
  // (see README for the reasoning) — searching wins.
  useEffect(() => {
    if (debouncedSearch !== searchFromUrl) {
      updateUrl({
        q: debouncedSearch || undefined,
        page: 1,
        category: debouncedSearch ? undefined : categoryFromUrl || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetchCategories();
      setCategories(normalizeCategories(res.data));
    } catch {
      // Categories are a nice-to-have filter, not critical, so fail quietly.
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const loadProducts = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setErrorMsg('');

    const skip = (pageFromUrl - 1) * limitFromUrl;
    const sortBy = sortByFromUrl || undefined;
    const order = sortByFromUrl ? orderFromUrl : undefined;

    try {
      let res;
      if (searchFromUrl) {
        res = await searchProducts({
          q: searchFromUrl,
          limit: limitFromUrl,
          skip,
          sortBy,
          order,
          signal: controller.signal,
        });
      } else if (categoryFromUrl) {
        res = await fetchProductsByCategory({
          category: categoryFromUrl,
          limit: limitFromUrl,
          skip,
          sortBy,
          order,
          signal: controller.signal,
        });
      } else {
        res = await fetchProducts({
          limit: limitFromUrl,
          skip,
          sortBy,
          order,
          signal: controller.signal,
        });
      }
      // Only surface locally-added products on the plain, unfiltered page 1 —
      // we can't know whether a session-only product would actually match a
      // given search/category/sort against the real API.
      const isDefaultView = pageFromUrl === 1 && !searchFromUrl && !categoryFromUrl && !sortByFromUrl;
      const merged = applyOverridesToList(res.data.products || [], res.data.total || 0, {
        includeAdded: isDefaultView,
      });
      setProducts(merged.products);
      setTotal(merged.total);
      setStatus('idle');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      setStatus('error');
      setErrorMsg(err.message || 'Failed to load products.');
    }
  }, [pageFromUrl, limitFromUrl, searchFromUrl, categoryFromUrl, sortByFromUrl, orderFromUrl]);

  useEffect(() => {
    loadProducts();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [loadProducts]);

  const totalPages = Math.max(1, Math.ceil(total / limitFromUrl));
  const currentPage = Math.min(pageFromUrl, totalPages);

  // Defends against ?page=999 (out of range) once we know how many pages exist.
  useEffect(() => {
    if (status === 'idle' && pageFromUrl > totalPages && total > 0) {
      updateUrl({ page: totalPages });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, total]);

  function handleCategoryChange(e) {
    const value = e.target.value;
    setSearchInput('');
    updateUrl({ category: value || undefined, page: 1, q: undefined });
  }

  function handleSortChange(e) {
    const [sortBy, order] = e.target.value ? e.target.value.split(':') : [undefined, undefined];
    updateUrl({ sortBy, order, page: 1 });
  }

  function handleLimitChange(e) {
    updateUrl({ limit: e.target.value, page: 1 });
  }

  function goToPage(p) {
    if (p < 1 || p > totalPages) return;
    updateUrl({ page: p });
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return; // stops double-click from firing two deletes
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      // DummyJSON doesn't really delete it server-side, so we record the
      // deletion locally (persists across navigation/reload for this
      // session) and remove it from the currently-rendered list too.
      deleteProductOverride(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteTarget(null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  }

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * limitFromUrl + 1;
  const rangeEnd = Math.min(currentPage * limitFromUrl, total);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('gap');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link
          href="/products/new"
          className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Product
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-2">
        <input
          className="border rounded px-3 py-2 sm:col-span-2"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-400"
          value={categoryFromUrl}
          onChange={handleCategoryChange}
          disabled={!!searchFromUrl}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="border rounded px-3 py-2"
          value={sortByFromUrl ? `${sortByFromUrl}:${orderFromUrl}` : ''}
          onChange={handleSortChange}
        >
          <option value="">Sort: default</option>
          <option value="price:asc">Price: Low to High</option>
          <option value="price:desc">Price: High to Low</option>
          <option value="rating:asc">Rating: Low to High</option>
          <option value="rating:desc">Rating: High to Low</option>
          <option value="title:asc">Title: A to Z</option>
          <option value="title:desc">Title: Z to A</option>
        </select>
      </div>
      {searchFromUrl && (
        <p className="text-xs text-gray-500 mb-4">
          Category filter is disabled while searching — the API can&apos;t combine both at once.
        </p>
      )}
      {!searchFromUrl && <div className="mb-4" />}

      {status === 'loading' && <Loader label="Loading products..." />}
      {status === 'error' && <ErrorState message={errorMsg} onRetry={loadProducts} />}
      {status === 'idle' && products.length === 0 && (
        <EmptyState message="No products match your filters." />
      )}

      {status === 'idle' && products.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto border rounded-lg bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">Image</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <img src={p.thumbnail} alt={p.title} className="w-12 h-12 object-cover rounded" />
                    </td>
                    <td className="p-3">
                      <Link href={`/products/${p.id}`} className="text-blue-600 hover:underline">
                        {p.title}
                      </Link>
                    </td>
                    <td className="p-3 capitalize">{p.category}</td>
                    <td className="p-3">${p.price}</td>
                    <td className="p-3">⭐ {p.rating}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/products/${p.id}/edit`}
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="px-2 py-1 text-xs border rounded text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {products.map((p) => (
              <div key={p.id} className="border rounded-lg p-3 bg-white flex gap-3">
                <img src={p.thumbnail} alt={p.title} className="w-16 h-16 object-cover rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${p.id}`} className="font-medium text-blue-600 hover:underline block truncate">
                    {p.title}
                  </Link>
                  <p className="text-sm text-gray-500 capitalize">{p.category}</p>
                  <p className="text-sm">
                    ${p.price} · ⭐ {p.rating} · Stock: {p.stock}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Link href={`/products/${p.id}/edit`} className="px-2 py-1 text-xs border rounded">
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="px-2 py-1 text-xs border rounded text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5">
            <p className="text-sm text-gray-500">
              Showing {rangeStart}-{rangeEnd} of {total}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <select className="border rounded px-2 py-1 text-sm" value={limitFromUrl} onChange={handleLimitChange}>
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Previous
              </button>
              {pageNumbers.map((p, idx) =>
                p === 'gap' ? (
                  <span key={`gap-${idx}`} className="px-2 text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`px-3 py-1 border rounded ${
                      p === currentPage ? 'bg-blue-600 text-white border-blue-600' : ''
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete product"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"? This can't be undone.` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
