import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '../../data/store';

export async function GET(request: NextRequest) {
  // Extract token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized. No token provided.' },
      { status: 401 }
    );
  }

  const userId = dataStore.getUserIdFromToken(authHeader);

  const user = dataStore.getUserById(userId);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  });
}
