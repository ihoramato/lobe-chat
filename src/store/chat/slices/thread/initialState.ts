import { ThreadItem, ThreadType } from '@/types/topic';

export interface ChatThreadState {
  activeThreadId?: string;
  creatingThread?: boolean;

  isCreatingThreadMessage?: boolean;
  newThreadMode: ThreadType;
  threadInputMessage: string;
  threadMaps: Record<string, ThreadItem[]>;

  threadStartMessageId?: string;
  threadsInit?: boolean;
}

export const initialThreadState: ChatThreadState = {
  creatingThread: false,
  newThreadMode: ThreadType.Continuation,
  threadInputMessage: '',
  threadMaps: {},
  threadsInit: false,
};
