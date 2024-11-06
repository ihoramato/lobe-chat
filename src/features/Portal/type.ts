import { FC } from 'react';

export interface PortalImpl {
  Body: FC;
  Header: FC;
  onClose?: () => void;
  useEnable: () => boolean;
}
