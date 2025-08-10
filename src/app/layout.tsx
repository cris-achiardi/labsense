import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Theme } from '@radix-ui/themes'
import AuthSessionProvider from '@/components/providers/session-provider'
import '@radix-ui/themes/styles.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LabSense - Intelligent Lab Result Prioritization',
  description: 'Automated lab result analysis for Chilean healthcare centers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
        />
      </head>
      <body className={inter.className}>
        <AuthSessionProvider>
          <Theme accentColor="mint" radius="full">
            {children}
          </Theme>
        </AuthSessionProvider>
      </body>
    </html>
  )
}