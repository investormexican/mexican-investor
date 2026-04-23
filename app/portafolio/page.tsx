'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const C = {
  bg:        '#EEE7D7',
  bgCard:    '#E5DCC8',
  bgRow:     '#EEE7D7',
  bgRowAlt:  '#E8E1CE',
  bgRowHover:'#DDD5C0',
  border:    '#C9BFA8',
  text:      '#244143',
  textDim:   '#5a7a6e',
  green:     '#1a5c3a',
  greenBg:   'rgba(26,92,58,0.10)',
  red:       '#8b2020',
  redBg:     'rgba(139,32,32,0.10)',
  neutral:   '#6b7280',
  accent:    '#244143',
  sans:      "var(--font-dm-sans), 'Helvetica Neue', sans-serif",
  serif:     "'Playfair Display', Georgia, serif",
}

function Navbar() {
  const pathname = usePathname()

  return (
    <nav style={{
      background: C.accent,
      borderBottom: `1px solid #1a3130`,
      padding: '0 48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 64,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
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
            height: 28,
            width: 'auto',
          }}
        />
        <span style={{
          color: '#EEE7D7',
          fontFamily: C.sans,
          fontSize: 30,
          letterSpacing: 2,
          fontWeight: 700,
        }}>
          Mexican Investor
        </span>
        </div>
      </Link>

      <div style={{ display: 'flex', gap: 32 }}>
        {[
          { href: '/small-caps', label: '3 Small-Caps' },
          { href: '/portafolio', label: 'Portafolio' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{
            color: pathname === href ? '#EEE7D7' : '#a0b8b4',
            borderBottom: pathname === href ? '2px solid #EEE7D7' : '2px solid transparent',
            textDecoration: 'none',
            fontSize: 15,
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontWeight: 600,
            paddingBottom: 4,
            fontFamily: C.sans,
          }}>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: '20px 28px',
      minWidth: 160,
    }}>
      <div style={{
        color: C.textDim,
        fontSize: 15,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 8,
        fontFamily: C.sans,
        fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{
        color: color ?? C.text,
        fontSize: 15,
        fontFamily: C.sans,
        fontWeight: 700,
      }}>
        {value}
      </div>
    </div>
  )
}

function PerformerCard({ title, items, isWinner }: {
  title: string
  items: any[]
  isWinner: boolean
}) {
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: '20px 24px',
      minWidth: 220,
    }}>
      <div style={{
        color: C.textDim,
        fontSize: 15,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 14,
        fontFamily: C.sans,
        fontWeight: 600,
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((e) => (
          <div key={e.ticker} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}>
            <span style={{
              color: C.text,
              fontFamily: C.sans,
              fontSize: 12,
              fontWeight: 700,
            }}>
              {e.ticker}
            </span>
            <span style={{
              color: isWinner ? C.green : C.red,
              background: isWinner ? C.greenBg : C.redBg,
              padding: '2px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontFamily: C.sans,
              fontWeight: 600,
            }}>
              {e.rendimiento > 0 ? '+' : ''}{e.rendimiento.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

async function getPrecio(ticker: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/precio?ticker=${ticker}`)
    const data = await res.json()
    return data.precio ?? null
  } catch {
    return null
  }
}

export default function Portafolio() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('portafolio').select('*')
      if (!data) { setLoading(false); return }

      const conPrecios = await Promise.all(
        data.map(async (e) => {
          const precioActual = await getPrecio(e.ticker)
          const precioEntrada = Number(e.precio_entrada)
          const rendimiento = precioActual && precioEntrada
            ? ((precioActual - precioEntrada) / precioEntrada) * 100
            : null
          return { ...e, precioActual, rendimiento }
        })
      )

      const totalValue = conPrecios.reduce((acc, e) =>
        e.precioActual ? acc + e.precioActual * e.cantidad : acc, 0)

      const final = conPrecios
        .map((e) => ({
          ...e,
          peso: totalValue
            ? (e.precioActual ? (e.precioActual * e.cantidad / totalValue) * 100 : 0)
            : 0
        }))
        .sort((a, b) => b.peso - a.peso)

      setRows(final)
      setLoading(false)
    }
    cargar()
  }, [])

  const withReturn = rows.filter((e) => e.rendimiento != null)
  const sorted = [...withReturn].sort((a, b) => b.rendimiento - a.rendimiento)
  const winners = sorted.slice(0, 3)
  const losers = sorted.slice(-3).reverse()
  const avgReturn = withReturn.length
    ? withReturn.reduce((acc, e) => acc + e.rendimiento, 0) / withReturn.length
    : null

  const headers = ['Ticker', 'Nombre', 'País', 'Sector', 'Precio Entrada', 'Precio Actual', 'Rendimiento', 'Peso']

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.sans }}>
      <Navbar />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px' }}>

        {/* Título */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{
            color: C.text,
            fontSize: 35,
            fontWeight: 700,
            margin: 0,
            fontFamily: C.sans,
          }}>
            Portafolio
          </h1>
          <div style={{ width: 40, height: 2, background: C.accent, opacity: 0.3, marginTop: 10 }} />
        </div>

        {loading ? (
          <div style={{ color: C.textDim, fontSize: 15, letterSpacing: 2 }}>
            Cargando precios...
          </div>
        ) : (
          <>
            {/* Stats + Performers */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 40, alignItems: 'flex-start' }}>
              <StatCard label="Posiciones" value={`${rows.length}`} />
              <StatCard
                label="Retorno Promedio"
                value={avgReturn != null ? `${avgReturn > 0 ? '+' : ''}${avgReturn.toFixed(2)}%` : '-'}
                color={avgReturn != null ? (avgReturn > 0 ? C.green : C.red) : C.text}
              />
              <div style={{ flex: 1, minWidth: 16 }} />
              <PerformerCard title="🏆 Top Winners" items={winners} isWinner={true} />
              <PerformerCard title="📉 Top Losers" items={losers} isWinner={false} />
            </div>

            {/* Tabla */}
            <div style={{
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(36,65,67,0.06)',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                <thead>
                  <tr style={{ background: C.bgCard }}>
                    {headers.map((h) => (
                      <th key={h} style={{
                        color: C.textDim,
                        fontSize: 15,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        padding: '14px 16px',
                        textAlign: 'left',
                        fontWeight: 700,
                        borderBottom: `1px solid ${C.border}`,
                        fontFamily: C.sans,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e, i) => (
                    <tr
                      key={e.ticker}
                      onClick={() => router.push(`/empresa/${e.ticker}`)}
                      style={{
                        background: i % 2 === 0 ? C.bgRow : C.bgRowAlt,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(el) => (el.currentTarget.style.background = C.bgRowHover)}
                      onMouseLeave={(el) => (el.currentTarget.style.background = i % 2 === 0 ? C.bgRow : C.bgRowAlt)}
                    >
                      <td style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>
                          {e.ticker}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: C.text, borderBottom: `1px solid ${C.border}` }}>
                        {e.nombre}
                      </td>
                      <td style={{ padding: '14px 16px', color: C.textDim, borderBottom: `1px solid ${C.border}` }}>
                        {e.pais}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{
                          color: C.text,
                          background: C.bgCard,
                          border: `1px solid ${C.border}`,
                          borderRadius: 4,
                          padding: '2px 8px',
                          fontSize: 15,
                          letterSpacing: 2,
                          fontWeight: 600,
                        }}>
                          {e.sector}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: C.textDim, borderBottom: `1px solid ${C.border}` }}>
                        {e.precio_entrada?.toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 16px', color: C.text, borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>
                        {e.precioActual ? e.precioActual.toFixed(2) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                        {e.rendimiento != null ? (
                          <span style={{
                            color: e.rendimiento > 0 ? C.green : e.rendimiento < 0 ? C.red : C.neutral,
                            background: e.rendimiento > 0 ? C.greenBg : e.rendimiento < 0 ? C.redBg : 'transparent',
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 15,
                            fontWeight: 700,
                          }}>
                            {e.rendimiento > 0 ? '+' : ''}{e.rendimiento.toFixed(2)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: C.textDim, borderBottom: `1px solid ${C.border}` }}>
                        {e.peso != null ? `${e.peso.toFixed(1)}%` : '—'}
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}