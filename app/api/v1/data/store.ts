/**
 * In-memory data store for the frontend-only API layer.
 * This replaces the need for a backend database.
 * Data persists for the lifetime of the dev server process.
 */

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away';
  createdAt: string;
  updatedAt: string;
}

export interface StoredMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredConversation {
  id: string;
  name: string;
  isGroup: boolean;
  avatarUrl?: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Seed Users ──────────────────────────────────────────────
const seedUsers: StoredUser[] = [
  {
    id: 'mock-user-id',
    name: 'Demo User',
    email: 'demo@novamind.ai',
    status: 'online',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-user-gemini',
    name: 'Gemini Pro',
    email: 'gemini@novamind.ai',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&h=80&fit=crop',
    status: 'online',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-user-alex',
    name: 'Alex Carter',
    email: 'alex@novamind.ai',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop',
    status: 'online',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-user-sarah',
    name: 'Sarah Jenkins',
    email: 'sarah@novamind.ai',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
    status: 'away',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ── Seed Conversations ──────────────────────────────────────
const seedConversations: StoredConversation[] = [
  {
    id: 'room-1',
    name: 'Gemini Pro',
    isGroup: false,
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&h=80&fit=crop',
    participantIds: ['mock-user-id', 'mock-user-gemini'],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'room-2',
    name: 'Design Team Sync',
    isGroup: true,
    participantIds: ['mock-user-id', 'mock-user-sarah', 'mock-user-alex'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'room-3',
    name: 'Alex Carter',
    isGroup: false,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop',
    participantIds: ['mock-user-id', 'mock-user-alex'],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 22).toISOString(),
  },
];

// ── Seed Messages ───────────────────────────────────────────
const seedMessages: StoredMessage[] = [
  // Room 1 — Gemini Pro conversation
  {
    id: 'm1-1',
    conversationId: 'room-1',
    senderId: 'mock-user-gemini',
    content: 'Hi there! I am your Gemini AI assistant. How can I help you today?',
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'm1-2',
    conversationId: 'room-1',
    senderId: 'mock-user-id',
    content: 'Hey! Can you explain quantum computing in simple terms?',
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'm1-3',
    conversationId: 'room-1',
    senderId: 'mock-user-gemini',
    content: "Sure! Imagine a coin on a table. It can be heads (0) or tails (1). But a spinning coin is in a combination of both heads and tails at the same time until it stops. That's superposition, the core concept of quantum computing!",
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'm1-4',
    conversationId: 'room-1',
    senderId: 'mock-user-id',
    content: 'That makes sense! What about entanglement?',
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 1500000).toISOString(),
    updatedAt: new Date(Date.now() - 1500000).toISOString(),
  },
  {
    id: 'm1-5',
    conversationId: 'room-1',
    senderId: 'mock-user-gemini',
    content: "Entanglement is when two quantum particles become linked. When you measure one, you instantly know the state of the other — no matter how far apart they are. Einstein called it 'spooky action at a distance'! 🌌",
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    updatedAt: new Date(Date.now() - 1200000).toISOString(),
  },

  // Room 2 — Design Team Sync
  {
    id: 'm2-1',
    conversationId: 'room-2',
    senderId: 'mock-user-sarah',
    content: 'Hey guys, did you review the latest UI design mocks for the dashboard?',
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'm2-2',
    conversationId: 'room-2',
    senderId: 'mock-user-alex',
    content: 'Yeah, they look absolutely gorgeous! Love the new dark mode aesthetics.',
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'm2-3',
    conversationId: 'room-2',
    senderId: 'mock-user-id',
    content: 'The glassmorphism cards are 🔥. Can we also add micro-animations on hover?',
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
  },
  {
    id: 'm2-4',
    conversationId: 'room-2',
    senderId: 'mock-user-sarah',
    content: "Thanks! I'm working on the responsive mobile layout next. Will add those micro-animations too!",
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'm2-5',
    conversationId: 'room-2',
    senderId: 'mock-user-alex',
    content: "Don't forget to test on Safari. Last time we had some CSS grid issues there.",
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
  },

  // Room 3 — Alex Carter DM
  {
    id: 'm3-1',
    conversationId: 'room-3',
    senderId: 'mock-user-alex',
    content: 'Hey, are we still on for the project planning meeting at 2 PM?',
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'm3-2',
    conversationId: 'room-3',
    senderId: 'mock-user-id',
    content: "Yes, I'll be there! Should I prepare the sprint retrospective slides?",
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 23).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 23).toISOString(),
  },
  {
    id: 'm3-3',
    conversationId: 'room-3',
    senderId: 'mock-user-alex',
    content: "That would be great! I'll send over the agenda in a bit.",
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 22).toISOString(),
  },
  {
    id: 'm3-4',
    conversationId: 'room-3',
    senderId: 'mock-user-id',
    content: 'Perfect. Also, want to grab coffee before the meeting? ☕',
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 21).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 21).toISOString(),
  },
  {
    id: 'm3-5',
    conversationId: 'room-3',
    senderId: 'mock-user-alex',
    content: "Absolutely! Let's meet at the cafeteria at 1:30. See you then! 👋",
    type: 'text',
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
];

// ── The In-Memory Store (mutable singleton) ─────────────────

class InMemoryStore {
  users: StoredUser[] = [...seedUsers];
  conversations: StoredConversation[] = [...seedConversations];
  messages: StoredMessage[] = [...seedMessages];

  private _nextId = 1000;

  generateId(prefix: string = 'id'): string {
    return `${prefix}-${Date.now()}-${this._nextId++}`;
  }

  // ── User helpers ──────────────────────────────────────────
  getUserById(id: string): StoredUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): StoredUser | undefined {
    return this.users.find((u) => u.email === email);
  }

  getUserIdFromToken(authHeader: string | null): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return 'mock-user-id';
    }
    const token = authHeader.split(' ')[1];

    // Try parsing as a standard 3-part JWT
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      try {
        const payloadB64 = tokenParts[1];
        const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
        const payloadStr = Buffer.from(base64, 'base64').toString('utf8');
        const payload = JSON.parse(payloadStr);

        // Standard claims could contain id, _id, sub, userId
        const userId = payload.id || payload._id || payload.userId || payload.sub;
        if (userId) {
          // Dynamically seed/register user if not in store
          if (!this.getUserById(userId)) {
            this.addUser({
              id: userId,
              name: payload.name || payload.username || 'Authenticated User',
              email: payload.email || 'user@novamind.ai',
              avatarUrl: payload.avatarUrl || payload.avatar || '',
              status: 'online',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
          return userId;
        }
      } catch (e) {
        console.error('Failed to parse JWT token:', e);
      }
    }

    // Fallback: mock-jwt-token-{id}-{timestamp} split format
    const parts = token.split('-');
    if (parts.length >= 5) {
      const potentialId = parts.slice(3, parts.length - 1).join('-');
      if (this.getUserById(potentialId)) {
        return potentialId;
      }
    }
    return 'mock-user-id';
  }

  addUser(user: StoredUser): StoredUser {
    this.users.push(user);
    return user;
  }

  getAllUsers(): StoredUser[] {
    return [...this.users];
  }

  // ── Conversation helpers ──────────────────────────────────
  getConversationById(id: string): StoredConversation | undefined {
    return this.conversations.find((c) => c.id === id);
  }

  getAllConversations(): StoredConversation[] {
    return [...this.conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  addConversation(conv: StoredConversation): StoredConversation {
    this.conversations.push(conv);
    return conv;
  }

  updateConversationName(id: string, name: string): void {
    const conv = this.conversations.find((c) => c.id === id);
    if (conv) {
      conv.name = name;
      conv.updatedAt = new Date().toISOString();
    }
  }

  updateConversationTimestamp(id: string): void {
    const conv = this.conversations.find((c) => c.id === id);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
    }
  }

  // ── Message helpers ───────────────────────────────────────
  getMessageById(id: string): StoredMessage | undefined {
    return this.messages.find((m) => m.id === id);
  }

  getMessagesByConversation(conversationId: string): StoredMessage[] {
    return this.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addMessage(msg: StoredMessage): StoredMessage {
    this.messages.push(msg);
    return msg;
  }

  updateMessage(id: string, content: string): StoredMessage | null {
    const msg = this.messages.find((m) => m.id === id);
    if (!msg) return null;
    msg.content = content;
    msg.isEdited = true;
    msg.updatedAt = new Date().toISOString();
    return msg;
  }

  deleteMessage(id: string): boolean {
    const idx = this.messages.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    this.messages.splice(idx, 1);
    return true;
  }
}

// Export a singleton instance
export const dataStore = new InMemoryStore();
