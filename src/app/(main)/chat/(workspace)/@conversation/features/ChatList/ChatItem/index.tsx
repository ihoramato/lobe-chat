import { createStyles } from 'antd-style';
import React, { memo, useMemo } from 'react';

import { ChatItem } from '@/features/Conversation';
import ActionsBar from '@/features/Conversation/components/ChatItem/ActionsBar';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { chatSelectors, threadSelectors } from '@/store/chat/selectors';

import Thread from './Thread';

const useStyles = createStyles(({ css, token }) => ({
  end: css`
    &::after {
      inset-inline-end: 36px;
      border-inline-end: 2px solid ${token.colorSplit};
      border-end-end-radius: 8px;
    }
  `,
  line: css`
    &::after {
      content: '';

      position: absolute;
      inset-block: 56px 50px;

      width: 32px;

      border-block-end: 2px solid ${token.colorSplit};
    }
  `,
  start: css`
    &::after {
      inset-inline-start: 36px;
      border-inline-start: 2px solid ${token.colorSplit};
      border-end-start-radius: 8px;
    }
  `,
}));

export interface ThreadChatItemProps {
  id: string;
  index: number;
}

const MainChatItem = memo<ThreadChatItemProps>(({ id, index }) => {
  const { styles, cx } = useStyles();

  const [type] = useAgentStore((s) => {
    const config = agentSelectors.currentAgentChatConfig(s);
    return [config.displayMode || 'chat'];
  });

  const userRole = useChatStore((s) => chatSelectors.getMessageById(id)(s)?.role);

  const placement = type === 'chat' && userRole === 'user' ? 'end' : 'start';
  const [showThread, historyLength] = useChatStore((s) => [
    threadSelectors.hasThreadBySourceMsgId(id)(s),
    chatSelectors.mainChatMessageIdsWithGuide(s).length,
  ]);

  const enableHistoryDivider = useAgentStore((s) => {
    const config = agentSelectors.currentAgentChatConfig(s);
    return (
      config.enableHistoryCount &&
      historyLength > (config.historyCount ?? 0) &&
      config.historyCount === historyLength - index
    );
  });

  const actionBar = useMemo(() => <ActionsBar id={id} />, [id]);

  return (
    <ChatItem
      actionBar={actionBar}
      className={showThread ? cx(styles.line, styles[placement]) : ''}
      enableHistoryDivider={enableHistoryDivider}
      endRender={showThread && <Thread id={id} placement={placement} />}
      id={id}
      index={index}
    />
  );
});

export default MainChatItem;
