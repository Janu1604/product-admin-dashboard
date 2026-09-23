import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-gray-500 mb-4">This page does not exist.</p>
      <Link href="/products" className="text-blue-600 hover:underline">
        Go to products
      </Link>
    </div>
  );
}
