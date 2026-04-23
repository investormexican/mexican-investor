'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const C = {
  bg:         '#EEE7D7',
  bgCard:     '#E5DCC8',
  bgRow:      '#EEE7D7',
  bgRowAlt:   '#E8E1CE',
  bgRowHover: '#DDD5C0',
  border:     '#C9BFA8',
  text:       '#244143',
  textDim:    '#5a7a6e',
  green:      '#1a5c3a',
  greenBg:    'rgba(26,92,58,0.10)',
  red:        '#8b2020',
  redBg:      'rgba(139,32,32,0.10)',
  amber:      '#92620a',
  amberBg:    'rgba(146,98,10,0.10)',
  neutral:    '#6b7280',
  accent:     '#244143',
  sans:       "var(--font-dm-sans), 'Helvetica Neue', sans-serif",
  serif:      "'Playfair Display', Georgia, serif",
}

type Empresa = {
  id: number
  tipo_idea: string
  estatus: string
  ticker: string
  nombre: string
  pais: string
  sector: string
  fecha_publicacion: string
  precio_publicacion: number
  precioActual?: number | null
  rendimiento?: number | null
}

function Navbar() {
  const pathname = usePathname()

  return (
    <nav style={{
      background: C.accent,
      borderBottom: '1px solid #1a3130',
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

function EstatusBadge({ estatus }: { estatus: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    Intacta: { color: C.green, bg: C.greenBg },
    Duda:    { color: C.amber, bg: C.amberBg },
    Rota:    { color: C.red,   bg: C.redBg   },
  }
  const s = map[estatus] || { color: C.neutral, bg: 'transparent' }
  return (
    <span style={{
      color: s.color,
      background: s.bg,
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      fontFamily: C.sans,
      whiteSpace: 'nowrap',
    }}>
      {estatus}
    </span>
  )
}

async function getPrecio(ticker: string): Promise<number | null> {
  try {
    const res = await fetch('/api/precio?ticker=' + ticker)
    const data = await res.json()
    return data.precio ?? null
  } catch {
    return null
  }
}

export default function Home() {
  const [rows, setRows] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function cargarDatos() {
      const { data } = await supabase.from('tres_en_tres').select('*')
      if (!data) return

      setRows(data.map(e => ({ ...e, precioActual: null, rendimiento: null })))
      setLoading(false)

      const conPrecios = await Promise.all(
        data.map(async (e) => {
          const precioActual = await getPrecio(e.ticker)
          const pub = Number(e.precio_publicacion)
          const rendimiento = precioActual != null && pub
            ? ((precioActual - pub) / pub) * 100
            : null
          return { ...e, precioActual, rendimiento }
        })
      )
      setRows(conPrecios)
    }
    cargarDatos()
  }, [])

  const headers = [
    'Fecha', 'Tipo de idea', 'Estatus', 'Ticker',
    'Nombre', 'Sector',
    'Precio Entrada', 'Precio Actual', 'Rendimiento',
  ]

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.sans }}>
      <Navbar />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px' }}>

        <div style={{ marginBottom: 36 }}>
          <h1 style={{
            color: C.text,
            fontSize: 32,
            fontWeight: 700,
            margin: 0,
            fontFamily: C.sans,
          }}>
            3 Small-Caps en 3 Minutos
          </h1>
          <div style={{ width: 40, height: 2, background: C.accent, opacity: 0.3, marginTop: 10 }} />
        </div>

        {loading ? (
          <div style={{ color: C.textDim, fontSize: 14, letterSpacing: 1 }}>
            Cargando precios...
          </div>
        ) : (
          <div style={{
            border: '1px solid ' + C.border,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(36,65,67,0.06)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.bgCard }}>
                  {headers.map(h => (
                    <th key={h} style={{
                      color: C.textDim,
                      fontSize: 12,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      padding: '14px 16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      borderBottom: '1px solid ' + C.border,
                      fontFamily: C.sans,
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {[...rows]
                  .sort((a, b) =>
                    new Date(b.fecha_publicacion).getTime() -
                    new Date(a.fecha_publicacion).getTime()
                  )
                  .map((e, i) => {
                    const fecha = new Date(e.fecha_publicacion)
                    const fechaFmt =
                      String(fecha.getDate()).padStart(2, '0') + '/' +
                      String(fecha.getMonth() + 1).padStart(2, '0') + '/' +
                      fecha.getFullYear()

                    const colorRend = e.rendimiento != null
                      ? e.rendimiento > 0 ? C.green : C.red
                      : C.neutral

                    const bgRend = e.rendimiento != null
                      ? e.rendimiento > 0 ? C.greenBg : C.redBg
                      : 'transparent'

                    const rendLabel = e.rendimiento != null
                      ? (e.rendimiento > 0 ? '+' : '') + e.rendimiento.toFixed(2) + '%'
                      : '—'

                    return (
                      <tr
                        key={e.id}
                        onClick={() => router.push('/empresa/' + e.ticker)}
                        style={{ background: i % 2 === 0 ? C.bgRow : C.bgRowAlt, cursor: 'pointer' }}
                        onMouseEnter={el => { el.currentTarget.style.background = C.bgRowHover }}
                        onMouseLeave={el => { el.currentTarget.style.background = i % 2 === 0 ? C.bgRow : C.bgRowAlt }}
                      >
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid ' + C.border, color: C.textDim, whiteSpace: 'nowrap' }}>
                          {fechaFmt}
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid ' + C.border, color: C.textDim }}>
                          {e.tipo_idea}
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid ' + C.border }}>
                          <EstatusBadge estatus={e.estatus} />
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid ' + C.border }}>
                          <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>
                            {e.ticker}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid ' + C.border, color: C.text }}>
                          {e.nombre}
                        </td>
                        
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid ' + C.border }}>
                          <span style={{
                            color: C.text,
                            background: C.bgCard,
                            border: '1px solid ' + C.border,
                            borderRadius: 4,  
                            padding: '2px 8px',
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: 0.5,
                            whiteSpace: 'nowrap',
                            textAlign: 'center' 
                          }}>
                            {e.sector}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + C.border, color: C.textDim, width: 50, textAlign: 'center' }}>
                          {e.precio_publicacion}
                        </td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + C.border, color: C.text, fontWeight: 600, width: 50, textAlign: 'center' }}>
                          {e.precioActual != null ? e.precioActual.toFixed(2) : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid ' + C.border, textAlign: 'right' }}>
                          <span style={{
                            color: colorRend,
                            background: bgRend,
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                          }}>
                            {rendLabel}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}