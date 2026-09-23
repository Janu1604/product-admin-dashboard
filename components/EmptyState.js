export default function EmptyState({ message = 'No products found.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <p className="text-2xl mb-2">🗂️</p>
      <p>{message}</p>
    </div>
  );
}
