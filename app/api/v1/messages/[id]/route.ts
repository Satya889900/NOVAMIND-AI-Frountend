/**
 * GET    /api/v1/messages/:conversationId — Get all messages for a conversation
 * DELETE /api/v1/messages/:id — Delete a message by ID
 * PATCH  /api/v1/messages/:id — Edit a message by ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '../../data/store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/messages/:conversationId — Load previous messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: conversationId } = await params;
  const authHeader = request.headers.get('authorization');
  const currentUserId = dataStore.getUserIdFromToken(authHeader);

  // Check if this looks like a conversation ID or a message ID
  // For conversation IDs (room-*), fetch messages
  const conversation = dataStore.getConversationById(conversationId);
  if (conversation) {
    const messages = dataStore.getMessagesByConversation(conversationId);

    // Enrich messages with sender info
    const enrichedMessages = messages.map((msg) => {
      const resolvedSenderId = msg.senderId === 'mock-user-id' ? currentUserId : msg.senderId;
      const sender = dataStore.getUserById(resolvedSenderId);
      return {
        ...msg,
        senderId: resolvedSenderId,
        // Map conversationId back to roomId for frontend compatibility
        roomId: msg.conversationId,
        sender: sender
          ? {
              id: sender.id,
              name: sender.name,
              email: sender.email,
              avatarUrl: sender.avatarUrl,
              status: sender.status,
              createdAt: sender.createdAt,
              updatedAt: sender.updatedAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedMessages,
      meta: {
        conversationId,
        totalMessages: enrichedMessages.length,
      },
    });
  }

  // If not a conversation, try to find a message by this ID (for GET single message)
  const message = dataStore.getMessageById(conversationId);
  if (message) {
    const resolvedSenderId = message.senderId === 'mock-user-id' ? currentUserId : message.senderId;
    const sender = dataStore.getUserById(resolvedSenderId);
    return NextResponse.json({
      success: true,
      data: {
        ...message,
        senderId: resolvedSenderId,
        roomId: message.conversationId,
        sender: sender
          ? {
              id: sender.id,
              name: sender.name,
              email: sender.email,
              avatarUrl: sender.avatarUrl,
              status: sender.status,
              createdAt: sender.createdAt,
              updatedAt: sender.updatedAt,
            }
          : null,
      },
    });
  }

  return NextResponse.json(
    { success: false, message: 'Resource not found' },
    { status: 404 }
  );
}

// DELETE /api/v1/messages/:id — Delete a message
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const message = dataStore.getMessageById(id);
  if (!message) {
    return NextResponse.json(
      { success: false, message: 'Message not found' },
      { status: 404 }
    );
  }

  const deleted = dataStore.deleteMessage(id);

  if (deleted) {
    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully',
      data: { id },
    });
  }

  return NextResponse.json(
    { success: false, message: 'Failed to delete message' },
    { status: 500 }
  );
}

// PATCH /api/v1/messages/:id — Edit a message
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { success: false, message: 'content is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const message = dataStore.getMessageById(id);
    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Message not found' },
        { status: 404 }
      );
    }

    const updatedMessage = dataStore.updateMessage(id, content.trim());

    if (!updatedMessage) {
      return NextResponse.json(
        { success: false, message: 'Failed to update message' },
        { status: 500 }
      );
    }

    const sender = dataStore.getUserById(updatedMessage.senderId);

    return NextResponse.json({
      success: true,
      data: {
        ...updatedMessage,
        roomId: updatedMessage.conversationId,
        sender: sender
          ? {
              id: sender.id,
              name: sender.name,
              email: sender.email,
              avatarUrl: sender.avatarUrl,
              status: sender.status,
              createdAt: sender.createdAt,
              updatedAt: sender.updatedAt,
            }
          : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
