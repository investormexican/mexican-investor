'use client'
import { useEffect, useState } from 'react'
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
 
/* ── Responsive hook ───────────────────────────────────────────── */
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
 
/* ── Estatus Badge ─────────────────────────────────────────────── */
function EstatusBadge({ estatus }: { estatus: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    Intact: { color: C.green, bg: C.greenBg },
    Risk:    { color: C.amber, bg: C.amberBg },
    Broken:    { color: C.red,   bg: C.redBg   },
  }
  const s = map[estatus] ?? { color: C.neutral, bg: 'transparent' }
  return (
    <span style={{
      color: s.color,
      background: s.bg,
      padding: '5px 14px',
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      Thesis: {estatus}
    </span>
  )
}
 
/* ── Metric Card ───────────────────────────────────────────────── */
function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: '16px 20px',
    }}>
      <p style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: 'uppercase',
        color: C.textDim,
        marginBottom: 6,
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 20,
        fontWeight: 700,
        color: C.text,
      }}>
        {value}
      </p>
    </div>
  )
}
 
/* ── Page ──────────────────────────────────────────────────────── */
export default function Empresa() {
  const params = useParams()
  const ticker = Array.isArray(params.ticker) ? params.ticker[0] : params.ticker
 
  const [data, setData] = useState<any>(null)
  const [articulos, setArticulos] = useState<any[]>([])
  const [precioActual, setPrecioActual] = useState<number | null>(null)
  const [rendimiento, setRendimiento] = useState<number | null>(null)
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
 
      const resPrecio = await fetch('/api/precio?ticker=' + res.data.ticker)
      const p = (await resPrecio.json()).precio
      setPrecioActual(p)
 
      const pub = Number(res.data.precio_publicacion)
      if (p && pub) setRendimiento(((p - pub) / pub) * 100)
 
      const arts = await supabase
        .from('articulos')
        .select('*')
        .eq('ticker', res.data.ticker)
        .order('fecha', { ascending: false })
      setArticulos(arts.data || [])
    }
    if (ticker) fetchData()
  }, [ticker])
 
  if (!data) return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.sans }}>
      <Navbar />
      <div style={{ padding: 48, color: C.textDim, fontSize: 15 }}>Cargando...</div>
    </div>
  )
 
  const rendPositive = rendimiento != null && rendimiento >= 0
  const rendColor = rendimiento == null ? C.neutral : rendPositive ? C.green : C.red
  const rendBg    = rendimiento == null ? 'transparent' : rendPositive ? C.greenBg : C.redBg
 
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.sans }}>
      <Navbar />
 
      <main style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: isMobile ? '32px 20px 60px' : '52px 48px 80px',
      }}>
 
        {/* ── Back link ── */}
        <Link href="/small-caps" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 32,
          color: C.textDim,
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          ← Back to Investment Ideas
        </Link>
 
        {/* ── Header ── */}
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: C.textDim,
          marginBottom: 8,
        }}>
          {data.pais} · {data.sector}
        </p>
        <h1 style={{
          fontFamily: C.sans,
          fontSize: isMobile ? 28 : 40,
          fontWeight: 700,
          color: C.text,
          lineHeight: 1.1,
          marginBottom: 16,
        }}>
          {data.nombre}
          <span style={{ color: C.textDim, fontWeight: 400, marginLeft: 12 }}>
            {data.ticker}
          </span>
        </h1>
 
        {/* ── Badges ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
          <EstatusBadge estatus={data.estatus} />
          {rendimiento != null && (
            <span style={{
              color: rendColor,
              background: rendBg,
              padding: '5px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}>
              Performance: {rendimiento > 0 ? '+' : ''}{rendimiento.toFixed(2)}%
            </span>
          )}
        </div>
 
        {/* ── Divider ── */}
        <div style={{ width: 48, height: 2, background: C.border, marginBottom: 40 }} />
 
        {/* ── Precios ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(2, 200px)',
          gap: 12,
          marginBottom: 48,
        }}>
          <MetricCard label="Publication Price" value={data.precio_publicacion} />
          <MetricCard label="Current Price"  value={precioActual != null ? precioActual.toFixed(2) : '—'} />
        </div>
 
        {/* ── Tesis ── */}
        <section style={{ marginBottom: 48 }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: C.textDim,
            marginBottom: 12,
          }}>
            Investment Thesis
          </p>
          <div style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: isMobile ? '20px 18px' : '28px 32px',
          }}>
            <p style={{
              fontSize: 15,
              color: C.text,
              lineHeight: 1.75,
              margin: 0,
            }}>
              {data.tesis}
            </p>
          </div>
        </section>
 
        {/* ── Métricas ── */}
        <section style={{ marginBottom: 48 }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: C.textDim,
            marginBottom: 12,
          }}>
            Key Ratios
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: 12,
          }}>
            <MetricCard label="Sales Growth" value={`${data.revenue_growth_yoy}%`} />
            <MetricCard label="FCF Growth"    value={`${data.fcf_growth}%`} />
            <MetricCard label="Gross Margin"        value={`${data.gross_margin}%`} />
            <MetricCard label="FCF Margin"          value={`${data.fcf_margin}%`} />
            
          </div>
        </section>
 
        {/* ── Artículos ── */}
        <section>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: C.textDim,
            marginBottom: 12,
          }}>
            Related Articles
          </p>
          {articulos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {articulos.map(a => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    background: C.bgCard,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: '14px 20px',
                    color: C.text,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#DDD5C0')}
                  onMouseLeave={e => (e.currentTarget.style.background = C.bgCard)}
                >
                  <span>{a.titulo}</span>
                  <span style={{ color: C.textDim, fontSize: 12, whiteSpace: 'nowrap' }}>→</span>
                </a>
              ))}
            </div>
          ) : (
            <p style={{ color: C.textDim, fontSize: 14 }}>No hay artículos disponibles.</p>
          )}
        </section>
 
      </main>
    </div>
  )
}