// app/api/historico/route.ts
// Devuelve el historial de precios de cierre diario desde Yahoo Finance.
// Uso: GET /api/historico?ticker=AAPL&desde=2024-01-15
//   - ticker  (requerido): símbolo de Yahoo Finance
//   - desde   (opcional): fecha ISO de inicio; si se omite, devuelve los últimos 2 años
 
import { NextRequest, NextResponse } from 'next/server'
 
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ticker = searchParams.get('ticker')
  const desde  = searchParams.get('desde') // ej. "2024-01-15"
 
  if (!ticker) {
    return NextResponse.json({ error: 'ticker requerido' }, { status: 400 })
  }
 
  // Convertir la fecha de inicio a Unix timestamp
  const startTs = desde
    ? Math.floor(new Date(desde).getTime() / 1000)
    : Math.floor(Date.now() / 1000) - 2 * 365 * 24 * 60 * 60 // 2 años atrás
 
  const endTs = Math.floor(Date.now() / 1000)
 
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?interval=1d&period1=${startTs}&period2=${endTs}`
 
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 }, // cachear 1 hora en Next.js
    })
 
    if (!res.ok) {
      return NextResponse.json({ error: 'Yahoo Finance error', status: res.status }, { status: 502 })
    }
 
    const json = await res.json()
    const result = json?.chart?.result?.[0]
 
    if (!result) {
      return NextResponse.json({ error: 'Sin datos para este ticker' }, { status: 404 })
    }
 
    const timestamps: number[]     = result.timestamp ?? []
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []
 
    // Construir array de { date: "YYYY-MM-DD", close: number }
    // Filtrar puntos donde close sea null (días sin datos)
    const data = timestamps
      .map((ts, i) => ({
        date:  new Date(ts * 1000).toISOString().split('T')[0],
        close: closes[i],
      }))
      .filter(d => d.close != null) as { date: string; close: number }[]
 
    return NextResponse.json({ ticker, data })
  } catch (err) {
    console.error('[/api/historico]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}