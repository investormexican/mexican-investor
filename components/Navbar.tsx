'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const C = {
  accent: '#244143',
  textLight: '#EEE7D7',
  textDim: '#a0b8b4',
  sans: "var(--font-dm-sans), 'Helvetica Neue', sans-serif",
}

export default function Navbar() {
  const pathname = usePathname()

  function linkStyle(href: string) {
    const active = pathname === href

    return {
      color: active ? C.textLight : C.textDim,
      fontFamily: C.sans,
      fontSize: 15,
      fontWeight: active ? 700 : 500,
      letterSpacing: 2,
      textTransform: 'uppercase' as const,
      textDecoration: 'none',
    }
  }

  return (
    <nav style={{
      background: C.accent,
      padding: '0 48px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: 64,
    }}>

      {/* LOGO + TEXTO */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <img
            src="/sombrero.png"
            alt="logo"
            style={{
              height: 30,
              width: 'auto',
            }}
          />

          <span style={{
            color: C.textLight,
            fontFamily: C.sans,
            fontSize: 30,
            letterSpacing: 2,
            fontWeight: 700,
          }}>
            Mexican Investor
          </span>
        </div>
      </Link>

      {/* LINKS */}
      <div style={{ display: 'flex', gap: 32 }}>
        <Link href="/small-caps" style={linkStyle('/small-caps')}>
          3 Small-Caps
        </Link>

        <Link href="/portafolio" style={linkStyle('/portafolio')}>
          Portafolio
        </Link>
      </div>

    </nav>
  )
}