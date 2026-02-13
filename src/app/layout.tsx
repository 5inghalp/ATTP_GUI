import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import { AppProvider } from '@/context/AppContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Restore My Health',
  description: 'AI-powered health companion for exploring your wellness journey',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
