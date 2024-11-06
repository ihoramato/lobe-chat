'use client';

import isEqual from 'fast-deep-equal';
import React, { memo, useCallback } from 'react';

import { InboxWelcome, VirtualizedList } from '@/features/Conversation';
import { useChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';
import { useSessionStore } from '@/store/session';

import MainChatItem from './ChatItem';

interface ListProps {
  mobile?: boolean;
}

const Content = memo<ListProps>(({ mobile }) => {
  const [activeTopicId, useFetchMessages, showInboxWelcome, isCurrentChatLoaded] = useChatStore(
    (s) => [
      s.activeTopicId,
      s.useFetchMessages,
      chatSelectors.showInboxWelcome(s),
      chatSelectors.isCurrentChatLoaded(s),
    ],
  );

  const [sessionId] = useSessionStore((s) => [s.activeId]);
  useFetchMessages(sessionId, activeTopicId);

  const data = useChatStore(chatSelectors.mainChatMessageIdsWithGuide, isEqual);

  const itemContent = useCallback(
    (index: number, id: string) => <MainChatItem id={id} index={index} />,
    [mobile],
  );

  if (showInboxWelcome && isCurrentChatLoaded) return <InboxWelcome />;

  return <VirtualizedList dataSource={data} itemContent={itemContent} mobile={mobile} />;
});

Content.displayName = 'ChatListRender';

export default Content;
