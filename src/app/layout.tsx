import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { RoomProvider } from '@/context/RoomContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'My Speaking Room – Live Global Language Voice Practice',
  description: 'Join live voice rooms with language learners and native speakers worldwide. Zero video fatigue, pure conversational confidence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white font-sans">
        <AuthProvider>
          <RoomProvider>
            {children}
          </RoomProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
