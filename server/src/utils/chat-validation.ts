import { getNumberEnv } from './env';

const CHAT_MESSAGE_MAX_LENGTH = getNumberEnv('CHAT_MESSAGE_MAX_LENGTH', 2000);

export const normalizeChatMessageContent = (content: unknown): string => {
  return String(content || '').trim();
};

export const validateChatMessageContent = (content: string): string | null => {
  if (!content) {
    return 'Message content is required';
  }

  if (content.length > CHAT_MESSAGE_MAX_LENGTH) {
    return `Message must be ${CHAT_MESSAGE_MAX_LENGTH} characters or fewer`;
  }

  return null;
};
