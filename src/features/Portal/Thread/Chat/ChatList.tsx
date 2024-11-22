import React, { memo, useCallback } from 'react';
import { Flexbox } from 'react-layout-kit';

import { SkeletonList, VirtualizedList } from '@/features/Conversation';
import { useChatStore } from '@/store/chat';
import { threadSelectors } from '@/store/chat/selectors';

import ThreadChatItem from './ChatItem';

interface ChatListProps {
  mobile?: boolean;
}

const ChatList = memo(({ mobile }: ChatListProps) => {
  const data = useChatStore(threadSelectors.portalThreadMessageIds);
  const isInit = useChatStore((s) => s.threadsInit);

  const useFetchThreads = useChatStore((s) => s.useFetchThreads);

  useFetchThreads();

  const itemContent = useCallback(
    (index: number, id: string) => <ThreadChatItem id={id} index={index} />,
    [mobile],
  );

  if (!isInit) return <SkeletonList mobile={mobile} />;

  return (
    <Flexbox
      flex={1}
      style={{
        overflowX: 'hidden',
        overflowY: 'auto',
        position: 'relative',
      }}
      width={'100%'}
    >
      <VirtualizedList dataSource={data} itemContent={itemContent} mobile={mobile} />
    </Flexbox>
  );
});

export default ChatList;
