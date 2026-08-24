import {NativeModules, Platform} from 'react-native';
import {parseSmsMessage} from './smsParser';
import {ensureSmsPermission} from './smsPermission';
import {ParsedTransaction, SmsMessage} from './types';

interface SmsNativeModule {
  getAllSms(limit: number): Promise<SmsMessage[]>;
  getUnreadSms(limit: number): Promise<SmsMessage[]>;
  getSmsByAddress(address: string): Promise<SmsMessage[]>;
}

const SmsModule = NativeModules.SmsModule as SmsNativeModule | undefined;

const DEFAULT_LIMIT = 500;

const requireSmsModule = (): SmsNativeModule => {
  if (!SmsModule) {
    throw new Error(
      'SmsModule not found. Rebuild the app: `npm run android`',
    );
  }

  return SmsModule;
};

export const getAllSms = async (
  limit: number = DEFAULT_LIMIT,
): Promise<SmsMessage[]> => {
  if (Platform.OS !== 'android') {
    return [];
  }

  return requireSmsModule().getAllSms(limit);
};

export const getUnreadSms = async (
  limit: number = DEFAULT_LIMIT,
): Promise<SmsMessage[]> => {
  if (Platform.OS !== 'android') {
    return [];
  }

  return requireSmsModule().getUnreadSms(limit);
};

export const getSmsByAddress = async (
  address: string,
): Promise<SmsMessage[]> => {
  if (Platform.OS !== 'android') {
    return [];
  }

  return requireSmsModule().getSmsByAddress(address);
};
//smsPermission.ts
export const readTransactionsFromSms = async ({
  limit = 200,
}: {
  limit?: number;
} = {}): Promise<ParsedTransaction[]> => {
  if (!(await ensureSmsPermission())) {
    throw new Error('READ_SMS permission not granted');
  }

  const messages = await getAllSms(limit);

  const transactions: ParsedTransaction[] = [];

  for (const message of messages) {
    const parsed = parseSmsMessage(message);

    if (parsed) {
      transactions.push(parsed);
    }
  }

  return transactions.slice(0, limit);
};
