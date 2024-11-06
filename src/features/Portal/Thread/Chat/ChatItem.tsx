import React, { memo, useMemo } from 'react';

import { ChatItem } from '@/features/Conversation';
import { useChatStore } from '@/store/chat';
import { threadSelectors } from '@/store/chat/selectors';

import ThreadDivider from './ThreadDivider';

export interface ThreadChatItemProps {
  id: string;
  index: number;
}

const ThreadChatItem = memo<ThreadChatItemProps>(({ id, index }) => {
  const threadStartMessageIndex = useChatStore(threadSelectors.threadStartMessageIndex);
  const threadMessageId = useChatStore(threadSelectors.threadStartMessageId);

  const enableThreadDivider = threadMessageId === id;

  const endRender = useMemo(() => enableThreadDivider && <ThreadDivider />, [enableThreadDivider]);

  return (
    <ChatItem
      endRender={endRender}
      hideActionBar={index <= threadStartMessageIndex}
      id={id}
      index={index}
    />
  );
});

export default ThreadChatItem;
