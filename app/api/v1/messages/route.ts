/**
 * POST /api/v1/messages — Send a new message
 *
 * Body: { conversationId: string, content: string, type?: 'text' | 'image' | 'file' }
 * Returns: the created message with sender info
 */
import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '../data/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, content, type = 'text', senderId } = body;

    // Validation
    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'conversationId is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { success: false, message: 'content is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Verify conversation exists
    const conversation = dataStore.getConversationById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Use provided senderId or extract from token
    const authHeader = request.headers.get('authorization');
    const actualSenderId = senderId || dataStore.getUserIdFromToken(authHeader);
    const sender = dataStore.getUserById(actualSenderId);
    if (!sender) {
      return NextResponse.json(
        { success: false, message: 'Sender not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const newMessage = dataStore.addMessage({
      id: dataStore.generateId('msg'),
      conversationId,
      senderId: actualSenderId,
      content: content.trim(),
      type,
      isEdited: false,
      createdAt: now,
      updatedAt: now,
    });

    // Return the message enriched with sender info
    return NextResponse.json(
      {
        success: true,
        data: {
          ...newMessage,
          sender: {
            id: sender.id,
            name: sender.name,
            email: sender.email,
            avatarUrl: sender.avatarUrl,
            status: sender.status,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
