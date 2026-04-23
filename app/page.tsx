'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const C = {
  bg: '#EEE7D7',
  bgCard: '#E5DCC8',
  border: '#C9BFA8',
  text: '#244143',
  textDim: '#5a7a6e',
  green: '#1a5c3a',
  greenBg: 'rgba(26,92,58,0.10)',
  red: '#8b2020',
  accent: '#244143',
  sans: "var(--font-dm-sans), 'Helvetica Neue', sans-serif",
  serif: "'Playfair Display', Georgia, serif",
}

const trackData = [
  { year: 2020, value: 24.0, sp: 18.4 },
  { year: 2021, value: 25.6, sp: 28.7 },
  { year: 2022, value: -12.4, sp: -18.1 },
  { year: 2023, value: 44.9, sp: 26.3 },
  { year: 2024, value: 45.7, sp: 25.0 },
  { year: 2025, value: 58.3, sp: 23.3 },
]

const mvc = [
  {
    letter: 'M',
    word: 'Momentum',
    desc: 'El precio de la acción muestra fuerza y una tendencia positiva.',
    color: C.green,
  },
  {
    letter: 'V',
    word: 'Valor',
    desc: 'Empresas cotizando a una valoración que ofrezca por lo menos 15% de rendimiento anual en los próximos cinco años.',
    color: C.green,
  },
  {
    letter: 'C',
    word: 'Calidad',
    desc: 'Un buen negocio con ventajas competitivas y equipo directivo alineado.',
    color: C.green,
  },
  {
    letter: 'C²',
    word: 'Crecimiento',
    desc: 'Posibilidad de crecer orgánicamente su Free Cash Flow por acción.',
    color: C.text,
  },
]

function Navbar() {
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
            color: '#a0b8b4',
            borderBottom: '2px solid transparent',
            textDecoration: 'none',
            fontSize: 15,
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontWeight: 600,
            paddingBottom: 4,
            fontFamily: C.sans,
            transition: 'color 0.2s, border-color 0.2s',
          }}>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

function useCountUp(target: number, decimals = 1, delay = 400) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => {
      const dur = 1200
      let start: number | null = null
      const step = (ts: number) => {
        if (!start) start = ts
        const p = Math.min((ts - start) / dur, 1)
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
        setVal(parseFloat((target * ease).toFixed(decimals)))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(timer)
  }, [target, decimals, delay])
  return val
}

function AnimatedBar({
  d, max, index,
}: {
  d: typeof trackData[0]
  max: number
  index: number
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)
  const pct = Math.abs(d.value) / max
  const h = Math.round(pct * 130)
  const isPos = d.value >= 0

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300 + index * 100)
    return () => clearTimeout(timer)
  }, [index])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      maxWidth: 80,
    }}>
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 150,
        position: 'relative',
      }}>
        <span style={{
          position: 'absolute',
          [isPos ? 'bottom' : 'top']: animated ? h + 6 : 0,
          fontSize: 20,
          fontWeight: 700,
          color: isPos ? C.green : C.red,
          whiteSpace: 'nowrap',
          transition: `bottom 0.8s cubic-bezier(.34,1.56,.64,1) ${0.3 + index * 0.1}s, top 0.8s cubic-bezier(.34,1.56,.64,1) ${0.3 + index * 0.1}s`,
        }}>
          {d.value > 0 ? '+' : ''}{d.value}%
        </span>
        <div
          ref={barRef}
          style={{
            width: '100%',
            height: animated ? h : 0,
            background: isPos ? C.green : C.red,
            borderRadius: isPos ? '4px 4px 0 0' : '0 0 4px 4px',
            transition: `height 0.8s cubic-bezier(.34,1.56,.64,1) ${0.3 + index * 0.1}s`,
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: C.border,
        }} />
      </div>
      <span style={{ fontSize: 12, color: C.textDim, fontWeight: 600 }}>{d.year}</span>
    </div>
  )
}

export default function Home() {
  const max = Math.max(...trackData.map(d => Math.abs(d.value)))
  const cagr = useCountUp(28.7, 1, 500)
  const best = useCountUp(58.3, 1, 700)

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.sans }}>
      <Navbar />

      {/* ── HERO ── */}
      <div style={{
        padding: '80px 48px 60px',
        textAlign: 'center',
        maxWidth: 800,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-block',
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 40,
          padding: '5px 16px',
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: C.textDim,
          marginBottom: 20,
        }}>
          Invirtiendo desde 2020
        </div>

        <h1 style={{
          fontFamily: C.sans,
          fontSize: 'clamp(40px, 7vw, 60px)',
          fontWeight: 700,
          lineHeight: 1.1,
          color: C.text,
          marginBottom: 15,
        }}>
          Mexican Investor
        </h1>

        <p style={{ fontSize: 18, color: C.textDim, lineHeight: 1.6, marginBottom: 15 }}>
          Analista del equipo <em>Invirtiendo en αlpha.</em> Enfocado mayormente en small-caps
        </p>
        <p style={{ fontSize: 16, color: C.textDim, marginBottom: 30 }}>
          Filosofía MVC² · Momentum · Valor · Calidad · Crecimiento
        </p>

        {/* CAGR pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 40,
          padding: '10px 22px',
          fontWeight: 700,
          fontSize: 15,
          marginBottom: 36,
        }}>
          <span style={{
            background: C.green,
            color: '#EEE7D7',
            borderRadius: 20,
            padding: '3px 10px',
            fontSize: 15,
          }}>
            CAGR 28.7%
          </span>
          <span style={{ color: C.textDim }}>vs</span>
          <span style={{ color: C.textDim }}>S&amp;P 500 15.1%</span>
          <span style={{ color: C.green }}>+13.6 pp</span>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/small-caps" style={{
            padding: '12px 28px',
            background: C.accent,
            color: '#EEE7D7',
            fontFamily: C.sans,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: 'uppercase',
            textDecoration: 'none',
            borderRadius: 4,
          }}>
            3 Small-Caps en 3 minutos
          </Link>
          <Link href="/portafolio" style={{
            padding: '12px 28px',
            background: C.accent,
            color: '#EEE7D7',
            fontFamily: C.sans,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: 'uppercase',
            textDecoration: 'none',
            border: `1.5px solid ${C.border}`,
            borderRadius: 4,
          }}>
            Mi portafolio
          </Link>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ width: 60, height: 2, background: C.border, margin: '0 auto 60px' }} />

      {/* ── MVC² ── */}
      <div style={{ padding: '0 48px 60px', maxWidth: 960, margin: '0 auto' }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 4,
          textTransform: 'uppercase', color: C.textDim, marginBottom: 8,
        }}>
          Filosofía de inversión
        </p>
        <h2 style={{
          fontFamily: C.sans, fontSize: 30, fontWeight: 700,
          color: C.text, marginBottom: 32,
        }}>
          La metodología MVC²
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}>
          {mvc.map(({ letter, word, desc, color }) => (
            <div key={letter} style={{
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '22px 18px',
            }}>
              <div style={{
                fontFamily: C.sans, fontSize: 40, fontWeight: 700,
                color, lineHeight: 1, marginBottom: 8,
              }}>
                {letter}
              </div>
              <div style={{
                fontSize: 20, fontWeight: 700, color: C.text,
                letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6,
              }}>
                {word}
              </div>
              <div style={{ fontSize: 15, color: C.textDim, lineHeight: 1.5 }}>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ width: 60, height: 2, background: C.border, margin: '0 auto 60px' }} />

      {/* ── TRACK RECORD ── */}
      <div style={{ padding: '0 48px 60px', maxWidth: 960, margin: '0 auto' }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 4,
          textTransform: 'uppercase', color: C.textDim, marginBottom: 8,
        }}>
          Track record
        </p>
        <h2 style={{
          fontFamily: C.sans, fontSize: 30, fontWeight: 700,
          color: C.text, marginBottom: 32,
        }}>
          Mi historial como inversor
        </h2>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'CAGR total', val: `+${cagr.toFixed(1)}%`, color: C.green },
            { label: 'Mejor año', val: `+${best.toFixed(1)}%`, color: C.green },
            { label: 'Años de track record', val: '6', color: C.text },
          ].map(({ label, val, color }) => (
            <div key={label} style={{
              background: C.bgCard, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '20px 24px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: C.sans, fontSize: 32, fontWeight: 700, color,
              }}>
                {val}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 700, letterSpacing: 2,
                textTransform: 'uppercase', color: C.textDim, marginTop: 4,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 32,
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 4,
            textTransform: 'uppercase', color: C.textDim, marginBottom: 24,
          }}>
            Rentabilidad anual
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 12,
            height: 180,
          }}>
            {trackData.map((d, i) => (
              <AnimatedBar key={d.year} d={d} max={max} index={i} />
            ))}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20,
            marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}`,
          }}>
            {[
              { color: C.green, label: 'Mexican Investor' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0,
                }} />
                <span style={{ color: C.textDim }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ width: 60, height: 2, background: C.border, margin: '0 auto 60px' }} />

      {/* ── SOCIAL ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 16,
        padding: '0 48px 80px',
      }}>
        {[
          {
            href: 'https://x.com/InvestorMexican',
            label: 'Seguir en X',
            icon: '/icons/x.png',
          },
          {
            href: 'https://mexicaninvestor.substack.com/',
            label: 'Newsletter en Substack',
            icon: '/icons/substack.png',
          },
        ].map(({ href, label, icon }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 22px',
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13, fontWeight: 600, color: C.text,
            textDecoration: 'none',
          }}>
            <img src={icon} style={{ height: 18 }} alt={label} />
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}