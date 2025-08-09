import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Theme } from '@radix-ui/themes'
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
      <body className={inter.className}>
        <Theme accentColor="mint" radius="full">
          {children}
        </Theme>
      </body>
    </html>
  )
}