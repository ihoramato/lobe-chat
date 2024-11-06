import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import ChatInput from './ChatInput';
import ChatList from './ChatList';

interface ConversationProps {
  mobile?: boolean;
}

const Conversation = memo<ConversationProps>(({ mobile }) => (
  <Flexbox height={'100%'}>
    <ChatList mobile={mobile} />
    <ChatInput />
  </Flexbox>
));

export default Conversation;
