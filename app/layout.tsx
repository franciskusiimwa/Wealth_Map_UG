import type { Metadata } from 'next'
import { DM_Sans, Syne } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '700']
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500']
})

export const metadata: Metadata = {
  title: 'Wealthmap',
  description: 'Your financial future, mapped.'
}

/**
 * Root application layout with global fonts and body styling.
 * @param props Next.js layout props.
 * @returns Root HTML structure.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-UG">
      <body className={`${syne.variable} ${dmSans.variable} min-h-screen bg-paper text-ink grain-bg`}>
        {children}
      </body>
    </html>
  )
}
