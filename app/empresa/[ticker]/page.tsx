'use client'
import { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
 
const C = {
  bg: '#EEE7D7',
  bgCard: '#E5DCC8',
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
    <span style={{ color: s.color, background: s.bg, padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
      Thesis: {estatus}
    </span>
  )
}
 
/* ── Metric Card ─────────────────────────────────────────────── */
function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px' }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.textDim, margin: 0 }}>
        {label}
      </p>
      <p style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '6px 0 0' }}>
        {value}
      </p>
    </div>
  )
}
 
/* ── Section label ───────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: C.textDim, margin: '0 0 12px' }}>
      {children}
    </p>
  )
}
 
/* ══════════════════════════════════════════════════════════════
   GRÁFICO DE PRECIO
   ══════════════════════════════════════════════════════════════ */
type PricePoint = { date: string; close: number }
 
function PriceChart({
  data,
  entryPrice,
  entryDate,
}: {
  data: PricePoint[]
  entryPrice: number
  entryDate: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth]           = useState(600)
  const [tooltip, setTooltip]       = useState<{ x: number; y: number; point: PricePoint } | null>(null)
  const [animated, setAnimated]     = useState(false)
 
  // Ancho responsivo
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => setWidth(entries[0].contentRect.width))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])
 
  // Animación de entrada
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])
 
  if (!data || data.length < 2) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textDim, fontSize: 14 }}>
        No price data available.
      </div>
    )
  }
 
  // Dimensiones
  const H         = 220
  const PAD       = { top: 24, right: 16, bottom: 36, left: 56 }
  const chartW    = width - PAD.left - PAD.right
  const chartH    = H - PAD.top - PAD.bottom
 
  const prices    = data.map(d => d.close)
  const minP      = Math.min(...prices, entryPrice) * 0.97
  const maxP      = Math.max(...prices, entryPrice) * 1.03
  const priceRange = maxP - minP
 
  // Mapear a coordenadas SVG
  const xOf = (i: number) => (i / (data.length - 1)) * chartW
  const yOf = (p: number) => chartH - ((p - minP) / priceRange) * chartH
 
  // Línea principal
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)} ${yOf(d.close).toFixed(1)}`)
    .join(' ')
 
  // Área bajo la curva (para gradiente)
  const areaPath =
    `${linePath} L ${xOf(data.length - 1).toFixed(1)} ${chartH} L 0 ${chartH} Z`
 
  // Color según rendimiento
  const lastPrice  = data[data.length - 1].close
  const isPositive = lastPrice >= entryPrice
  const lineColor  = isPositive ? C.green : C.red
 
  // Línea horizontal del precio de entrada
  const entryY = yOf(entryPrice)
 
  // Punto de entrada en el eje X (buscar la fecha más cercana)
  const entryTs    = new Date(entryDate).getTime()
  const entryIndex = data.reduce((best, d, i) => {
    const diff = Math.abs(new Date(d.date).getTime() - entryTs)
    return diff < Math.abs(new Date(data[best].date).getTime() - entryTs) ? i : best
  }, 0)
  const entryX = xOf(entryIndex)
 
  // Etiquetas del eje Y (4 valores)
  const yLabels = Array.from({ length: 4 }, (_, i) => minP + (priceRange * i) / 3)
 
  // Etiquetas del eje X (4-5 fechas distribuidas)
  const xLabelCount = width < 400 ? 3 : 5
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.round((i / (xLabelCount - 1)) * (data.length - 1))
    return { idx, label: new Date(data[idx].date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) }
  })
 
  // Interacción: encontrar punto más cercano al cursor
  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect  = e.currentTarget.getBoundingClientRect()
    const mx    = e.clientX - rect.left - PAD.left
    const ratio = Math.max(0, Math.min(1, mx / chartW))
    const idx   = Math.round(ratio * (data.length - 1))
    const point = data[idx]
    setTooltip({
      x: xOf(idx) + PAD.left,
      y: yOf(point.close) + PAD.top,
      point,
    })
  }
 
  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', userSelect: 'none' }}
    >
      <svg
        width={width}
        height={H}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ display: 'block', cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={lineColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
          {/* Clippath para animar la línea de izquierda a derecha */}
          <clipPath id="lineClip">
            <rect
              x="0" y="0"
              width={animated ? chartW : 0}
              height={chartH + 10}
              style={{ transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }}
            />
          </clipPath>
        </defs>
 
        <g transform={`translate(${PAD.left}, ${PAD.top})`}>
          {/* Líneas de cuadrícula horizontales */}
          {yLabels.map((val, i) => (
            <line
              key={i}
              x1={0} y1={yOf(val).toFixed(1)}
              x2={chartW} y2={yOf(val).toFixed(1)}
              stroke={C.border} strokeWidth={1} strokeDasharray="4 4"
            />
          ))}
 
          {/* Área */}
          <path d={areaPath} fill="url(#areaGrad)" clipPath="url(#lineClip)" />
 
          {/* Línea de precio */}
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            clipPath="url(#lineClip)"
          />
 
          {/* Línea de precio de entrada (horizontal punteada) */}
          <line
            x1={0} y1={entryY.toFixed(1)}
            x2={chartW} y2={entryY.toFixed(1)}
            stroke={C.textDim} strokeWidth={1.5} strokeDasharray="6 3"
            opacity={0.7}
          />
          {/* Etiqueta del precio de entrada */}
          <text
            x={4} y={entryY - 5}
            fontSize={10} fill={C.textDim} fontFamily={C.sans} fontWeight={700}
          >
            Entry {entryPrice}
          </text>
 
          {/* Punto de entrada en la línea */}
          <circle
            cx={entryX.toFixed(1)} cy={yOf(data[entryIndex]?.close ?? entryPrice).toFixed(1)}
            r={5} fill={C.accent} stroke="#EEE7D7" strokeWidth={2}
          />
 
          {/* Punto del precio actual */}
          <circle
            cx={xOf(data.length - 1).toFixed(1)} cy={yOf(lastPrice).toFixed(1)}
            r={5} fill={lineColor} stroke="#EEE7D7" strokeWidth={2}
          />
 
          {/* Eje Y — etiquetas */}
          {yLabels.map((val, i) => (
            <text
              key={i}
              x={-8} y={yOf(val) + 4}
              fontSize={10} fill={C.textDim} fontFamily={C.sans}
              textAnchor="end"
            >
              {val.toFixed(2)}
            </text>
          ))}
 
          {/* Eje X — etiquetas */}
          {xLabels.map(({ idx, label }) => (
            <text
              key={idx}
              x={xOf(idx)} y={chartH + 20}
              fontSize={10} fill={C.textDim} fontFamily={C.sans}
              textAnchor="middle"
            >
              {label}
            </text>
          ))}
 
          {/* Línea vertical del tooltip */}
          {tooltip && (
            <line
              x1={(tooltip.x - PAD.left).toFixed(1)} y1={0}
              x2={(tooltip.x - PAD.left).toFixed(1)} y2={chartH}
              stroke={C.textDim} strokeWidth={1} strokeDasharray="3 3"
            />
          )}
 
          {/* Punto del tooltip */}
          {tooltip && (
            <circle
              cx={(tooltip.x - PAD.left).toFixed(1)}
              cy={(tooltip.y - PAD.top).toFixed(1)}
              r={4} fill={lineColor} stroke="#EEE7D7" strokeWidth={2}
            />
          )}
        </g>
      </svg>
 
      {/* Tooltip flotante */}
      {tooltip && (() => {
        const TOOLTIP_W = 130
        const leftRaw   = tooltip.x + 12
        const leftFinal = leftRaw + TOOLTIP_W > width ? tooltip.x - TOOLTIP_W - 12 : leftRaw
        const rend = ((tooltip.point.close - entryPrice) / entryPrice) * 100
        const isPos = rend >= 0
        return (
          <div style={{
            position: 'absolute',
            left: leftFinal,
            top: Math.max(0, tooltip.y - 40),
            background: C.accent,
            color: '#EEE7D7',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            fontFamily: C.sans,
            fontWeight: 600,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10,
          }}>
            <div style={{ color: '#a0b8b4', fontSize: 10, marginBottom: 4 }}>
              {new Date(tooltip.point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {tooltip.point.close.toFixed(2)}
            </div>
            <div style={{ color: isPos ? '#6fcfa0' : '#f4a0a0', fontSize: 11, marginTop: 2 }}>
              {isPos ? '+' : ''}{rend.toFixed(2)}% vs entry
            </div>
          </div>
        )
      })()}
 
      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 20, marginTop: 8, paddingTop: 12, borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: lineColor }} />
          <span style={{ fontSize: 12, color: C.textDim }}>Price</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 2, background: C.textDim, borderRadius: 1 }} />
          <span style={{ fontSize: 12, color: C.textDim }}>Entry price</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.accent, border: '2px solid #EEE7D7', outline: `1px solid ${C.accent}` }} />
          <span style={{ fontSize: 12, color: C.textDim }}>Publication date</span>
        </div>
      </div>
    </div>
  )
}
 
/* ══════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════ */
export default function Empresa() {
  const params = useParams()
  const ticker = Array.isArray(params.ticker) ? params.ticker[0] : params.ticker
 
  const [data, setData]                     = useState<any>(null)
  const [articulos, setArticulos]           = useState<any[]>([])
  const [precioActual, setPrecioActual]     = useState<number | null>(null)
  const [rendimiento, setRendimiento]       = useState<number | null>(null)
  const [historico, setHistorico]           = useState<PricePoint[]>([])
  const [loadingChart, setLoadingChart]     = useState(true)
  const [hoveredArticulo, setHoveredArticulo] = useState<number | null>(null)
  const isMobile = useIsMobile()
 
  useEffect(() => {
    async function fetchData() {
      const res = await supabase
        .from('tres_en_tres')
        .select('*')
        .eq('ticker', ticker)
        .maybeSingle()
      if (!res.data) return
      setData(res.data)
 
      // Precio actual + rendimiento
      const resPrecio = await fetch('/api/precio?ticker=' + res.data.ticker)
      const p = (await resPrecio.json()).precio
      setPrecioActual(p)
      const pub = Number(res.data.precio_publicacion)
      if (p && pub) setRendimiento(((p - pub) / pub) * 100)
 
      // Artículos relacionados
      const arts = await supabase
        .from('articulos')
        .select('*')
        .eq('ticker', res.data.ticker)
        .order('fecha', { ascending: false })
      setArticulos(arts.data || [])
 
      // Histórico de precios (desde la fecha de publicación)
      try {
        const resH = await fetch(
          `/api/historico?ticker=${encodeURIComponent(res.data.ticker)}&desde=${res.data.fecha_publicacion}`
        )
        const jsonH = await resH.json()
        setHistorico(jsonH.data ?? [])
      } catch {
        setHistorico([])
      } finally {
        setLoadingChart(false)
      }
    }
 
    if (ticker) fetchData()
  }, [ticker])
 
  if (!data) return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.sans }}>
      <Navbar />
      <div style={{ padding: 48, color: C.textDim, fontSize: 15 }}>Loading...</div>
    </div>
  )
 
  const rendPositive = rendimiento != null && rendimiento >= 0
  const rendColor    = rendimiento == null ? C.neutral : rendPositive ? C.green : C.red
  const rendBg       = rendimiento == null ? 'transparent' : rendPositive ? C.greenBg : C.redBg
 
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.sans }}>
      <Navbar />
      <main style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: isMobile ? '32px 20px 60px' : '52px 48px 80px',
      }}>
 
        {/* Back link */}
        <Link href="/small-caps" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32, color: C.textDim, textDecoration: 'none', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
          ← Back to Investment Ideas
        </Link>
 
        {/* Header */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: C.textDim, margin: '0 0 8px' }}>
          {data.pais} · {data.sector}
        </p>
        <h1 style={{ fontFamily: C.sans, fontSize: isMobile ? 28 : 40, fontWeight: 700, color: C.text, lineHeight: 1.1, margin: '0 0 16px' }}>
          {data.nombre}
          <span style={{ color: C.textDim, fontWeight: 400, marginLeft: 12 }}>{data.ticker}</span>
        </h1>
 
        {/* Badges */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
          <EstatusBadge estatus={data.estatus} />
          {rendimiento != null && (
            <span style={{ color: rendColor, background: rendBg, padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
              Performance: {rendimiento > 0 ? '+' : ''}{rendimiento.toFixed(2)}%
            </span>
          )}
        </div>
 
        <div style={{ width: 48, height: 2, background: C.border, marginBottom: 40 }} />
 
        {/* Prices */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(2, 200px)', gap: 12, marginBottom: 48 }}>
          <MetricCard label="Publication Price" value={data.precio_publicacion} />
          <MetricCard label="Current Price"     value={precioActual != null ? precioActual.toFixed(2) : '—'} />
        </div>
 
        {/* ══ GRÁFICO DE PRECIO ══ */}
        <section style={{ marginBottom: 48 }}>
          <SectionLabel>Price since publication</SectionLabel>
          <div style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: isMobile ? '20px 12px 16px' : '24px 24px 20px',
          }}>
            {loadingChart ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textDim, fontSize: 14 }}>
                Loading chart...
              </div>
            ) : (
              <PriceChart
                data={historico}
                entryPrice={Number(data.precio_publicacion)}
                entryDate={data.fecha_publicacion}
              />
            )}
          </div>
        </section>
 
        {/* Investment Thesis */}
        <section style={{ marginBottom: 48 }}>
          <SectionLabel>Investment Thesis</SectionLabel>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? '20px 18px' : '28px 32px' }}>
            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
              {data.tesis}
            </p>
          </div>
        </section>
 
        {/* Key Ratios */}
        <section style={{ marginBottom: 48 }}>
          <SectionLabel>Key Ratios</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
            <MetricCard label="Sales Growth" value={`${data.revenue_growth_yoy}%`} />
            <MetricCard label="FCF Growth"   value={`${data.fcf_growth}%`} />
            <MetricCard label="Gross Margin" value={`${data.gross_margin}%`} />
            <MetricCard label="FCF Margin"   value={`${data.fcf_margin}%`} />
          </div>
        </section>
 
        {/* Related Articles */}
        <section>
          <SectionLabel>Related Articles</SectionLabel>
          {articulos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {articulos.map(a => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setHoveredArticulo(a.id)}
                  onMouseLeave={() => setHoveredArticulo(null)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    background: hoveredArticulo === a.id ? '#DDD5C0' : C.bgCard,
                    border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 20px',
                    color: C.text, textDecoration: 'none', fontSize: 14, fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                >
                  <span>{a.titulo}</span>
                  <span style={{ color: C.textDim, fontSize: 12, whiteSpace: 'nowrap' }}>→</span>
                </a>
              ))}
            </div>
          ) : (
            <p style={{ color: C.textDim, fontSize: 14 }}>No articles available.</p>
          )}
        </section>
      </main>
    </div>
  )
}