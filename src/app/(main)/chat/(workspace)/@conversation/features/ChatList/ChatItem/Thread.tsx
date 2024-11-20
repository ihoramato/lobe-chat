import { Typography } from 'antd';
import { createStyles } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { threadSelectors } from '@/store/chat/selectors';

import ThreadItem from './ThreadItem';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    cursor: pointer;

    padding-block: 12px 8px;
    padding-inline: 8px;

    background: ${token.colorFillTertiary};
    border-radius: 6px;
  `,
}));

interface ThreadProps {
  id: string;
  placement: 'start' | 'end';
}

const Thread = memo<ThreadProps>(({ id, placement }) => {
  const { styles } = useStyles();

  const threads = useChatStore(threadSelectors.getThreadsBySourceMsgId(id), isEqual);

  return (
    <Flexbox
      direction={placement === 'end' ? 'horizontal-reverse' : 'horizontal'}
      gap={12}
      paddingInline={16}
    >
      <div style={{ width: 40 }} />
      <Flexbox className={styles.container} gap={8} padding={4} style={{ width: 'fit-content' }}>
        <Flexbox gap={8} horizontal paddingInline={6}>
          <Typography.Text style={{ fontSize: 12 }} type={'secondary'}>
            子话题 {threads.length}
          </Typography.Text>
        </Flexbox>
        <Flexbox>
          {threads.map((thread) => (
            <ThreadItem key={thread.id} {...thread} />
          ))}
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );
});

export default Thread;
