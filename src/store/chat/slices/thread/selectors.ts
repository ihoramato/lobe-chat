import { MESSAGE_THREAD_DIVIDER_ID } from '@/const/message';
import type { ChatStoreState } from '@/store/chat';
import { ThreadType } from '@/types/topic';

import { chatSelectors } from '../message/selectors';

const currentTopicThreads = (s: ChatStoreState) => {
  if (!s.activeTopicId) return [];

  return s.threadMaps[s.activeTopicId] || [];
};

const threadStartMessageId = (s: ChatStoreState) => s.threadStartMessageId;

const filterUntilTargetId = (idList: string[], targetId?: string) => {
  if (!targetId) return idList;

  const targetIndex = idList.indexOf(targetId);

  // 如果找到目标id，则截取到该位置（包含该位置）
  // 如果没找到目标id，则返回原数组
  return targetIndex !== -1 ? idList.slice(0, targetIndex + 1) : idList;
};

/**
 * 获取当前 thread 的父级消息
 */
const threadParentMessages = (s: ChatStoreState): string[] => {
  // 如果是独立话题模式，则只显示话题开始消息
  if (s.newThreadMode === ThreadType.Standalone)
    return [threadStartMessageId(s), MESSAGE_THREAD_DIVIDER_ID].filter(Boolean) as string[];

  // skip tool message
  const data = chatSelectors.currentChats(s).filter((m) => m.role !== 'tool');

  const items = filterUntilTargetId(
    data.map((i) => i.id),
    threadStartMessageId(s),
  );
  return [...items, MESSAGE_THREAD_DIVIDER_ID];
};

const portalThreadMessages = (s: ChatStoreState): string[] => {
  // skip tool message
  const data = chatSelectors.currentChats(s).filter((m) => m.role !== 'tool');

  return data.filter((m) => !!s.portalThreadId && m.threadId === s.portalThreadId).map((i) => i.id);
};

const threadMessages = (s: ChatStoreState): string[] => {
  // 如果是独立话题模式，则只显示话题开始消息
  if (s.newThreadMode === ThreadType.Standalone)
    return [threadStartMessageId(s), MESSAGE_THREAD_DIVIDER_ID].filter(Boolean) as string[];

  // skip tool message
  const parentMessages = threadParentMessages(s);
  const portalMessages = portalThreadMessages(s);

  return [...parentMessages, ...portalMessages];
};

const threadStartMessageIndex = (s: ChatStoreState) => {
  const theadMessageId = threadStartMessageId(s);

  return !theadMessageId ? -1 : threadParentMessages(s).indexOf(theadMessageId);
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
  getThreadsBySourceMsgId,
  getThreadsByTopic,
  hasThreadBySourceMsgId,
  portalThreadMessages,
  threadMessages,
  threadParentMessages,
  threadStartMessageId,
  threadStartMessageIndex,
};
