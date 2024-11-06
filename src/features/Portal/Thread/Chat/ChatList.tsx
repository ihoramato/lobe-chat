import isEqual from 'fast-deep-equal';
import React, { memo, useCallback } from 'react';
import { Flexbox } from 'react-layout-kit';

import { VirtualizedList } from '@/features/Conversation';
import { useChatStore } from '@/store/chat';
import { threadSelectors } from '@/store/chat/selectors';

import ThreadChatItem from './ChatItem';

interface ConversationProps {
  mobile?: boolean;
}

const Conversation = memo(({ mobile }: ConversationProps) => {
  const data = useChatStore(threadSelectors.threadMessages, isEqual);

  const itemContent = useCallback(
    (index: number, id: string) => <ThreadChatItem id={id} index={index} />,
    [mobile],
  );

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

export default Conversation;
