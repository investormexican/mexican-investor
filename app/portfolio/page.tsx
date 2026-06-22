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
 
/* ── Responsive hook ─────────────────────────────────────────── */
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
 
/* ── Tipos de cambio ─────────────────────────────────────────── */
type Currency = 'USD' | 'CAD' | 'AUD' | 'EUR' | 'PLN' | 'MXN'
const FX_TICKERS: Record<Exclude<Currency, 'USD'>, string> = {
  CAD: 'CADUSD=X', AUD: 'AUDUSD=X', EUR: 'EURUSD=X', PLN: 'PLNUSD=X', MXN: 'MXNUSD=X',
}
const FX_FALLBACK: Record<Exclude<Currency, 'USD'>, number> = {
  CAD: 0.73, AUD: 0.65, EUR: 1.08, PLN: 0.25, MXN: 0.058,
}
 
async function getPrecio(ticker: string): Promise<number | null> {
  try {
    const res  = await fetch('/api/precio?ticker=' + encodeURIComponent(ticker))
    const data = await res.json()
    return data.precio ?? null
  } catch { return null }
}
 
async function getExchangeRates(): Promise<Record<string, number>> {
  const entries = Object.entries(FX_TICKERS) as [Exclude<Currency, 'USD'>, string][]
  const results = await Promise.all(
    entries.map(async ([currency, yahooTicker]) => {
      try {
        const res  = await fetch('/api/precio?ticker=' + encodeURIComponent(yahooTicker))
        const data = await res.json()
        return [currency, data.precio ?? FX_FALLBACK[currency]] as const
      } catch {
        return [currency, FX_FALLBACK[currency]] as const
      }
    })
  )
  return Object.fromEntries(results)
}
 
/* ── Conviction badge ──────────────────────────────────────────── */
// Valores esperados en Supabase: "High", "Medium", "Low"

function ConvictionBadge({ value }: { value: string }) {
  const v = (value ?? '').toLowerCase()
  const map: Record<string, { color: string; bg: string; label: string }> = {
    core:        { color: C.green,  bg: C.greenBg,  label: 'High'        },
    trade:       { color: C.yellow, bg: C.yellowBg, label: 'Medium'       },
    speculative: { color: C.red,    bg: C.redBg,    label: 'Low' },
  }
  const s = map[v] ?? { color: C.neutral, bg: 'transparent', label: value ?? '—' }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
      color: s.color, background: s.bg, border: `1px solid ${s.color}33`,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}
 
/* ── Stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '24px 28px',
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.textDim, margin: '0 0 10px' }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color ?? C.text, margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 12, color: C.textDim, margin: '8px 0 0' }}>{sub}</p>
      )}
    </div>
  )
}
 
/* ── Breakdown bar ───────────────────────────────────────────── */
function BreakdownBar({ label, pct, animated }: { label: string; pct: number; animated: boolean }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.textDim }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: animated ? `${pct}%` : '0%',
          background: C.accent,
          borderRadius: 99,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}
 
/* ── Page ────────────────────────────────────────────────────── */
export default function Portafolio() {
  const isMobile = useIsMobile()
  const [rows, setRows]                   = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null)
  const [barsAnimated, setBarsAnimated]   = useState(false)
 
  useEffect(() => {
    async function cargar() {
      const [fxRates, { data }] = await Promise.all([
        getExchangeRates(),
        supabase.from('portafolio').select('*').eq('activa', true)
      ])
      if (!data) return
 
      const conPrecios = await Promise.all(
        data.map(async (e) => {
          const precioActual  = await getPrecio(e.ticker)
          const moneda: string = (e.moneda ?? 'USD').toUpperCase()
          const toUSD         = moneda === 'USD' ? 1 : (fxRates[moneda] ?? 1)
          const precioUSD     = precioActual != null ? precioActual * toUSD : null
          const entrada       = Number(e.precio_entrada)
          const rendimiento   = precioActual && entrada
            ? ((precioActual - entrada) / entrada) * 100
            : null
          return { ...e, precioActual, precioUSD, moneda, rendimiento }
        })
      )
 
      const totalValueUSD = conPrecios.reduce((acc, e) =>
        e.precioUSD != null ? acc + e.precioUSD * e.cantidad : acc, 0)
 
      const final = conPrecios
        .map(e => ({
          ...e,
          peso: totalValueUSD && e.precioUSD != null
            ? (e.precioUSD * e.cantidad / totalValueUSD) * 100
            : 0,
        }))
        .sort((a, b) => b.peso - a.peso)
 
      setRows(final)
      setLoading(false)
      setTimeout(() => setBarsAnimated(true), 120)
    }
    cargar()
  }, [])
 
  /* ── Stats ── */
  const numHoldings = rows.length
  const top3Weight  = rows.slice(0, 3).reduce((acc, e) => acc + e.peso, 0)
  const largest     = rows[0]
 
  /* ── Breakdowns ponderados ── */
  function buildBreakdown(key: string) {
    const map: Record<string, number> = {}
    rows.forEach(e => {
      const k = e[key] ?? 'Unknown'
      map[k] = (map[k] ?? 0) + e.peso
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([label, pct]) => ({ label, pct }))
  }
 
  const byCountry = buildBreakdown('pais')
  const bySector  = buildBreakdown('sector')
 
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.sans }}>
      <Navbar />
      <main style={{
        maxWidth: 1280, margin: '0 auto',
        padding: isMobile ? '40px 20px 60px' : '60px 48px 80px',
      }}>
 
        {/* ── Header ── */}
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: C.textDim, marginBottom: 15 }}>
          Current Holdings
        </p>
        <h1 style={{ fontFamily: C.sans, fontSize: isMobile ? 28 : 36, fontWeight: 700, color: C.text, marginBottom: isMobile ? 28 : 40, lineHeight: 1.1 }}>
          My Portfolio
        </h1>
        <div style={{ width: 48, height: 2, background: C.border, marginBottom: isMobile ? 28 : 40 }} />
 
        {loading ? (
          <div style={{ color: C.textDim, fontSize: 15, paddingTop: 20 }}>Loading...</div>
        ) : (
          <>
            {/* ══ 1. FILOSOFÍA QGVM ══ */}
            <div style={{
              background: C.accent, borderRadius: 12,
              padding: isMobile ? '24px 20px' : '28px 36px',
              marginBottom: 32,
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: isMobile ? 20 : 0,
            }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#a0b8b4', margin: '0 0 6px' }}>
                  Investment Philosophy
                </p>
                <p style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#EEE7D7', margin: 0 }}>
                  The portfolio seeks to meet the QGVM filter
                </p>
              </div>
              <div style={{ display: 'flex', gap: isMobile ? 12 : 24, flexWrap: 'wrap' }}>
                {[
                  { letter: 'Q', word: 'Quality'  },
                  { letter: 'G', word: 'Growth'   },
                  { letter: 'V', word: 'Value'    },
                  { letter: 'M', word: 'Momentum' },
                ].map(({ letter, word }) => (
                  <div key={letter} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: '#6fcfa0', lineHeight: 1 }}>
                      {letter}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#a0b8b4', marginTop: 3 }}>
                      {word}
                    </div>
                  </div>
                ))}
              </div>
            </div>
 
            {/* ══ 2. TABLA ══ */}
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.textDim, margin: '0 0 16px' }}>
              All Positions
            </p>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', background: C.bgCard, marginBottom: 48 }}>
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ minWidth: isMobile ? 680 : 980, width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.bgCard }}>
                      {([
                        { label: '% of total', align: 'left'   },
                        { label: 'Ticker'                       },
                        { label: 'Name'                         },
                        { label: 'Country'                      },
                        { label: 'Sector'                       },
                        { label: 'Cost Basis', align: 'right'  },
                        { label: 'Return',     align: 'right'  },
                        { label: 'Conviction',   align: 'center' },
                      ] as { label: string; align?: string }[]).map(({ label, align }) => (
                        <th key={label} style={{
                          padding: '14px 16px',
                          textAlign: (align ?? 'left') as 'left' | 'right' | 'center',
                          fontSize: 12, fontWeight: 700, letterSpacing: 2,
                          textTransform: 'uppercase', color: C.textDim,
                          borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
                        }}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((e, i) => {
                      const isHovered = hoveredTicker === e.ticker
                      const rowBg     = isHovered ? C.bgRowHover : i % 2 ? C.bgRowAlt : C.bgRow
                      const rend: number | null = e.rendimiento
                      return (
                        <tr
                          key={e.ticker}
                          onMouseEnter={() => setHoveredTicker(e.ticker)}
                          onMouseLeave={() => setHoveredTicker(null)}
                          style={{ background: rowBg, transition: 'background 0.15s' }}
                        >
                          <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: C.text, borderBottom: `1px solid ${C.border}` }}>
                            {e.peso ? e.peso.toFixed(1) + '%' : '—'}
                          </td>
                          <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 14, color: C.accent, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                            {e.ticker}
                            {e.moneda !== 'USD' && (
                              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: C.textDim, background: C.border, borderRadius: 4, padding: '1px 5px', letterSpacing: 0.5 }}>
                                {e.moneda}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 14, color: C.text, borderBottom: `1px solid ${C.border}` }}>
                            {e.nombre}
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 14, color: C.textDim, borderBottom: `1px solid ${C.border}` }}>
                            {e.pais}
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 14, color: C.textDim, borderBottom: `1px solid ${C.border}` }}>
                            {e.sector}
                          </td>
                          <td style={{ padding: '13px 16px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                            {e.precio_entrada}
                          </td>
                          <td style={{
                            padding: '13px 16px', textAlign: 'right', fontSize: 14, fontWeight: 700,
                            color: rend == null ? C.neutral : rend >= 0 ? C.green : C.red,
                            borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
                          }}>
                            {rend != null ? (rend > 0 ? '+' : '') + rend.toFixed(2) + '%' : '—'}
                          </td>
                          {/* Conviction — lee e.conviccion;
                              si renombras la columna en Supabase */}
                          <td style={{ padding: '13px 16px', textAlign: 'center', borderBottom: `1px solid ${C.border}` }}>
                            <ConvictionBadge value={e.conviccion} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
 
            {/* ══ 3. STATS + BREAKDOWNS ══ */}
            <div style={{ width: 48, height: 2, background: C.border, marginBottom: 32 }} />
 
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.textDim, margin: '0 0 20px' }}>
              Portfolio Analytics
            </p>
 
            {/* Stats — 3 cards, más anchas al quitar el 4º */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}>
              <StatCard
                label="Holdings"
                value={String(numHoldings)}
                sub="Active positions"
              />
              <StatCard
                label="Largest Position"
                value={largest ? `${largest.peso.toFixed(1)}%` : '—'}
                sub={largest?.ticker ?? ''}
              />
              <StatCard
                label="Top 3 Weight"
                value={`${top3Weight.toFixed(1)}%`}
                sub={rows.slice(0, 3).map(e => e.ticker).join(' · ')}
              />
            </div>
 
            {/* Breakdowns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 12,
            }}>
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px 28px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.textDim, margin: '0 0 20px' }}>
                  By Country
                </p>
                {byCountry.map(({ label, pct }) => (
                  <BreakdownBar key={label} label={label} pct={pct} animated={barsAnimated} />
                ))}
              </div>
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px 28px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.textDim, margin: '0 0 20px' }}>
                  By Sector
                </p>
                {bySector.map(({ label, pct }) => (
                  <BreakdownBar key={label} label={label} pct={pct} animated={barsAnimated} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}