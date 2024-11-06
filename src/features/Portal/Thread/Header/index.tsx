import { Icon } from '@lobehub/ui';
import { Typography } from 'antd';
import { GitBranch } from 'lucide-react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { portalThreadSelectors } from '@/store/chat/selectors';
import { oneLineEllipsis } from '@/styles';

import NewThread from './New';

const Header = () => {
  const currentThread = useChatStore(portalThreadSelectors.portalCurrentThread);

  return !currentThread ? (
    <NewThread />
  ) : (
    <Flexbox align={'center'} gap={8} horizontal style={{ marginInlineStart: 8 }}>
      <Icon icon={GitBranch} size={{ fontSize: 20 }} />
      <Typography.Text className={oneLineEllipsis} style={{ fontSize: 16, fontWeight: 'bold' }}>
        {currentThread.title}
      </Typography.Text>
    </Flexbox>
  );
};

export default Header;
