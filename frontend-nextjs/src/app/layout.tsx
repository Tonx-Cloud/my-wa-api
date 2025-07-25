import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

import { SessionProvider } from '@/components/providers/SessionProvider'
import ClientLayout from '@/components/ClientLayout';

// Importa o supressor de aviso do React DevTools
import '@/lib/suppressDevToolsWarning';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WhatsApp API Portal',
  description: 'Gerenciamento e automação de WhatsApp',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={inter.className} style={{ zoom: 1, width: '100vw', minHeight: '100vh', overflowX: 'hidden' }} data-atm-ext-installed="1.29.10">
        <ClientLayout>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ClientLayout>
      </body>
    </html>
  )
}
