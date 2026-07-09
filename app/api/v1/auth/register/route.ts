import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '../../data/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    let existingUser = dataStore.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    
    // In our mock frontend demo, we might replace the default 'mock-user-id' 
    // or just add a new one. Since the rest of the demo relies heavily on 
    // 'mock-user-id', let's use that as the ID if this is a fresh registration,
    // or generate a new one. For realism, generate a new one.
    const newUser = dataStore.addUser({
      id: dataStore.generateId('usr'),
      name: name,
      email: email,
      status: 'online',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: 'Registered successfully',
      data: {
        token: `mock-jwt-token-${newUser.id}-${Date.now()}`,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          status: 'online',
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
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
