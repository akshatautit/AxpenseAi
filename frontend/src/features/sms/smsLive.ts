import {DeviceEventEmitter} from 'react-native';
import {SmsMessage} from './types';

export const EVENT_NEW_SMS = 'onNewSms';

// Naya SMS aane par native (SmsModule) se event aata hai. Ye subscribe karta
// hai aur normalized SmsMessage callback ko deta hai. Cleanup function return.
export const subscribeToNewSms = (
  handler: (message: SmsMessage) => void,
): (() => void) => {
  const subscription = DeviceEventEmitter.addListener(
    EVENT_NEW_SMS,
    (event: {
      id?: unknown;
      threadId?: unknown;
      address?: unknown;
      body?: unknown;
      date?: unknown;
      read?: unknown;
      type?: unknown;
    }) => {
      handler({
        id: String(event?.id ?? ''),
        threadId: String(event?.threadId ?? ''),
        address: String(event?.address ?? ''),
        body: String(event?.body ?? ''),
        date: Number(event?.date ?? Date.now()),
        read: Boolean(event?.read),
        type: Number(event?.type ?? 1),
      });
    },
  );
  return () => subscription.remove();
};
