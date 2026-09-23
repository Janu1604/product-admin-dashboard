export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <div className="h-8 w-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
      <p>{label}</p>
    </div>
  );
}
