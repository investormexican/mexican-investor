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
 
const PAGE_SIZE = 15
 
type SortCol = 'ticker' | 'nombre' | 'fecha_publicacion' | 'tipo_idea' | 'estatus' | 'sector' | 'precio_publicacion' | 'precioActual' | 'rendimiento'
type SortDir = 'asc' | 'desc'
 
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
 
/* ── Select de filtro ────────────────────────────────────────── */
function FilterSelect({
  label, value, options, onChange,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: C.textDim }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          fontFamily: C.sans, fontSize: 13, fontWeight: 600, color: C.text,
          background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6,
          padding: '6px 28px 6px 10px', cursor: 'pointer',
          appearance: 'none', WebkitAppearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235a7a6e' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
          minWidth: 130, outline: 'none',
        }}
      >
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
 
/* ── Icono de ordenación ─────────────────────────────────────── */
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: 10 }}>
      {active ? (dir === 'asc' ? '▲' : '▼') : '⬍'}
    </span>
  )
}
 
/* ── Cabecera de columna ordenable ───────────────────────────── */
function SortableTh({
  label, col, sortCol, sortDir, onSort, align = 'left',
}: {
  label: string; col: SortCol; sortCol: SortCol; sortDir: SortDir
  onSort: (col: SortCol) => void; align?: 'left' | 'right'
}) {
  const active = sortCol === col
  return (
    <th
      onClick={() => onSort(col)}
      style={{
        padding: '14px 16px',
        fontSize: 11, fontWeight: 700, letterSpacing: 2,
        textTransform: 'uppercase', color: active ? C.text : C.textDim,
        borderBottom: `1px solid ${C.border}`,
        whiteSpace: 'nowrap', textAlign: align,
        cursor: 'pointer', userSelect: 'none',
        transition: 'color 0.15s',
      }}
    >
      {label}
      <SortIcon active={active} dir={sortDir} />
    </th>
  )
}
 
/* ── Lógica de ordenación ────────────────────────────────────── */
function sortRows(rows: Empresa[], col: SortCol, dir: SortDir): Empresa[] {
  return [...rows].sort((a, b) => {
    let aVal: string | number | null | undefined
    let bVal: string | number | null | undefined
 
    if (col === 'rendimiento') {
      aVal = a.rendimiento ?? -Infinity
      bVal = b.rendimiento ?? -Infinity
    } else if (col === 'precioActual') {
      aVal = a.precioActual ?? -Infinity
      bVal = b.precioActual ?? -Infinity
    } else if (col === 'precio_publicacion') {
      aVal = Number(a.precio_publicacion)
      bVal = Number(b.precio_publicacion)
    } else if (col === 'fecha_publicacion') {
      aVal = new Date(a.fecha_publicacion).getTime()
      bVal = new Date(b.fecha_publicacion).getTime()
    } else {
      aVal = (a[col] as string)?.toLowerCase() ?? ''
      bVal = (b[col] as string)?.toLowerCase() ?? ''
    }
 
    if (aVal! < bVal!) return dir === 'asc' ? -1 : 1
    if (aVal! > bVal!) return dir === 'asc' ? 1 : -1
    return 0
  })
}
 
/* ── Page ────────────────────────────────────────────────────── */
export default function SmallCaps() {
  const [rows, setRows]           = useState<Empresa[]>([])
  const [loading, setLoading]     = useState(true)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
 
  // Filtros
  const [filterTipo, setFilterTipo]       = useState('')
  const [filterEstatus, setFilterEstatus] = useState('')
  const [filterSector, setFilterSector]   = useState('')
 
  // Ordenación — por defecto: fecha desc (más reciente primero)
  const [sortCol, setSortCol] = useState<SortCol>('fecha_publicacion')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
 
  // Paginación
  const [page, setPage] = useState(0)
 
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
 
  // Resetear página al cambiar filtros u ordenación
  useEffect(() => { setPage(0) }, [filterTipo, filterEstatus, filterSector, sortCol, sortDir])
 
  // Opciones únicas para filtros
  const tipos    = [...new Set(rows.map(e => e.tipo_idea).filter(Boolean))]
  const estatus  = [...new Set(rows.map(e => e.estatus).filter(Boolean))]
  const sectores = [...new Set(rows.map(e => e.sector).filter(Boolean))]
 
  // Pipeline: filtrar → ordenar → paginar
  const filtered = rows.filter(e =>
    (!filterTipo    || e.tipo_idea === filterTipo) &&
    (!filterEstatus || e.estatus   === filterEstatus) &&
    (!filterSector  || e.sector    === filterSector)
  )
  const sorted     = sortRows(filtered, sortCol, sortDir)
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageRows   = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
 
  // Promedio de rendimiento (filas filtradas con precio disponible)
  const withReturn = filtered.filter(e => e.rendimiento != null)
  const avgReturn  = withReturn.length
    ? withReturn.reduce((acc, e) => acc + e.rendimiento!, 0) / withReturn.length
    : null
 
  const anyFilterActive = filterTipo || filterEstatus || filterSector
 
  // Manejador de clic en cabecera: misma col invierte dirección, col nueva → desc
  function handleSort(col: SortCol) {
    if (col === sortCol) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }
 
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.sans }}>
      <Navbar />
      <main style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: isMobile ? '40px 20px 60px' : '60px 48px 80px',
      }}>
 
        {/* ── Encabezado ── */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: C.textDim, marginBottom: 15 }}>
          Tracking shared ideas
        </p>
        <h1 style={{ fontFamily: C.sans, fontSize: isMobile ? 28 : 36, fontWeight: 700, color: C.text, marginBottom: isMobile ? 16 : 20, lineHeight: 1.1 }}>
          Investment Ideas
        </h1>
        <p style={{ fontSize: 16, color: C.textDim, marginBottom: isMobile ? 20 : 24, maxWidth: 600, lineHeight: 1.5 }}>
          Click on any ticker to view the full investment thesis and related articles.
        </p>
        <div style={{ width: 48, height: 2, background: C.border, marginBottom: isMobile ? 24 : 32 }} />
 
        {/* ── Filtros + promedio ── */}
        {!loading && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end',
            justifyContent: 'space-between', gap: 16, marginBottom: 20,
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <FilterSelect label="Type"   value={filterTipo}    options={tipos}    onChange={setFilterTipo} />
              <FilterSelect label="Status" value={filterEstatus} options={estatus}  onChange={setFilterEstatus} />
              <FilterSelect label="Sector" value={filterSector}  options={sectores} onChange={setFilterSector} />
              {anyFilterActive && (
                <button
                  onClick={() => { setFilterTipo(''); setFilterEstatus(''); setFilterSector('') }}
                  style={{
                    fontFamily: C.sans, fontSize: 12, fontWeight: 700, color: C.textDim,
                    background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6,
                    padding: '6px 12px', cursor: 'pointer', letterSpacing: 1, alignSelf: 'flex-end',
                  }}
                >
                  Clear ✕
                </button>
              )}
            </div>
 
            {avgReturn !== null && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: C.bgCard, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '8px 16px', flexShrink: 0,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: C.textDim }}>
                  Avg return{anyFilterActive ? ' (filtered)' : ''}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: avgReturn >= 0 ? C.green : C.red }}>
                  {avgReturn > 0 ? '+' : ''}{avgReturn.toFixed(2)}%
                </span>
                <span style={{ fontSize: 11, color: C.textDim }}>({withReturn.length} ideas)</span>
              </div>
            )}
          </div>
        )}
 
        {/* ── Tabla ── */}
        {loading ? (
          <div style={{ color: C.textDim, fontSize: 15, paddingTop: 20 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: C.textDim, fontSize: 15, paddingTop: 32, textAlign: 'center' }}>
            No ideas match the selected filters.
          </div>
        ) : (
          <>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'clip', background: C.bgCard }}>
              <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ minWidth: isMobile ? 700 : 1000, width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.bgCard }}>
                      {/* Ticker — sticky, ordenable */}
                      <th
                        onClick={() => handleSort('ticker')}
                        style={{
                          padding: '14px 16px', fontSize: sortCol === 'ticker' ? 12 : 11,
                          fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
                          color: sortCol === 'ticker' ? C.text : C.textDim,
                          borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
                          textAlign: 'left', cursor: 'pointer', userSelect: 'none',
                          position: 'sticky', left: 0, background: C.bgCard, zIndex: 3,
                        }}
                      >
                        Ticker <SortIcon active={sortCol === 'ticker'} dir={sortDir} />
                      </th>
 
                      <SortableTh label="Name"        col="nombre"            sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortableTh label="Date"        col="fecha_publicacion" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortableTh label="Type"        col="tipo_idea"         sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortableTh label="Status"      col="estatus"           sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortableTh label="Sector"      col="sector"            sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortableTh label="Entry Price" col="precio_publicacion" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                      <SortableTh label="Current"     col="precioActual"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                      <SortableTh label="Return"      col="rendimiento"       sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((e, i) => {
                      const isHovered = hoveredId === e.id
                      const rowBg = isHovered ? C.bgRowHover : i % 2 ? C.bgRowAlt : C.bgRow
                      const tdBase: React.CSSProperties = { borderBottom: `1px solid ${C.border}`, padding: '13px 16px' }
                      return (
                        <tr
                          key={e.id}
                          onClick={() => router.push('/empresa/' + e.ticker)}
                          onMouseEnter={() => setHoveredId(e.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          style={{ background: rowBg, cursor: 'pointer', transition: 'background 0.15s' }}
                        >
                          <td style={{ ...tdBase, position: 'sticky', left: 0, background: rowBg, zIndex: 2, fontWeight: 700, fontSize: 14, color: C.accent, transition: 'background 0.15s' }}>
                            {e.ticker}
                          </td>
                          <td style={{ ...tdBase, fontSize: 14, color: C.text }}>{e.nombre}</td>
                          <td style={{ ...tdBase, fontSize: 13, color: C.textDim, whiteSpace: 'nowrap' }}>
                            {new Date(e.fecha_publicacion).toLocaleDateString('es-US')}
                          </td>
                          <td style={{ ...tdBase, fontSize: 13, color: C.textDim, whiteSpace: 'nowrap' }}>{e.tipo_idea}</td>
                          <td style={tdBase}><EstatusBadge estatus={e.estatus} /></td>
                          <td style={{ ...tdBase, fontSize: 13, color: C.textDim }}>{e.sector}</td>
                          <td style={{ ...tdBase, fontSize: 14, color: C.text, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {e.precio_publicacion}
                          </td>
                          <td style={{ ...tdBase, fontSize: 14, color: C.text, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {e.precioActual?.toFixed(2) ?? '—'}
                          </td>
                          <td style={{ ...tdBase, fontSize: 14, fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap',
                            color: e.rendimiento == null ? C.neutral : e.rendimiento >= 0 ? C.green : C.red,
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
 
            {/* ── Paginación ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: C.textDim }}>
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length} ideas
              </span>
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setPage(p => p - 1)} disabled={page === 0}
                    style={{ fontFamily: C.sans, fontSize: 14, fontWeight: 700, color: page === 0 ? C.border : C.text, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 14px', cursor: page === 0 ? 'default' : 'pointer' }}
                  >
                    ← Prev
                  </button>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i} onClick={() => setPage(i)}
                        style={{ fontFamily: C.sans, fontSize: 13, fontWeight: 700, color: i === page ? '#EEE7D7' : C.textDim, background: i === page ? C.accent : C.bgCard, border: `1px solid ${i === page ? C.accent : C.border}`, borderRadius: 6, width: 32, height: 32, cursor: 'pointer' }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setPage(p => p + 1)} disabled={page === totalPages - 1}
                    style={{ fontFamily: C.sans, fontSize: 14, fontWeight: 700, color: page === totalPages - 1 ? C.border : C.text, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 14px', cursor: page === totalPages - 1 ? 'default' : 'pointer' }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}