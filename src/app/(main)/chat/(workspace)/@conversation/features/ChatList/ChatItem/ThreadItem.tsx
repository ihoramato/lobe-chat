import { Icon } from '@lobehub/ui';
import { Typography } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import isEqual from 'fast-deep-equal';
import { ChevronRight } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';
import { ThreadItem } from '@/types/topic';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    cursor: pointer;
    padding-block: 6px;
    padding-inline: 8px;
    border-radius: 6px;

    &:hover {
      background: ${token.colorFillTertiary};
    }
  `,
}));

const Item = memo<ThreadItem>(({ id, title, lastActiveAt, sourceMessageId }) => {
  const openThreadInPortal = useChatStore((s) => s.openThreadInPortal);
  const { styles } = useStyles();
  const messageCount = useChatStore(chatSelectors.countMessagesByThreadId(id), isEqual);

  return (
    <Flexbox
      align={'baseline'}
      className={styles.container}
      gap={8}
      horizontal
      onClick={() => {
        openThreadInPortal(id, sourceMessageId);
      }}
    >
      {title}
      <Typography.Text type={'secondary'}>
        {!!messageCount && `${messageCount} 条消息 · `}
        {dayjs(lastActiveAt).format('YYYY-MM-DD')}
        <Icon icon={ChevronRight} />
      </Typography.Text>
    </Flexbox>
  );
});

export default Item;
