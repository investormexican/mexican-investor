'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
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
  greenBg: 'rgba(26,92,58,0.12)',
  yellow: '#7a5c00',
  yellowBg: 'rgba(180,140,0,0.12)',
  red: '#8b2020',
  redBg: 'rgba(139,32,32,0.12)',
  neutral: '#6b7280',
  accent: '#244143',
  sans: "var(--font-dm-sans), 'Helvetica Neue', sans-serif",
}
 
/* ── Responsive hook ─────────────────────────────────────────────── */
function useIsMobile(bp = 640) {
  const [v, setV] = useState(false)
  useEffect(() => {
    const fn = () => setV(window.innerWidth < bp)
    fn()
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [bp])
  return v
}
 
/* ── Tipos de cambio soportados ──────────────────────────────────── */
type Currency = 'USD' | 'CAD' | 'AUD' | 'EUR' | 'PLN' | 'MXN'
 
const FX_TICKERS: Record<Exclude<Currency, 'USD'>, string> = {
  CAD: 'CADUSD=X',
  AUD: 'AUDUSD=X',
  EUR: 'EURUSD=X',
  PLN: 'PLNUSD=X',
  MXN: 'MXNUSD=X',
}
 
const FX_FALLBACK: Record<Exclude<Currency, 'USD'>, number> = {
  CAD: 0.73,
  AUD: 0.65,
  EUR: 1.08,
  PLN: 0.25,
  MXN: 0.058,
}
 
/* ── API helpers ─────────────────────────────────────────────────── */
async function getPrecio(ticker: string): Promise<number | null> {
  try {
    const res = await fetch('/api/precio?ticker=' + encodeURIComponent(ticker))
    const data = await res.json()
    return data.precio ?? null
  } catch {
    return null
  }
}
 
/**
 * Obtiene tipos de cambio a USD en tiempo real desde Yahoo Finance.
 * Fallback a valores aproximados si la llamada falla.
 */
async function getExchangeRates(): Promise<Record<string, number>> {
  const entries = Object.entries(FX_TICKERS) as [Exclude<Currency, 'USD'>, string][]
  const results = await Promise.all(
    entries.map(async ([currency, yahooTicker]) => {
      try {
        const res = await fetch('/api/precio?ticker=' + encodeURIComponent(yahooTicker))
        const data = await res.json()
        return [currency, data.precio ?? FX_FALLBACK[currency]] as const
      } catch {
        return [currency, FX_FALLBACK[currency]] as const
      }
    })
  )
  return Object.fromEntries(results)
}
 
/* ── Convicción badge ────────────────────────────────────────────── */
function ConviccionBadge({ value }: { value: string }) {
  const v = (value ?? '').toLowerCase()
 
  let color: string
  let bg: string
  let label: string
 
  if (v === 'high') {
    color = C.green
    bg = C.greenBg
    label = 'High'
  } else if (v === 'medium') {
    color = C.yellow
    bg = C.yellowBg
    label = 'Medium'
  } else if (v === 'low') {
    color = C.red
    bg = C.redBg
    label = 'Low'
  } else {
    color = C.neutral
    bg = 'transparent'
    label = value ?? '—'
  }
 
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.5,
        color,
        background: bg,
        border: `1px solid ${color}33`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
 
/* ── Page ────────────────────────────────────────────────────────── */
export default function Portafolio() {
  const isMobile = useIsMobile()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null)
  const [fx, setFx] = useState<Record<string, number> | null>(null)
 
  useEffect(() => {
    async function cargar() {
      // 1. Obtener tipos de cambio y datos de Supabase en paralelo
      const [fxRates, { data }] = await Promise.all([
        getExchangeRates(),
        supabase.from('portafolio').select('*'),
      ])
 
      setFx(fxRates)
 
      if (!data) return
 
      // 2. Obtener precios actuales de todos los tickers
      const conPrecios = await Promise.all(
        data.map(async (e) => {
          const precioActual = await getPrecio(e.ticker)
          const moneda: string = (e.moneda ?? 'USD').toUpperCase()
 
          // Tipo de cambio a USD (1 si ya es USD)
          const toUSD = moneda === 'USD' ? 1 : (fxRates[moneda] ?? 1)
 
          // Precio en USD para cálculo de pesos
          const precioUSD = precioActual != null ? precioActual * toUSD : null
 
          const entrada = Number(e.precio_entrada)
          const rendimiento =
            precioActual && entrada
              ? ((precioActual - entrada) / entrada) * 100
              : null
 
          return { ...e, precioActual, precioUSD, moneda, rendimiento }
        })
      )
 
      // 3. Calcular valor total del portafolio en USD
      const totalValueUSD = conPrecios.reduce((acc, e) => {
        return e.precioUSD != null ? acc + e.precioUSD * e.cantidad : acc
      }, 0)
 
      // 4. Calcular peso de cada posición usando precios en USD
      const final = conPrecios.map((e) => ({
        ...e,
        peso:
          totalValueUSD && e.precioUSD != null
            ? (e.precioUSD * e.cantidad / totalValueUSD) * 100
            : 0,
      }))
 
      // 5. Ordenar de mayor a menor peso
      final.sort((a, b) => b.peso - a.peso)
 
      setRows(final)
      setLoading(false)
    }
 
    cargar()
  }, [])
 
  const headers: { label: string; align?: 'right' | 'left' | 'center' }[] = [
    { label: '% of total', align: 'left' },
    { label: 'Ticker' },
    { label: 'Name' },
    { label: 'Country' },
    { label: 'Sector' },
    { label: 'Cost Basis', align: 'right' },
    { label: 'Return', align: 'right' },
    { label: 'Conviction', align: 'center' },
  ]
 
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.sans }}>
      <Navbar />
      <main
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: isMobile ? '40px 20px 60px' : '60px 48px 80px',
        }}
      >
        {/* ── Section label + heading ── */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: C.textDim,
            marginBottom: 15,
          }}
        >
          Current Holdings
        </p>
        <h1
          style={{
            fontFamily: C.sans,
            fontSize: isMobile ? 28 : 36,
            fontWeight: 700,
            color: C.text,
            marginBottom: isMobile ? 28 : 40,
            lineHeight: 1.1,
          }}
        >
          My Portfolio
        </h1>
 
        {/* ── Divider ── */}
        <div
          style={{
            width: 48,
            height: 2,
            background: C.border,
            marginBottom: isMobile ? 28 : 40,
          }}
        />
 
        {loading ? (
          <div style={{ color: C.textDim, fontSize: 15, paddingTop: 20 }}>
            Cargando...
          </div>
        ) : (
          <div
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              overflow: 'clip',
              background: C.bgCard,
            }}
          >
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table
                style={{
                  minWidth: isMobile ? 680 : 980,
                  width: '100%',
                  borderCollapse: 'collapse',
                }}
              >
                <thead>
                  <tr style={{ background: C.bgCard }}>
                    {headers.map(({ label, align }) => (
                      <th
                        key={label}
                        style={{
                          padding: '14px 16px',
                          textAlign: align ?? 'left',
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: 2,
                          textTransform: 'uppercase',
                          color: C.textDim,
                          borderBottom: `1px solid ${C.border}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e, i) => {
                    const isHovered = hoveredTicker === e.ticker
                    const rowBg = isHovered
                      ? C.bgRowHover
                      : i % 2
                      ? C.bgRowAlt
                      : C.bgRow
                    const rend: number | null = e.rendimiento
 
                    return (
                      <tr
                        key={e.ticker}
                        onMouseEnter={() => setHoveredTicker(e.ticker)}
                        onMouseLeave={() => setHoveredTicker(null)}
                        style={{
                          background: rowBg,
                          transition: 'background 0.15s',
                        }}
                      >
                        {/* % of total */}
                        <td
                          style={{
                            padding: '13px 16px',
                            textAlign: 'right',
                            fontWeight: 700,
                            fontSize: 14,
                            color: C.text,
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          {e.peso ? e.peso.toFixed(1) + '%' : '—'}
                        </td>
 
                        {/* Ticker + moneda */}
                        <td
                          style={{
                            padding: '13px 16px',
                            fontWeight: 700,
                            fontSize: 14,
                            color: C.accent,
                            borderBottom: `1px solid ${C.border}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {e.ticker}
                          {e.moneda !== 'USD' && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 10,
                                fontWeight: 600,
                                color: C.textDim,
                                background: C.border,
                                borderRadius: 4,
                                padding: '1px 5px',
                                letterSpacing: 0.5,
                              }}
                            >
                              {e.moneda}
                            </span>
                          )}
                        </td>
 
                        {/* Nombre */}
                        <td
                          style={{
                            padding: '13px 16px',
                            fontSize: 14,
                            color: C.text,
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          {e.nombre}
                        </td>
 
                        {/* País */}
                        <td
                          style={{
                            padding: '13px 16px',
                            fontSize: 14,
                            color: C.textDim,
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          {e.pais}
                        </td>
 
                        {/* Sector */}
                        <td
                          style={{
                            padding: '13px 16px',
                            fontSize: 14,
                            color: C.textDim,
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          {e.sector}
                        </td>
 
                        {/* Cost Basis */}
                        <td
                          style={{
                            padding: '13px 16px',
                            textAlign: 'right',
                            fontSize: 14,
                            fontWeight: 600,
                            color: C.text,
                            borderBottom: `1px solid ${C.border}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {e.precio_entrada}
                        </td>
 
                        {/* Rendimiento */}
                        <td
                          style={{
                            padding: '13px 16px',
                            textAlign: 'right',
                            fontSize: 14,
                            fontWeight: 700,
                            color:
                              rend == null
                                ? C.neutral
                                : rend >= 0
                                ? C.green
                                : C.red,
                            borderBottom: `1px solid ${C.border}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {rend != null
                            ? (rend > 0 ? '+' : '') + rend.toFixed(2) + '%'
                            : '—'}
                        </td>
 
                        {/* Convicción */}
                        <td
                          style={{
                            padding: '13px 16px',
                            textAlign: 'center',
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          <ConviccionBadge value={e.conviccion} />
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