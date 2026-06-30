'use client'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
 
const C = {
  bg: '#EEE7D7',
  bgCard: '#E5DCC8',
  border: '#C9BFA8',
  text: '#244143',
  textDim: '#5a7a6e',
  green: '#1a5c3a',
  red: '#8b2020',
  accent: '#244143',
  sans: "var(--font-dm-sans), 'Helvetica Neue', sans-serif",
}
 
const trackData = [
  { year: 2020, value: 24.0 },
  { year: 2021, value: 25.6 },
  { year: 2022, value: -12.4 },
  { year: 2023, value: 44.9 },
  { year: 2024, value: 45.7 },
  { year: 2025, value: 58.3 },
]
 
const mvc = [
  { letter: 'Q', word: 'Quality',  desc: 'A good business with competitive advantages', color: C.green },
  { letter: 'G', word: 'Growth',   desc: 'Potential to organically grow its Free Cash Flow per share', color: C.green },
  { letter: 'V', word: 'Value',    desc: 'Trading at a valuation that offers at least 15% CAGR', color: C.green },
  { letter: 'M', word: 'Momentum', desc: 'The stock price shows strength and a positive trend', color: C.text },
]
 
/* ── useIsMobile ─────────────────────────────────────────────── */
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
 
/* ── useCountUp ──────────────────────────────────────────────── */
function useCountUp(target: number, decimals = 1, delay = 400) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const dur = 1200
      let start: number | null = null
      const step = (ts: number) => {
        if (!start) start = ts
        const p    = Math.min((ts - start) / dur, 1)
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
        setVal(parseFloat((target * ease).toFixed(decimals)))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(t)
  }, [target, decimals, delay])
  return val
}
 
/* ── Barra animada desktop (vertical) ───────────────────────── */
function AnimatedBar({ d, max, index, barH }: {
  d: { year: number; value: number }; max: number; index: number; barH: number
}) {
  const [animated, setAnimated] = useState(false)
  const pct   = Math.abs(d.value) / max
  const h     = Math.round(pct * barH)
  const isPos = d.value >= 0
  const delay = 0.3 + index * 0.1
 
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300 + index * 100)
    return () => clearTimeout(t)
  }, [index])
 
  const labelStylePos: React.CSSProperties = {
    position: 'absolute', bottom: animated ? h + 4 : 0,
    fontSize: 14, fontWeight: 700, color: C.green, whiteSpace: 'nowrap',
    transition: `bottom 0.8s cubic-bezier(.34,1.56,.64,1) ${delay}s`,
  }
  const labelStyleNeg: React.CSSProperties = {
    position: 'absolute', top: animated ? h + 4 : 0,
    fontSize: 14, fontWeight: 700, color: C.red, whiteSpace: 'nowrap',
    transition: `top 0.8s cubic-bezier(.34,1.56,.64,1) ${delay}s`,
  }
 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: barH + 28, position: 'relative' }}>
        <span style={isPos ? labelStylePos : labelStyleNeg}>
          {d.value > 0 ? '+' : ''}{d.value}%
        </span>
        <div style={{
          width: '100%', height: animated ? h : 0,
          background: isPos ? C.green : C.red,
          borderRadius: isPos ? '3px 3px 0 0' : '0 0 3px 3px',
          transition: `height 0.8s cubic-bezier(.34,1.56,.64,1) ${delay}s`,
        }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: C.border }} />
      </div>
      <span style={{ fontSize: 12, color: C.textDim, fontWeight: 600 }}>{d.year}</span>
    </div>
  )
}
 
/* ── Barra animada mobile (horizontal) ──────────────────────── */
function AnimatedBarVertical({ d, max, index }: {
  d: { year: number; value: number }; max: number; index: number
}) {
  const [animated, setAnimated] = useState(false)
  const pct   = Math.abs(d.value) / max
  const isPos = d.value >= 0
 
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200 + index * 80)
    return () => clearTimeout(t)
  }, [index])
 
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.textDim, width: 34, flexShrink: 0 }}>{d.year}</span>
      <div style={{ flex: 1, height: 24, display: 'flex', alignItems: 'center' }}>
        <div style={{
          height: 20,
          width: animated ? `${pct * 100}%` : '0%',
          background: isPos ? C.green : C.red,
          borderRadius: '0 4px 4px 0',
          transition: `width 0.7s cubic-bezier(.34,1.56,.64,1) ${0.2 + index * 0.08}s`,
          minWidth: animated ? 4 : 0,
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: isPos ? C.green : C.red, width: 52, textAlign: 'right', flexShrink: 0 }}>
        {d.value > 0 ? '+' : ''}{d.value}%
      </span>
    </div>
  )
}
 
/* ── Home ────────────────────────────────────────────────────── */
export default function Home() {
  const isMobile = useIsMobile()
  const max  = Math.max(...trackData.map(d => Math.abs(d.value)))
  const cagr = useCountUp(28.7, 1, 500)
 
  const sectionStyle: React.CSSProperties = {
    padding: isMobile ? '0 20px 60px' : '0 48px 60px',
    maxWidth: 960,
    margin: '0 auto',
  }
 
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.sans }}>
      <Navbar />
 
      {/* ── HERO ── */}
      <div style={{
        padding: isMobile ? '48px 20px 40px' : '80px 48px 60px',
        textAlign: 'center',
        maxWidth: 800,
        margin: '0 auto',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-block',
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 40, padding: '5px 16px',
          fontSize: isMobile ? 10 : 13, fontWeight: 700,
          letterSpacing: 3, textTransform: 'uppercase',
          color: C.textDim, marginBottom: 20,
        }}>
          Investing since 2020
        </div>
 
        <h1 style={{
          fontFamily: C.sans,
          fontSize: isMobile ? 36 : 'clamp(40px, 7vw, 60px)',
          fontWeight: 700, lineHeight: 1.1,
          color: C.text, marginBottom: 15,
        }}>
          Mexican Investor
        </h1>
 
        <p style={{ fontSize: isMobile ? 15 : 18, color: C.textDim, lineHeight: 1.6, marginBottom: 15 }}>
          Stock research. Mostly micro and small-caps
        </p>
        <p style={{ fontSize: isMobile ? 13 : 16, color: C.textDim, marginBottom: 30 }}>
          QGVM Methodology · Quality · Growth · Value · Momentum
        </p>
 
        {/* CAGR badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 40, padding: isMobile ? '8px 14px' : '10px 22px',
          fontWeight: 700, fontSize: isMobile ? 13 : 15,
          marginBottom: 36, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <span style={{ background: C.green, color: '#EEE7D7', borderRadius: 20, padding: '3px 10px', fontSize: isMobile ? 12 : 15 }}>
            CAGR 28.7%
          </span>
          <span style={{ color: C.textDim }}>vs</span>
          <span style={{ color: C.textDim }}>S&amp;P 500 15.1%</span>
          <span style={{ color: C.green }}>+13.6 pp</span>
        </div>
 
        {/* ── CTAs principales ── */}
        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center', marginBottom: 20,
        }}>
          <Link href="/investment-ideas" style={{
            padding: '12px 28px',
            background: C.accent, color: '#EEE7D7',
            fontFamily: C.sans, fontSize: isMobile ? 13 : 15,
            fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
            textDecoration: 'none', borderRadius: 4,
            width: isMobile ? '100%' : 'auto', textAlign: 'center',
            boxSizing: 'border-box',
          }}>
            Investment Ideas
          </Link>
          <Link href="/portfolio" style={{
            padding: '12px 28px',
            background: 'transparent', color: C.text,
            fontFamily: C.sans, fontSize: isMobile ? 13 : 15,
            fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
            textDecoration: 'none', border: `1.5px solid ${C.border}`,
            borderRadius: 4, width: isMobile ? '100%' : 'auto',
            textAlign: 'center', boxSizing: 'border-box',
          }}>
            My Portfolio
          </Link>
        </div>
 
        {/* ── Separador suave entre CTAs y sociales ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: isMobile ? '4px 0 16px' : '8px auto 20px',
          maxWidth: 320,
        }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 11, color: C.textDim, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
            Follow
          </span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>
 
        {/* ── Botones sociales — grandes y prominentes ── */}
        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
        }}>
          <a
            href="https://x.com/InvestorMexican"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: isMobile ? '13px 24px' : '14px 32px',
              background: C.bgCard, color: C.text,
              fontFamily: C.sans, fontSize: isMobile ? 14 : 16,
              fontWeight: 700, textDecoration: 'none',
              border: `1.5px solid ${C.border}`, borderRadius: 8,
              boxSizing: 'border-box', letterSpacing: 0.5,
            }}
          >
            <img src="/icons/x.png" style={{ height: 20, filter: 'brightness(10)' }} alt="" />
            Follow on X
          </a>
 
          <a
            href="https://mexicaninvestor.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: isMobile ? '13px 24px' : '14px 32px',
              background: C.bgCard, color: C.text,
              fontFamily: C.sans, fontSize: isMobile ? 14 : 16,
              fontWeight: 700, textDecoration: 'none',
              border: `1.5px solid ${C.border}`, borderRadius: 8,
              width: isMobile ? '100%' : 'auto',
              boxSizing: 'border-box', letterSpacing: 0.5,
            }}
          >
            <img src="/icons/substack.png" style={{ height: 20 }} alt="" />
            Newsletter on Substack
          </a>
        </div>
      </div>
 
      <div style={{ width: 60, height: 2, background: C.border, margin: '0 auto 60px' }} />
 
      {/* ── QGVM ── */}
      <div style={sectionStyle}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: C.textDim, marginBottom: 8 }}>
          Investment Philosophy
        </p>
        <h2 style={{ fontFamily: C.sans, fontSize: isMobile ? 24 : 30, fontWeight: 700, color: C.text, marginBottom: 32 }}>
          The QGVM Methodology
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 10 : 12,
        }}>
          {mvc.map(({ letter, word, desc, color }) => (
            <div key={letter} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? '18px 16px' : '22px 18px' }}>
              <div style={{ fontFamily: C.sans, fontSize: isMobile ? 36 : 40, fontWeight: 700, color, lineHeight: 1, marginBottom: isMobile ? 6 : 8 }}>
                {letter}
              </div>
              <div style={{ fontSize: isMobile ? 13 : 18, fontWeight: 700, color: C.text, letterSpacing: 1, textTransform: 'uppercase', marginBottom: isMobile ? 0 : 6 }}>
                {word}
              </div>
              {!isMobile && (
                <div style={{ fontSize: 14, color: C.textDim, lineHeight: 1.5 }}>{desc}</div>
              )}
            </div>
          ))}
        </div>
      </div>
 
      <div style={{ width: 60, height: 2, background: C.border, margin: '0 auto 60px' }} />
 
      {/* ── TRACK RECORD ── */}
      <div style={sectionStyle}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: C.textDim, marginBottom: 8 }}>
          Track record
        </p>
        <h2 style={{ fontFamily: C.sans, fontSize: isMobile ? 24 : 30, fontWeight: 700, color: C.text, marginBottom: 32 }}>
          My Performance as an Investor
        </h2>
 
        {isMobile ? (
          <>
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: C.sans, fontSize: 36, fontWeight: 700, color: C.green }}>
                +{cagr.toFixed(1)}%
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: C.textDim, marginTop: 4 }}>
                CAGR Total
              </div>
            </div>
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: C.textDim, marginBottom: 16 }}>
                Return by year
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {trackData.map((d, i) => (
                  <AnimatedBarVertical key={d.year} d={d} max={max} index={i} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'CAGR since 2020', val: `+${cagr.toFixed(1)}%`, color: C.green },
                { label: 'Best year',       val: '+58.3%',               color: C.green },
                { label: 'Years of track record', val: '6',              color: C.text  },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px', textAlign: 'center' }}>
                  <div style={{ fontFamily: C.sans, fontSize: 32, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: C.textDim, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32 }}>
              <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: C.textDim, marginBottom: 24 }}>
                Return by year
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, height: 180 }}>
                {trackData.map((d, i) => (
                  <AnimatedBar key={d.year} d={d} max={max} index={i} barH={130} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: C.textDim }}>Mexican Investor</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}