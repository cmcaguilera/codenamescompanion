import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { GameBoardProvider } from '@/lib/contexts/GameBoardContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Codenames Companion',
  description: 'A companion app for playing Codenames',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GameBoardProvider>
          {children}
        </GameBoardProvider>
      </body>
    </html>
  )
}
