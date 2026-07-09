/**
 * POST /api/v1/chats/:roomId/messages — Send a message to a chat room
 *
 * Request Body:
 * {
 *   "content": "Hello, here is the architectural diagram.",  // required, 1–2000 chars
 *   "type": "text",                                           // optional, default: 'text'
 *   "fileUrl": "https://example.com/uploads/diagram.png",    // optional
 *   "fileName": "diagram.png"                                 // optional
 * }
 *
 * Response (201):
 * {
 *   "success": true,
 *   "message": "Message sent successfully",
 *   "data": { _id, conversationId, senderId, content, type, fileUrl, fileName, createdAt, updatedAt }
 * }
 */
import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '../../../data/store';

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

// POST /api/v1/chats/:roomId/messages
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { roomId } = await params;

  try {
    const body = await request.json();
    const { content, type = 'text', fileUrl, fileName, senderId } = body;

    // Validate content: required, 1–2000 chars
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, message: 'content is required and must be a string' },
        { status: 400 }
      );
    }

    if (content.length < 1 || content.length > 2000) {
      return NextResponse.json(
        { success: false, message: 'content must be between 1 and 2000 characters' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['text', 'image', 'file'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: `type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify the room/conversation exists
    const conversation = dataStore.getConversationById(roomId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Use provided senderId or extract from token
    const authHeader = request.headers.get('authorization');
    const actualSenderId = senderId || dataStore.getUserIdFromToken(authHeader);

    const now = new Date().toISOString();
    const messageId = dataStore.generateId('msg');

    // Check if this is the first message
    const existingMessages = dataStore.getMessagesByConversation(roomId);
    const isFirstMessage = existingMessages.length === 0;

    // Persist to the in-memory store
    const newMessage = dataStore.addMessage({
      id: messageId,
      conversationId: roomId,
      senderId: actualSenderId,
      content: content.trim(),
      type,
      fileUrl,
      fileName,
      isEdited: false,
      createdAt: now,
      updatedAt: now,
    });

    // Automatically name the conversation based on the first message
    if (isFirstMessage) {
      if (!conversation.name || conversation.name === 'New Chat') {
        // Extract first 4 words for the title
        const words = content.trim().split(/\s+/);
        const title = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
        dataStore.updateConversationName(roomId, title);
      }
    } else {
      // Update conversation's updatedAt timestamp
      dataStore.updateConversationTimestamp(roomId);
    }

    // Return response matching the user's spec
    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully',
        data: {
          _id: newMessage.id,
          conversationId: newMessage.conversationId,
          senderId: newMessage.senderId,
          content: newMessage.content,
          type: newMessage.type,
          fileUrl: newMessage.fileUrl || undefined,
          fileName: newMessage.fileName || undefined,
          createdAt: newMessage.createdAt,
          updatedAt: newMessage.updatedAt,
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

// GET /api/v1/chats/:roomId/messages — Load all messages in this room
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { roomId } = await params;
  const authHeader = request.headers.get('authorization');
  const currentUserId = dataStore.getUserIdFromToken(authHeader);

  // Verify the room exists
  const conversation = dataStore.getConversationById(roomId);
  if (!conversation) {
    return NextResponse.json(
      { success: false, message: 'Conversation not found' },
      { status: 404 }
    );
  }

  const messages = dataStore.getMessagesByConversation(roomId);

  // Enrich with sender info
  const enriched = messages.map((msg) => {
    const resolvedSenderId = msg.senderId === 'mock-user-id' ? currentUserId : msg.senderId;
    const sender = dataStore.getUserById(resolvedSenderId);
    return {
      _id: msg.id,
      conversationId: msg.conversationId,
      senderId: resolvedSenderId,
      sender: sender
        ? {
            _id: sender.id,
            name: sender.name,
            email: sender.email,
            avatarUrl: sender.avatarUrl || '',
            status: sender.status,
          }
        : null,
      content: msg.content,
      type: msg.type,
      fileUrl: msg.fileUrl || undefined,
      fileName: msg.fileName || undefined,
      isEdited: msg.isEdited,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    };
  });

  return NextResponse.json({
    success: true,
    data: enriched,
    meta: {
      conversationId: roomId,
      totalMessages: enriched.length,
    },
  });
}
