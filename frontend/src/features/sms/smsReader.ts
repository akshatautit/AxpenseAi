import {NativeModules, Platform} from 'react-native';
import {parseSmsMessage} from './smsParser';
import {ensureSmsPermission} from './smsPermission';
import {ParsedTransaction, SmsMessage} from './types';

interface SmsNativeModule {
  getAllSms(): Promise<SmsMessage[]>;
  getUnreadSms(): Promise<SmsMessage[]>;
  getSmsByAddress(address: string): Promise<SmsMessage[]>;
}

const SmsModule = NativeModules.SmsModule as SmsNativeModule | undefined;

const requireSmsModule = (): SmsNativeModule => {
  if (!SmsModule) {
    throw new Error(
      'SmsModule not found. Rebuild the app: `npm run android`',
    );
  }

  return SmsModule;
};

export const getAllSms = async (): Promise<SmsMessage[]> => {
  if (Platform.OS !== 'android') {
    return [];
  }

  return requireSmsModule().getAllSms();
};

export const getUnreadSms = async (): Promise<SmsMessage[]> => {
  if (Platform.OS !== 'android') {
    return [];
  }

  return requireSmsModule().getUnreadSms();
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

  const messages = await getAllSms();

  const transactions: ParsedTransaction[] = [];

  for (const message of messages) {
    const parsed = parseSmsMessage(message);

    if (parsed) {
      transactions.push(parsed);
    }
  }

  // Log parsed transactions for debugging (show up to the requested limit)
  try {
    console.log(`[SmsReader] parsed ${transactions.length} transactions`);
    const toLog = transactions.slice(0, limit);
    toLog.forEach((t, i) => {
      console.log(`[SmsReader] transaction ${i + 1}:`, JSON.stringify(t));
    });
  } catch (e) {
    console.log('[SmsReader] error logging transactions', e);
  }

  return transactions.slice(0, limit);
};
