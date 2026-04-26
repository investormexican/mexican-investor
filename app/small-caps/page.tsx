'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const C = {
  bg: '#EEE7D7',
  bgCard: '#E5DCC8',
  bgRow: '#EEE7D7',
  bgRowAlt: '#E8E1CE',
  bgRowHover: '#DDD5C0',
  border: '#C9BFA8',
  text: '#244143',
  textDim: '#5a7a6e',
  green: '#1a5c3a',
  greenBg: 'rgba(26,92,58,0.10)',
  red: '#8b2020',
  redBg: 'rgba(139,32,32,0.10)',
  amber: '#92620a',
  amberBg: 'rgba(146,98,10,0.10)',
  neutral: '#6b7280',
  accent: '#244143',
  sans: "var(--font-dm-sans), 'Helvetica Neue', sans-serif",
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

/* ── Responsive hook ─────────────────────────────────────────── */
function useIsMobile(bp = 640) {
  const [v, setV] = useState(false)
  useLayoutEffect(() => {
    const fn = () => setV(window.innerWidth < bp)
    fn()
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [bp])
  return v
}

/* ── Estatus Badge ───────────────────────────────────────────── */
function EstatusBadge({ estatus }: { estatus: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    Intact: { color: C.green, bg: C.greenBg },
    Risk:   { color: C.amber, bg: C.amberBg },
    Broken: { color: C.red,   bg: C.redBg   },
  }
  const s = map[estatus] ?? { color: C.neutral, bg: 'transparent' }
  return (
    <span style={{
      color: s.color,
      background: s.bg,
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {estatus}
    </span>
  )
}

/* ── API helper ──────────────────────────────────────────────── */
async function getPrecio(ticker: string): Promise<number | null> {
  try {
    const res = await fetch('/api/precio?ticker=' + ticker)
    const data = await res.json()
    return data.precio ?? null
  } catch {
    return null
  }
}

/* ── Estilos compartidos de celda ────────────────────────────── */
const thBase: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 2,
  textTransform: 'uppercase',
  color: C.textDim,
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: 'nowrap',
  textAlign: 'left',
}

/* ── Page ────────────────────────────────────────────────────── */
export default function SmallCaps() {
  const [rows, setRows]       = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const isMobile = useIsMobile()
  const router   = useRouter()

  useEffect(() => {
    async function cargarDatos() {
      const { data } = await supabase
        .from('tres_en_tres')
        .select('*')
        .order('fecha_publicacion', { ascending: false })

      if (!data) return

      const conPrecios = await Promise.all(
        data.map(async (e) => {
          const precioActual = await getPrecio(e.ticker)
          const pub = Number(e.precio_publicacion)
          const rendimiento =
            precioActual != null && pub
              ? ((precioActual - pub) / pub) * 100
              : null
          return { ...e, precioActual, rendimiento }
        })
      )

      setRows(conPrecios)
      setLoading(false)
    }
    cargarDatos()
  }, [])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.sans }}>
      <Navbar />

      <main style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: isMobile ? '40px 20px 60px' : '60px 48px 80px',
      }}>

        {/* Encabezado */}
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: C.textDim,
          marginBottom: 15,
        }}>
          Tracking shared ideas
        </p>

        <h1 style={{
          fontFamily: C.sans,
          fontSize: isMobile ? 28 : 36,
          fontWeight: 700,
          color: C.text,
          marginBottom: isMobile ? 28 : 40,
          lineHeight: 1.1,
        }}>
          Investment Ideas
        </h1>

        <div style={{ width: 48, height: 2, background: C.border, marginBottom: isMobile ? 28 : 40 }} />

        {/* Tabla */}
        {loading ? (
          <div style={{ color: C.textDim, fontSize: 15, paddingTop: 20 }}>Loading...</div>
        ) : (
          <div style={{
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: 'clip',       // clip: recorta visualmente sin romper sticky
            background: C.bgCard,
          }}>
            <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{
                minWidth: isMobile ? 700 : 1000,
                width: '100%',
                borderCollapse: 'collapse',
              }}>

                <thead>
                  <tr style={{ background: C.bgCard }}>

                    {/* Ticker sticky */}
                    <th style={{
                      ...thBase,
                      position: 'sticky',
                      left: 0,
                      background: C.bgCard,
                      zIndex: 3,
                      fontSize: 12,
                    }}>
                      Ticker
                    </th>

                    {/* Name */}
                    <th style={{ ...thBase, background: C.bgCard }}>Name</th>

                    {/* Resto de columnas */}
                    {(['Date', 'Type', 'Status', 'Sector', 'Entry Price', 'Current', 'Return'] as const).map(h => (
                      <th key={h} style={{
                        ...thBase,
                        textAlign: ['Entry Price', 'Current', 'Return'].includes(h) ? 'right' : 'left',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((e, i) => {
                    const isHovered = hoveredId === e.id
                    const rowBg = isHovered
                      ? C.bgRowHover
                      : i % 2 ? C.bgRowAlt : C.bgRow

                    const tdBase: React.CSSProperties = {
                      borderBottom: `1px solid ${C.border}`,
                      padding: '13px 16px',
                    }

                    return (
                      <tr
                        key={e.id}
                        onClick={() => router.push('/empresa/' + e.ticker)}
                        onMouseEnter={() => setHoveredId(e.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{
                          background: rowBg,
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                      >
                        {/* Ticker sticky */}
                        <td style={{
                          ...tdBase,
                          position: 'sticky',
                          left: 0,
                          background: rowBg,
                          zIndex: 2,
                          fontWeight: 700,
                          fontSize: 14,
                          color: C.accent,
                          transition: 'background 0.15s',
                        }}>
                          {e.ticker}
                        </td>

                        {/* Name */}
                        <td style={{ ...tdBase, fontSize: 14, color: C.text }}>
                          {e.nombre}
                        </td>

                        {/* Date */}
                        <td style={{ ...tdBase, fontSize: 13, color: C.textDim, whiteSpace: 'nowrap' }}>
                          {new Date(e.fecha_publicacion).toLocaleDateString('es-US')}
                        </td>

                        {/* Type */}
                        <td style={{ ...tdBase, fontSize: 13, color: C.textDim, whiteSpace: 'nowrap' }}>
                          {e.tipo_idea}
                        </td>

                        {/* Status */}
                        <td style={tdBase}>
                          <EstatusBadge estatus={e.estatus} />
                        </td>

                        {/* Sector */}
                        <td style={{ ...tdBase, fontSize: 13, color: C.textDim }}>
                          {e.sector}
                        </td>

                        {/* Entry Price */}
                        <td style={{ ...tdBase, fontSize: 14, color: C.text, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {e.precio_publicacion}
                        </td>

                        {/* Current */}
                        <td style={{ ...tdBase, fontSize: 14, color: C.text, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {e.precioActual?.toFixed(2) ?? '—'}
                        </td>

                        {/* Return */}
                        <td style={{
                          ...tdBase,
                          fontSize: 14,
                          fontWeight: 700,
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                          color: e.rendimiento == null
                            ? C.neutral
                            : e.rendimiento >= 0 ? C.green : C.red,
                        }}>
                          {e.rendimiento != null
                            ? (e.rendimiento > 0 ? '+' : '') + e.rendimiento.toFixed(2) + '%'
                            : '—'}
                        </td>

                      </tr>
                    )
                  })}
                </tbody>

              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}