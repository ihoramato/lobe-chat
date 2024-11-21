/* eslint-disable sort-keys-fix/sort-keys-fix, typescript-sort-keys/interface */
// Disable the auto sort key eslint rule to make the code more logic and readable
import isEqual from 'fast-deep-equal';
import { SWRResponse, mutate } from 'swr';
import { StateCreator } from 'zustand/vanilla';

import { useClientDataSWR } from '@/libs/swr';
import { threadService } from '@/services/thread';
import { threadSelectors } from '@/store/chat/selectors';
import { getAgentChatConfig } from '@/store/chat/slices/aiChat/actions/helpers';
import { chatSelectors } from '@/store/chat/slices/message/selectors';
import { topicSelectors } from '@/store/chat/slices/topic/selectors';
import { ChatStore } from '@/store/chat/store';
import { useSessionStore } from '@/store/session';
import { CreateMessageParams, SendThreadMessageParams } from '@/types/message';
import { ThreadItem, ThreadType } from '@/types/topic';
import { setNamespace } from '@/utils/storeDebug';

const n = setNamespace('thd');
const SWR_USE_FETCH_THREADS = 'SWR_USE_FETCH_THREADS';

export interface ChatThreadAction {
  // update
  updateThreadInputMessage: (message: string) => void;
  refreshThreads: () => Promise<void>;
  /**
   * Sends a new thread message to the AI chat system
   */
  sendThreadMessage: (params: SendThreadMessageParams) => Promise<void>;
  createThread: (params: {
    message: CreateMessageParams;
    sourceMessageId: string;
    topicId: string;
    type: ThreadType;
  }) => Promise<string>;
  openThreadCreator: (messageId: string) => void;
  openThreadInPortal: (threadId: string, sourceMessageId: string) => void;
  useFetchThreads: (topicId?: string) => SWRResponse<ThreadItem[]>;
}

export const chatThreadMessage: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ChatThreadAction
> = (set, get) => ({
  updateThreadInputMessage: (message) => {
    if (isEqual(message, get().threadInputMessage)) return;

    set({ threadInputMessage: message }, false, n(`updateThreadInputMessage`, message));
  },

  openThreadCreator: (messageId) => {
    set(
      { threadStartMessageId: messageId, portalThreadId: undefined, startToForkThread: true },
      false,
      'openThreadCreator',
    );
    get().togglePortal(true);
  },
  openThreadInPortal: (threadId, sourceMessageId) => {
    set(
      { portalThreadId: threadId, threadStartMessageId: sourceMessageId, startToForkThread: false },
      false,
      'openThreadInPortal',
    );
    get().togglePortal(true);
  },

  sendThreadMessage: async ({ message }) => {
    const {
      internal_coreProcessMessage,
      activeTopicId,
      activeId,
      threadStartMessageId,
      newThreadMode,
      portalThreadId,
    } = get();
    if (!activeId || !activeTopicId) return;

    // if message is empty or no files, then stop
    if (!message) return;

    set({ isCreatingThreadMessage: true }, false, n('creatingMessage/start'));

    const newMessage: CreateMessageParams = {
      content: message,
      // if message has attached with files, then add files to message and the agent
      // files: fileIdList,
      role: 'user',
      sessionId: activeId,
      // if there is activeTopicId，then add topicId to message
      topicId: activeTopicId,
      threadId: portalThreadId,
    };

    // if there is no portalThreadId, then create a thread
    if (!portalThreadId) {
      if (!threadStartMessageId) return;

      const threadId = await get().createThread({
        message: newMessage,
        sourceMessageId: threadStartMessageId,
        topicId: activeTopicId,
        type: newThreadMode,
      });

      // mark the portal in thread mode
      await get().refreshMessages();
      await get().refreshThreads();
      get().openThreadInPortal(threadId, threadStartMessageId);

      return;
    }
    // or just append message

    const agentConfig = getAgentChatConfig();

    let tempMessageId: string | undefined = undefined;
    let newThreadId: string | undefined = undefined;

    // we need to create a temp message for optimistic update
    tempMessageId = get().internal_createTmpMessage(newMessage);
    get().internal_toggleMessageLoading(true, tempMessageId);

    //  update assistant update to make it rerank
    useSessionStore.getState().triggerSessionUpdate(get().activeId);

    const id = await get().internal_createMessage(newMessage, {
      tempMessageId,
    });

    if (tempMessageId) get().internal_toggleMessageLoading(false, tempMessageId);

    // switch to the new topic if create the new topic

    // Get the current messages to generate AI response
    const messages = threadSelectors.portalThreadMessages(get());

    await internal_coreProcessMessage(messages, id, {
      ragQuery: get().internal_shouldUseRAG() ? message : undefined,
      threadId: portalThreadId,
    });

    set({ isCreatingMessage: false }, false, n('creatingMessage/stop'));

    const summaryTitle = async () => {
      // if autoCreateTopic is false, then stop
      if (!agentConfig.enableAutoCreateTopic) return;

      // check activeTopic and then auto update topic title
      if (newThreadId) {
        const chats = chatSelectors.currentChats(get());
        await get().summaryTopicTitle(newThreadId, chats);
        return;
      }

      const topic = topicSelectors.currentActiveTopic(get());

      if (topic && !topic.title) {
        const chats = chatSelectors.currentChats(get());
        await get().summaryTopicTitle(topic.id, chats);
      }
    };

    await summaryTitle();
  },

  createThread: async ({ message, sourceMessageId, topicId, type }) => {
    set({ isCreatingThread: true }, false, n('creatingThread/start'));
    const sourceMessage = chatSelectors.getMessageById(sourceMessageId)(get());
    const threadId = await threadService.createThreadWithMessage({
      title: sourceMessage?.content.slice(0, 20),
      topicId,
      sourceMessageId,
      type,
      message,
    });
    set({ isCreatingThread: false }, false, n('creatingThread/end'));

    return threadId;
  },

  useFetchThreads: (topicId) =>
    useClientDataSWR<ThreadItem[]>(
      !topicId ? null : [SWR_USE_FETCH_THREADS, topicId],
      async ([, topicId]: [string, string]) => threadService.getThreads(topicId),
      {
        suspense: true,
        fallbackData: [],
        onSuccess: (threads) => {
          const nextMap = { ...get().threadMaps, [topicId!]: threads };

          // no need to update map if the topics have been init and the map is the same
          if (get().topicsInit && isEqual(nextMap, get().topicMaps)) return;

          set(
            { threadMaps: nextMap, threadsInit: true },
            false,
            n('useFetchThreads(success)', { topicId }),
          );
        },
      },
    ),

  refreshThreads: async () => {
    const topicId = get().activeTopicId;
    if (!topicId) return;

    return mutate([SWR_USE_FETCH_THREADS, get().activeId]);
  },
});
