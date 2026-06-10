import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stampa — Polos Personalizados',
  description: 'Diseña tu polo personalizado',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
