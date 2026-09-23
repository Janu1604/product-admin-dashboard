import './globals.css';

export const metadata = {
  title: 'Product Admin Dashboard',
  description: 'Manage products with the DummyJSON API',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
