import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req: request, res: response })
  
  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()
  
  return response
}