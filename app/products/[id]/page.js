'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchProductById } from '../../../lib/products';
import { getAddedProductById, getEditedFieldsById, isDeleted } from '../../../lib/localOverrides';
import Loader from '../../../components/Loader';
import ErrorState from '../../../components/ErrorState';
import Navbar from '../../../components/Navbar';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | idle | error
  const [errorMsg, setErrorMsg] = useState('');
  const [notFound, setNotFound] = useState(false);

  async function load() {
    setStatus('loading');
    setNotFound(false);
    try {
      if (isDeleted(id)) {
        setNotFound(true);
        setStatus('idle');
        return;
      }

      let prod;
      try {
        const res = await fetchProductById(id);
        prod = res.data;
      } catch (err) {
        if (err.status === 404) {
          // Not a real DummyJSON product — but it might be one we added
          // locally this session (the API never actually saved it).
          const added = getAddedProductById(id);
          if (!added) {
            setNotFound(true);
            setStatus('idle');
            return;
          }
          prod = added;
        } else {
          throw err;
        }
      }

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

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/products" className="text-sm text-blue-600 hover:underline">
          ← Back to products
        </Link>

        {status === 'loading' && <Loader label="Loading product..." />}
        {status === 'error' && <ErrorState message={errorMsg} onRetry={load} />}

        {status === 'idle' && notFound && (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold mb-2">Product not found</h2>
            <p className="text-gray-500 mb-4">We couldn&apos;t find a product with id &quot;{id}&quot;.</p>
            <Link href="/products" className="text-blue-600 hover:underline">
              Go back to products
            </Link>
          </div>
        )}

        {status === 'idle' && product && !notFound && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img src={product.thumbnail} alt={product.title} className="w-full rounded-lg border mb-3" />
              {product.images?.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(0, 4).map((img, i) => (
                    <img key={i} src={img} alt="" className="w-full h-16 object-cover rounded border" />
                  ))}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold mb-1">{product.title}</h1>
              <p className="text-gray-500 capitalize mb-3">
                {product.category} {product.brand ? `· ${product.brand}` : ''}
              </p>
              <p className="text-2xl font-bold text-blue-600 mb-3">${product.price}</p>
              <p className="text-gray-700 mb-4">{product.description}</p>
              <div className="flex gap-4 text-sm text-gray-600 mb-4">
                <span>⭐ {product.rating}</span>
                <span>Stock: {product.stock}</span>
              </div>
              <Link
                href={`/products/${product.id}/edit`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Edit product
              </Link>

              <div className="mt-8">
                <h2 className="font-semibold mb-2">Reviews</h2>
                {(!product.reviews || product.reviews.length === 0) && (
                  <p className="text-sm text-gray-500">No reviews yet.</p>
                )}
                <div className="space-y-3">
                  {(product.reviews || []).map((r, i) => (
                    <div key={i} className="border rounded p-3 bg-white">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{r.reviewerName}</span>
                        <span>⭐ {r.rating}</span>
                      </div>
                      <p className="text-sm text-gray-600">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
