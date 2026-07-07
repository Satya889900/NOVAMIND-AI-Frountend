import { useChatStore } from '../store/chatStore';
import { useChatContext } from '../context/ChatContext';

export function useChat() {
  const chatStore = useChatStore();
  const chatContext = useChatContext();

  return {
    ...chatStore,
    ...chatContext,
  };
}
