import { Icon } from '@lobehub/ui';
import { Skeleton, Typography } from 'antd';
import isEqual from 'fast-deep-equal';
import { ListTree } from 'lucide-react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { portalThreadSelectors } from '@/store/chat/selectors';
import { oneLineEllipsis } from '@/styles';

import NewThread from './New';

const Header = () => {
  const isInNew = useChatStore((s) => s.startToForkThread);

  const currentThread = useChatStore(portalThreadSelectors.portalCurrentThread, isEqual);
  const isInit = useChatStore((s) => s.threadsInit);

  if (!isInit) return <Skeleton.Button active size={'small'} style={{ height: 22, width: 200 }} />;

  return isInNew ? (
    <NewThread />
  ) : (
    <Flexbox align={'center'} gap={8} horizontal style={{ marginInlineStart: 8 }}>
      <Icon icon={ListTree} size={{ fontSize: 20 }} />
      <Typography.Text className={oneLineEllipsis} style={{ fontSize: 16, fontWeight: 'bold' }}>
        {currentThread?.title}
      </Typography.Text>
    </Flexbox>
  );
};

export default Header;
