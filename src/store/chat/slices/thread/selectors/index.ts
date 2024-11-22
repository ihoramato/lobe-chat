import { MESSAGE_THREAD_DIVIDER_ID, THREAD_DRAFT_ID } from '@/const/message';
import type { ChatStoreState } from '@/store/chat';
import { ChatMessage } from '@/types/message';
import { ThreadItem, ThreadType } from '@/types/topic';

import { chatSelectors } from '../../message/selectors';
import { genMessage } from './util';

const currentTopicThreads = (s: ChatStoreState) => {
  if (!s.activeTopicId) return [];

  return s.threadMaps[s.activeTopicId] || [];
};

const currentPortalThread = (s: ChatStoreState): ThreadItem | undefined => {
  if (!s.portalThreadId) return undefined;

  const threads = currentTopicThreads(s);

  return threads.find((t) => t.id === s.portalThreadId);
};

const threadStartMessageId = (s: ChatStoreState) => s.threadStartMessageId;

const threadSourceMessageId = (s: ChatStoreState) => {
  if (s.startToForkThread) return threadStartMessageId(s);

  const portalThread = currentPortalThread(s);
  return portalThread?.sourceMessageId;
};

/**
 * 获取当前 thread 的父级消息
 */
const threadParentMessages = (s: ChatStoreState): ChatMessage[] => {
  // skip tool message
  const data = chatSelectors.currentChatsWithoutTool(s);

  if (s.startToForkThread) {
    const startMessageId = threadStartMessageId(s)!;

    // 存在 threadId 的消息是子消息，在创建付消息时需要忽略
    const messages = data.filter((m) => !m.threadId);
    return genMessage(messages, startMessageId, s.newThreadMode);
  }

  const portalThread = currentPortalThread(s);
  return genMessage(data, portalThread?.sourceMessageId, portalThread?.type);
};

const threadParentMessageIds = (s: ChatStoreState): string[] => {
  const ids = threadParentMessages(s).map((i) => i.id);
  // 如果是独立话题模式，则只显示话题开始消息

  return [...ids, MESSAGE_THREAD_DIVIDER_ID].filter(Boolean) as string[];
};

/**
 * these messages are the messages that are in the thread
 *
 */
const getMessagesByThreadId =
  (id?: string) =>
  (s: ChatStoreState): ChatMessage[] => {
    // skip tool message
    const data = chatSelectors.currentChatsWithoutTool(s);

    return data.filter((m) => !!id && m.threadId === id);
  };

const getMessageIdsByThreadId =
  (id?: string) =>
  (s: ChatStoreState): string[] => {
    return getMessagesByThreadId(id)(s).map((i) => i.id);
  };

const portalThreadMessages = (s: ChatStoreState) => {
  if (s.newThreadMode === ThreadType.Standalone) return threadParentMessages(s);

  const parentMessages = threadParentMessages(s);
  const afterMessages = getMessagesByThreadId(s.portalThreadId)(s);
  // use for optimistic update
  const draftMessage = chatSelectors.currentChats(s).find((m) => m.threadId === THREAD_DRAFT_ID);

  return [...parentMessages, draftMessage, ...afterMessages].filter(Boolean) as ChatMessage[];
};

const portalThreadMessageIds = (s: ChatStoreState): string[] => {
  const parentMessages = threadParentMessageIds(s);
  const portalMessages = getMessageIdsByThreadId(s.portalThreadId)(s);
  // use for optimistic update
  const draftMessage = chatSelectors.currentChats(s).find((m) => m.threadId === THREAD_DRAFT_ID);

  return [...parentMessages, draftMessage?.id, ...portalMessages].filter(Boolean) as string[];
};

const threadSourceMessageIndex = (s: ChatStoreState) => {
  const theadMessageId = threadSourceMessageId(s);
  const data = portalThreadMessages(s);

  return !theadMessageId ? -1 : data.findIndex((d) => d.id === theadMessageId);
};
const getThreadsByTopic = (topicId?: string) => (s: ChatStoreState) => {
  if (!topicId) return;

  return s.threadMaps[topicId];
};

const getFirstThreadBySourceMsgId = (id: string) => (s: ChatStoreState) => {
  const threads = currentTopicThreads(s);

  return threads.find((t) => t.sourceMessageId === id);
};

const getThreadsBySourceMsgId = (id: string) => (s: ChatStoreState) => {
  const threads = currentTopicThreads(s);

  return threads.filter((t) => t.sourceMessageId === id);
};

const hasThreadBySourceMsgId = (id: string) => (s: ChatStoreState) => {
  const threads = currentTopicThreads(s);

  return threads.some((t) => t.sourceMessageId === id);
};

export const threadSelectors = {
  currentTopicThreads,
  getFirstThreadBySourceMsgId,
  getMessageIdsByThreadId,
  getMessagesByThreadId,
  getThreadsBySourceMsgId,
  getThreadsByTopic,
  hasThreadBySourceMsgId,
  portalThreadMessageIds,
  portalThreadMessages,
  threadParentMessages,
  threadSourceMessageId,
  threadSourceMessageIndex,
  threadStartMessageId,
};
