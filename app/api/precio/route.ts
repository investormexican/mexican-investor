import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')
  if (!ticker) return NextResponse.json({ precio: null })

  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        cache: 'no-store'
      }
    )
    const data = await res.json()
    const precio = data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null
    return NextResponse.json({ precio })
  } catch {
    return NextResponse.json({ precio: null })
  }
}