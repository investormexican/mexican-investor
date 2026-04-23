'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'

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
  serif: "'Playfair Display', Georgia, serif",
}

function Navbar() {
  const pathname = usePathname()

  const linkStyle = function (href: string) {
    const active = pathname === href

    return {
      color: active ? '#EEE7D7' : '#a0b8b4',
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
        <Link href="/small-caps" style={linkStyle('/')}>
          3 Small-Caps
        </Link>

        <Link href="/portafolio" style={linkStyle('/portafolio')}>
          Portafolio
        </Link>
      </div>
    </nav>
  )
}

function EstatusBadge(props: { estatus: string }) {
  const map: any = {
    Intacta: { color: C.green, bg: C.greenBg },
    Duda: { color: C.amber, bg: C.amberBg },
    Rota: { color: C.red, bg: C.redBg },
  }

  const s = map[props.estatus] || { color: C.neutral, bg: 'transparent' }

  return (
    <span style={{
      color: s.color,
      background: s.bg,
      padding: '6px 14px',
      borderRadius: 10,
      fontWeight: 700,
    }}>
      {props.estatus}
    </span>
  )
}

function MetricCard(props: { title: string; value: string; color?: string }) {
  return (
    <div style={{
      background: C.bgCard,
      border: '1px solid ' + C.border,
      borderRadius: 10,
      padding: '16px 20px',
    }}>
      <div style={{
        fontSize: 15,
        letterSpacing: 2,
        color: C.textDim,
        marginBottom: 10,
        fontWeight: 600
      }}>
        {props.title}
      </div>

      <div style={{
        fontSize: 15,
        fontWeight: 700,
        color: props.color || C.text
      }}>
        {props.value}
      </div>
    </div>
  )
}

function getCurrencySymbol(pais: string) {
  const map: any = {
    'Estados Unidos': '$',
    'Canadá': 'C$',
    'España': '€',
    'Reino Unido': '£',
    'Polonia': 'zł',
    'Australia': 'A$',
  }
  return map[pais] || '$'
}

async function getPrecio(ticker: string) {
  try {
    const res = await fetch('/api/precio?ticker=' + ticker)
    const data = await res.json()
    return data.precio || null
  } catch {
    return null
  }
}

export default function Empresa() {
  const params = useParams()
  const ticker = Array.isArray(params.ticker) ? params.ticker[0] : params.ticker

  const [data, setData] = useState<any>(null)
  const [articulos, setArticulos] = useState<any[]>([])
  const [precioActual, setPrecioActual] = useState<number | null>(null)
  const [rendimiento, setRendimiento] = useState<number | null>(null)

  useEffect(function () {
    async function fetchData() {
      const res = await supabase.from('tres_en_tres').select('*').eq('ticker', ticker).maybeSingle()

      if (!res.data) return
      setData(res.data)

      const precio = await getPrecio(res.data.ticker)
      setPrecioActual(precio)

      const pub = Number(res.data.precio_publicacion)

      if (precio && pub) {
        setRendimiento(((precio - pub) / pub) * 100)
      }

      const arts = await supabase
        .from('articulos')
        .select('*')
        .eq('ticker', res.data.ticker)
        .order('fecha', { ascending: false })

      setArticulos(arts.data || [])
    }

    if (ticker) fetchData()
  }, [ticker])

  if (!data) return <div style={{ padding: 40 }}>Cargando...</div>

  const currency = getCurrencySymbol(data.pais)

  const rendColor =
    rendimiento != null
      ? rendimiento > 0 ? C.green : C.red
      : C.text

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.sans }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 48 }}>

        {/* HEADER */}
        <h1 style={{ fontFamily: C.sans, fontSize: 30, marginBottom: 10 }}>
          {data.nombre} ({data.ticker})
        </h1>

        <p style={{ color: C.textDim, marginBottom: 10 }}>
          {data.pais + ' · ' + data.sector}
        </p>

        {/* ESTATUS (mejor posicionado) */}
        <div style={{ marginTop: 15, marginBottom: 15 }}>
          <EstatusBadge estatus={data.estatus} />
        </div>

        {/* CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 16,
          marginBottom: 10
        }}>
          <MetricCard
            title="Precio Publicación"
            value={currency + data.precio_publicacion.toFixed(2)}
          />

          <MetricCard
            title="Precio Actual"
            value={precioActual ? currency + precioActual.toFixed(2) : '—'}
          />

          <MetricCard
            title="Rendimiento"
            value={
              rendimiento != null
                ? (rendimiento > 0 ? '+' : '') + rendimiento.toFixed(2) + '%'
                : '—'
            }
            color={rendColor}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40 }}>

          {/* IZQUIERDA */}
          <div>

            <h2 style={{
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 15
            }}>
              Tesis de Inversión
            </h2>

            <p style={{ lineHeight: 1.7 }}>
              {data.tesis}
            </p>

            <h2 style={{
              fontWeight: 700,
              fontSize: 15,
              marginTop: 20,
              marginBottom: 20
            }}>
              Artículos
            </h2>

            {articulos.length > 0 ? (
              articulos.map(function (a) {
                return (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    style={{
                      display: 'block',
                      marginBottom: 20,
                      color: C.text,
                      textDecoration: 'none'
                    }}
                  >
                    {a.titulo}
                  </a>
                )
              })
            ) : (
              <p style={{ color: C.textDim }}>
                No hay artículos disponibles.
              </p>
            )}

          </div>

          {/* DERECHA */}
          <div>

            <h2 style={{
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 15
            }}>
              Métricas Clave
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <MetricCard title="Ventas (LTM)" value={data.revenue_growth_yoy + '%'} />
              <MetricCard title="FCF Growth" value={data.fcf_growth + '%'} />
              <MetricCard title="Margen Bruto" value={data.gross_margin + '%'} />
              <MetricCard title="Margen FCF" value={data.fcf_margin + '%'} />
              <MetricCard title="Deuda Neta" value={currency + data.net_debt + 'M'} />
            </div>

          </div>

        </div>

      </main>
    </div>
  )
}