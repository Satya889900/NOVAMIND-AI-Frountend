import { z } from 'zod';

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
});

export type MessageInput = z.infer<typeof messageSchema>;

export const createRoomSchema = z.object({
  name: z.string().min(2, 'Room name must be at least 2 characters').max(50, 'Room name is too long'),
  isGroup: z.boolean().default(true),
  participantIds: z.array(z.string()).min(1, 'At least one participant is required'),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
