import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = getSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to home page after sign in
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
