import { testConnection } from '@/lib/supabase/test-connection'
import { NextResponse } from 'next/server'

export async function GET() {
  const result = await testConnection()
  return NextResponse.json(result)
}
