'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import Navbar from '../../../../components/Navbar';
import ProductForm from '../../../../components/ProductForm';
import Loader from '../../../../components/Loader';
import ErrorState from '../../../../components/ErrorState';
import { fetchProductById, updateProduct, fetchCategories } from '../../../../lib/products';
import { editProductOverride, getAddedProductById, getEditedFieldsById } from '../../../../lib/localOverrides';

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  async function load() {
    setStatus('loading');
    try {
      const catRes = await fetchCategories();
      setCategories(
        catRes.data.map((c) => (typeof c === 'string' ? { slug: c, name: c } : { slug: c.slug, name: c.name }))
      );

      let prod;
      try {
        const prodRes = await fetchProductById(id);
        prod = prodRes.data;
      } catch (err) {
        if (err.status === 404) {
          // Might be a product that only exists locally (added this session).
          const added = getAddedProductById(id);
          if (!added) throw err;
          prod = added;
        } else {
          throw err;
        }
      }

      // Pre-fill with any edits made earlier this session, so re-editing
      // the same product doesn't lose the previous change.
      const edited = getEditedFieldsById(id);
      setProduct(edited ? { ...prod, ...edited } : prod);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to load product.');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(payload) {
    await updateProduct(id, payload);
    // Same as add: DummyJSON doesn't persist the edit server-side, so we
    // save the new field values locally. The detail and list pages merge
    // this in on top of whatever the API returns.
    editProductOverride(id, payload);
    router.push(`/products/${id}`);
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-1">Edit Product</h1>
        <p className="text-sm text-gray-500 mb-6">
          Note: DummyJSON simulates this response but doesn&apos;t actually save it on their server.
        </p>
        {status === 'loading' && <Loader label="Loading product..." />}
        {status === 'error' && <ErrorState message={errorMsg} onRetry={load} />}
        {status === 'idle' && product && (
          <ProductForm
            initial={{
              title: product.title,
              category: product.category,
              price: product.price,
              stock: product.stock,
              rating: product.rating,
              description: product.description,
              thumbnail: product.thumbnail,
            }}
            categories={categories}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
