import type { Metadata } from 'next'
import { Lexend_Deca } from 'next/font/google'
import { Theme } from '@radix-ui/themes'
import AuthSessionProvider from '@/components/providers/session-provider'
import '@radix-ui/themes/styles.css'
import './globals.css'

const lexendDeca = Lexend_Deca({ 
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
})

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
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@100..900&display=swap" 
        />
      </head>
      <body className={lexendDeca.className}>
        <AuthSessionProvider>
          <Theme accentColor="mint" radius="full">
            {children}
          </Theme>
        </AuthSessionProvider>
      </body>
    </html>
  )
}