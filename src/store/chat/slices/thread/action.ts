/* eslint-disable sort-keys-fix/sort-keys-fix, typescript-sort-keys/interface */
// Disable the auto sort key eslint rule to make the code more logic and readable
import isEqual from 'fast-deep-equal';
import { SWRResponse, mutate } from 'swr';
import { StateCreator } from 'zustand/vanilla';

import { useClientDataSWR } from '@/libs/swr';
import { threadService } from '@/services/thread';
import { getAgentChatConfig } from '@/store/chat/slices/aiChat/actions/helpers';
import { chatSelectors } from '@/store/chat/slices/message/selectors';
import { topicSelectors } from '@/store/chat/slices/topic/selectors';
import { ChatStore } from '@/store/chat/store';
import { messageMapKey } from '@/store/chat/utils/messageMapKey';
import { useSessionStore } from '@/store/session';
import { CreateMessageParams, SendThreadMessageParams } from '@/types/message';
import { ThreadItem, ThreadType } from '@/types/topic';
import { setNamespace } from '@/utils/storeDebug';

import { toggleBooleanList } from '../../utils';

const n = setNamespace('thd');
const SWR_USE_FETCH_THREADS = 'SWR_USE_FETCH_THREADS';

export interface ChatThreadAction {
  // create
  addAIMessage: () => Promise<void>;
  // update
  updateThreadInputMessage: (message: string) => void;
  refreshThreads: () => Promise<void>;
  toggleMessageEditing: (id: string, editing: boolean) => void;

  /**
   * Sends a new thread message to the AI chat system
   */
  sendThreadMessage: (params: SendThreadMessageParams) => Promise<void>;
  createThread: (params: {
    message: CreateMessageParams;
    sourceMessageId: string;
    topicId: string;
    type: ThreadType;
  }) => Promise<string | undefined>;
  openThreadCreator: (messageId: string) => void;
  openThreadInPortal: (threadId: string) => void;
  useFetchThreads: (topicId?: string) => SWRResponse<ThreadItem[]>;
}

export const chatThreadMessage: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ChatThreadAction
> = (set, get) => ({
  addAIMessage: async () => {
    const { internal_createMessage, updateInputMessage, activeTopicId, activeId, inputMessage } =
      get();
    if (!activeId) return;

    await internal_createMessage({
      content: inputMessage,
      role: 'assistant',
      sessionId: activeId,
      // if there is activeTopicId，then add topicId to message
      topicId: activeTopicId,
    });

    updateInputMessage('');
  },
  toggleMessageEditing: (id, editing) => {
    set(
      { messageEditingIds: toggleBooleanList(get().messageEditingIds, id, editing) },
      false,
      'toggleMessageEditing',
    );
  },
  updateThreadInputMessage: (message) => {
    if (isEqual(message, get().threadInputMessage)) return;

    set({ threadInputMessage: message }, false, n(`updateThreadInputMessage`, message));
  },
  openThreadCreator: (messageId) => {
    set({ threadStartMessageId: messageId, portalThreadId: undefined }, false, 'openThreadCreator');
    get().togglePortal(true);
  },
  openThreadInPortal: (threadId) => {
    set({ portalThreadId: threadId }, false, 'openThreadInPortal');
    get().togglePortal(true);
  },
  sendThreadMessage: async ({ message, onlyAddUserMessage }) => {
    const {
      internal_coreProcessMessage,
      activeTopicId,
      activeId,
      activeThreadId,
      threadStartMessageId,
      newThreadMode,
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
      threadId: activeThreadId,
    };

    // if there is no activeThreadId, then create a thread
    if (!activeThreadId) {
      if (!threadStartMessageId) return;

      const threadId = await get().createThread({
        message: newMessage,
        sourceMessageId: threadStartMessageId,
        topicId: activeTopicId,
        type: newThreadMode,
      });

      // mark the portal in thread mode
      set({ portalThreadId: threadId });
      await get().refreshThreads();

      return;
    }
    // or just append message

    const agentConfig = getAgentChatConfig();

    let tempMessageId: string | undefined = undefined;
    let newThreadId: string | undefined = undefined;

    // it should be the default topic, then
    // if autoCreateTopic is enabled, check to whether we need to create a topic
    // we need to create a temp message for optimistic update
    tempMessageId = get().internal_createTmpMessage(newMessage);
    get().internal_toggleMessageLoading(true, tempMessageId);

    //  update assistant update to make it rerank
    useSessionStore.getState().triggerSessionUpdate(get().activeId);

    const id = await get().internal_createMessage(newMessage, {
      tempMessageId,
      skipRefresh: !onlyAddUserMessage && newMessage.fileList?.length === 0,
    });

    if (tempMessageId) get().internal_toggleMessageLoading(false, tempMessageId);

    // switch to the new topic if create the new topic
    if (!!newThreadId) {
      await get().switchTopic(newThreadId, true);
      await get().internal_fetchMessages();

      // delete previous messages
      // remove the temp message map
      const newMaps = { ...get().messagesMap, [messageMapKey(activeId, null)]: [] };
      set({ messagesMap: newMaps }, false, 'internal_copyMessages');
    }

    // if only add user message, then stop
    if (onlyAddUserMessage) {
      set({ isCreatingThreadMessage: false }, false, 'creatingMessage/start');
      return;
    }

    // Get the current messages to generate AI response
    const messages = chatSelectors.currentChats(get());

    await internal_coreProcessMessage(messages, id, {
      ragQuery: get().internal_shouldUseRAG() ? message : undefined,
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
    set({ creatingThread: true }, false, n('creatingThread/start'));
    const sourceMessage = chatSelectors.getMessageById(sourceMessageId)(get());
    const threadId = await threadService.createThreadWithMessage({
      title: sourceMessage?.content.slice(0, 20),
      topicId,
      sourceMessageId,
      type,
      message,
    });
    set({ creatingThread: false }, false, n('creatingThread/end'));

    return threadId;
  },

  // query
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
