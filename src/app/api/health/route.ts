import { NextResponse } from 'next/http'

export async function GET() {
  return NextResponse.json({ status: 'ok' })
} 