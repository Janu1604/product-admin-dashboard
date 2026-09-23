import { Suspense } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import ProductsListClient from '../../components/ProductsListClient';

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
        <ProductsListClient />
      </Suspense>
    </ProtectedRoute>
  );
}
