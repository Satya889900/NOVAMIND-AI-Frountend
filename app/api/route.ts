import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'NovaMind AI API Gateway is active',
    timestamp: new Date().toISOString(),
  });
}
