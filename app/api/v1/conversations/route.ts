/**
 * POST /api/v1/conversations — Create a new chat conversation (room)
 *
 * Request Body:
 * {
 *   "name": "Project Alpha Sync",        // optional, 1–50 chars
 *   "isGroup": true,                       // optional, default: false
 *   "participantIds": ["user-id-1", ...]   // optional, default: []
 * }
 *
 * The creator (mock-user-id) is automatically added as a participant.
 *
 * Response (201):
 * {
 *   "success": true,
 *   "message": "Conversation created successfully",
 *   "data": { _id, name, isGroup, avatarUrl, participants: [...], createdAt, updatedAt }
 * }
 */
import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '../data/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, isGroup = false, participantIds = [] } = body;

    // Validation: name length
    if (name !== undefined) {
      if (typeof name !== 'string' || name.length < 1 || name.length > 50) {
        return NextResponse.json(
          { success: false, message: 'name must be a string between 1 and 50 characters' },
          { status: 400 }
        );
      }
    }

    // Validation: participantIds must be an array of strings
    if (!Array.isArray(participantIds)) {
      return NextResponse.json(
        { success: false, message: 'participantIds must be an array of user IDs' },
        { status: 400 }
      );
    }

    // Creator is the authenticated user making the request
    const authHeader = request.headers.get('authorization');
    const creatorId = dataStore.getUserIdFromToken(authHeader);

    // Build unique participant list (creator + provided IDs)
    const allParticipantIds = Array.from(
      new Set([creatorId, ...participantIds.filter((id: unknown) => typeof id === 'string')])
    );

    // Resolve participant user objects
    const participants = allParticipantIds
      .map((id) => {
        const user = dataStore.getUserById(id);
        if (!user) return null;
        return {
          _id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl || '',
          status: user.status,
        };
      })
      .filter(Boolean);

    // Generate conversation name if not provided
    const conversationName =
      name ||
      (isGroup
        ? 'New Group'
        : participants.find((p) => p && p._id !== creatorId)?.name || 'New Conversation');

    const now = new Date().toISOString();
    const conversationId = dataStore.generateId('conv');

    // Persist to the in-memory store
    dataStore.addConversation({
      id: conversationId,
      name: conversationName,
      isGroup,
      avatarUrl: '',
      participantIds: allParticipantIds,
      createdAt: now,
      updatedAt: now,
    });

    // Return response matching the user's spec
    return NextResponse.json(
      {
        success: true,
        message: 'Conversation created successfully',
        data: {
          _id: conversationId,
          name: conversationName,
          isGroup,
          avatarUrl: '',
          participants,
          createdAt: now,
          updatedAt: now,
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

/**
 * GET /api/v1/conversations — List all conversations for the current user
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const currentUserId = dataStore.getUserIdFromToken(authHeader);

  const conversations = dataStore.getAllConversations();

  // Filter conversations where the current user is a participant.
  // Note: We treat 'mock-user-id' in stored conversations as the current user's ID.
  const filteredConversations = conversations.filter((conv) => {
    const resolvedIds = conv.participantIds.map((id) =>
      id === 'mock-user-id' ? currentUserId : id
    );
    return resolvedIds.includes(currentUserId);
  });

  const enriched = filteredConversations.map((conv) => {
    const resolvedParticipantIds = conv.participantIds.map((id) =>
      id === 'mock-user-id' ? currentUserId : id
    );

    const participants = resolvedParticipantIds
      .map((id) => {
        const user = dataStore.getUserById(id);
        if (!user) return null;
        return {
          _id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl || '',
          status: user.status,
        };
      })
      .filter(Boolean);

    // Get last message for this conversation
    const messages = dataStore.getMessagesByConversation(conv.id);
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

    const resolvedLastMessageSenderId =
      lastMessage && lastMessage.senderId === 'mock-user-id'
        ? currentUserId
        : lastMessage?.senderId;

    return {
      _id: conv.id,
      name: conv.name,
      isGroup: conv.isGroup,
      avatarUrl: conv.avatarUrl || '',
      participants,
      lastMessage: lastMessage
        ? {
            _id: lastMessage.id,
            content: lastMessage.content,
            senderId: resolvedLastMessageSenderId,
            createdAt: lastMessage.createdAt,
          }
        : undefined,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  });

  return NextResponse.json({
    success: true,
    data: enriched,
  });
}
