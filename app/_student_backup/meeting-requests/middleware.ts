import { NextRequest, NextResponse } from 'next/server';
import { checkSubscriptionAccess } from '@/lib/utils/check-subscription';

export async function middleware(req: NextRequest) {
  // Check if user has access to on-request meetings
  const response = await checkSubscriptionAccess(req, 'on_request_meetings');
  
  // If response is not null, it means the user doesn't have access
  if (response) {
    return response;
  }
  
  // User has access, continue
  return NextResponse.next();
}

export const config = {
  matcher: '/student/meeting-requests/:path*',
};