'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Navbar from '../../../components/Navbar';
import ProductForm from '../../../components/ProductForm';
import { addProduct, fetchCategories } from '../../../lib/products';
import { addProductOverride } from '../../../lib/localOverrides';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories()
      .then((res) => {
        setCategories(
          res.data.map((c) => (typeof c === 'string' ? { slug: c, name: c } : { slug: c.slug, name: c.name }))
        );
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(payload) {
    const res = await addProduct(payload);
    // DummyJSON accepts this call and returns a realistic-looking new
    // product, but does NOT actually save it server-side. We store the
    // response locally so it still shows up in the product list/detail
    // pages for the rest of this session.
    addProductOverride(res.data);
    router.push('/products');
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-1">Add Product</h1>
        <p className="text-sm text-gray-500 mb-6">
          Note: DummyJSON simulates this response but doesn&apos;t actually save it on their server.
        </p>
        <ProductForm categories={categories} onSubmit={handleSubmit} submitLabel="Add Product" />
      </div>
    </ProtectedRoute>
  );
}
