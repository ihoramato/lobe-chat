import { Icon } from '@lobehub/ui';
import { Typography } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import isEqual from 'fast-deep-equal';
import { ChevronRight } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { threadSelectors } from '@/store/chat/selectors';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    cursor: pointer;

    padding-block: 12px;
    padding-inline: 16px;

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
  const openThreadInPortal = useChatStore((s) => s.openThreadInPortal);

  return (
    <Flexbox
      direction={placement === 'end' ? 'horizontal-reverse' : 'horizontal'}
      gap={12}
      paddingInline={16}
    >
      <div style={{ width: 40 }} />
      <Flexbox className={styles.container} gap={8} padding={8} style={{ width: 'fit-content' }}>
        <Flexbox gap={8} horizontal>
          <Typography.Text type={'secondary'}>子话题 {threads.length}</Typography.Text>
        </Flexbox>
        <Flexbox gap={6}>
          {threads.map((thread) => (
            <Flexbox
              gap={8}
              horizontal
              key={thread.id}
              onClick={() => {
                openThreadInPortal(thread.id);
              }}
            >
              {thread?.title}
              <Typography.Text type={'secondary'}>
                {dayjs(thread?.lastActiveAt).format('YYYY-MM-DD')}
              </Typography.Text>
              <Typography.Link>
                4条消息 <Icon icon={ChevronRight} />
              </Typography.Link>
            </Flexbox>
          ))}
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );
});

export default Thread;
