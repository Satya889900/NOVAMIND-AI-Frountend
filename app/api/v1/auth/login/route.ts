import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '../../data/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Since this is a demo, we treat 'demo@novamind.ai' (password123) specially, 
    // or allow logging in as any existing seeded user with any password.
    let user = dataStore.getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. User not found.' },
        { status: 401 }
      );
    }

    // Mock successful response
    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token: `mock-jwt-token-${user.id}-${Date.now()}`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          status: 'online',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
