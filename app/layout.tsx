// app/layout.tsx
import React from 'react';
import './globals.css'; // <-- ensure this exists and includes tailwind base/components/utilities

export const metadata = {
  title: 'Clockwork Gifts Concierge',
  description: 'AI-powered personalized gift assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0 min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
