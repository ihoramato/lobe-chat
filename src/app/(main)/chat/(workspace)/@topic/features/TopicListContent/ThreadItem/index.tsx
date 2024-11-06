import { Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { CornerDownRight } from 'lucide-react';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { useGlobalStore } from '@/store/global';

import Content from './Content';

const useStyles = createStyles(({ css, token, isDarkMode }) => ({
  active: css`
    background: ${isDarkMode ? token.colorFillSecondary : token.colorFillTertiary};
    transition: background 200ms ${token.motionEaseOut};

    &:hover {
      background: ${token.colorFill};
    }
  `,
  container: css`
    margin-block: 2px;
    margin-inline: 8px;

    &.thread-item {
      width: calc(100% - 16px);
    }
  `,
  split: css`
    border-block-end: 1px solid ${token.colorSplit};
  `,
  wrapper: css`
    cursor: pointer;

    margin-block: 2px;
    padding: 4px 8px;

    width: calc(100% - 28px);
    border-radius: ${token.borderRadius}px;

    &:hover {
      background: ${token.colorFillSecondary};
    }
  `,
}));

export interface ThreadItemProps {
  id: string;
  title: string;
}

const ThreadItem = memo<ThreadItemProps>(({ title, id }) => {
  const { styles, cx, theme } = useStyles();
  const toggleConfig = useGlobalStore((s) => s.toggleMobileTopic);
  const [toggleThread] = useChatStore((s) => [s.switchTopic, s.threadMaps]);
  const [isHover, setHovering] = useState(false);

  const active = false;
  return (
    <Flexbox className={cx(styles.container, 'thread-item')} horizontal>
      <Flexbox
        height={36}
        justify={'center'}
        style={{ paddingInlineEnd: 0, paddingInlineStart: 12 }}
        width={28}
      >
        <Icon color={theme.colorTextQuaternary} icon={CornerDownRight} />
      </Flexbox>
      <Flexbox
        align={'center'}
        className={cx(styles.wrapper, active && styles.active)}
        distribution={'space-between'}
        flex={1}
        horizontal
        onClick={() => {
          toggleThread(id);
          toggleConfig(false);
        }}
        onMouseEnter={() => {
          setHovering(true);
        }}
        onMouseLeave={() => {
          setHovering(false);
        }}
      >
        {<Content active={active} id={id} showMore={isHover} title={title} />}
      </Flexbox>
    </Flexbox>
  );
});

export default ThreadItem;
