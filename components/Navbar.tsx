'use client'
import { useLayoutEffect, useState } from 'react'
import Link from 'next/link'

const C = {
  accent: '#244143',
  sans: "var(--font-dm-sans), 'Helvetica Neue', sans-serif",
}

function useIsMobile(bp = 640) {
  const [v, setV] = useState<boolean | null>(null)

  useLayoutEffect(() => {
    const fn = () => setV(window.innerWidth < bp)
    fn()
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [bp])

  return v
}

export default function Navbar() {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  // 🔴 clave: no renderizar hasta saber si es mobile
  if (isMobile === null) return null

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: C.accent,
      borderBottom: '1px solid #1a3130'
    }}>
      <div style={{
        padding: isMobile ? '0 16px' : '0 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64
      }}>
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src="/sombrero.png"
              alt="logo"
              style={{ height: isMobile ? 20 : 28, width: 'auto', flexShrink: 0 }}
            />
            <span style={{
              color: '#EEE7D7',
              fontFamily: C.sans,
              fontSize: isMobile ? 16 : 30,
              letterSpacing: isMobile ? 1 : 2,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}>
              Mexican Investor
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { href: '/',           label: 'Home'             },
              { href: '/small-caps', label: 'Investment Ideas' },
              { href: '/portafolio', label: 'Portfolio'         },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  color: '#a0b8b4',
                  borderBottom: '2px solid transparent',
                  textDecoration: 'none',
                  fontSize: 15,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  paddingBottom: 4,
                  fontFamily: C.sans,
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              flexShrink: 0,
            }}
            aria-label="Menú"
          >
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  display: 'block',
                  width: 22,
                  height: 2,
                  background: '#EEE7D7',
                  borderRadius: 2,
                  opacity: open && i === 1 ? 0 : 1,
                  transition: 'opacity 0.2s',
                }}
              />
            ))}
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {isMobile && open && (
        <div style={{
          background: C.accent,
          borderTop: '1px solid #1a3130',
          padding: '12px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {[
            { href: '/',           label: 'Home'             },
            { href: '/small-caps', label: 'Investment Ideas' },
            { href: '/portafolio', label: 'Portfolio'         },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{
                color: '#EEE7D7',
                textDecoration: 'none',
                fontSize: 15,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontWeight: 600,
                fontFamily: C.sans,
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}