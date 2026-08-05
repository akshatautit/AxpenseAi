export type TransactionType = 'credit' | 'debit';

export interface SmsMessage {
  id: string;
  threadId: string;
  address: string;
  body: string;
  date: number;
  read: boolean;
  type: number;
}

export interface SmsQueryOptions {
  sender?: string;
  keywords?: string[];
  startDate?: number;
  limit?: number;
}

export type PaymentMethod =
  | 'UPI'
  | 'WALLET'
  | 'ATM'
  | 'NEFT'
  | 'RTGS'
  | 'IMPS'
  | 'ECS'
  | 'EMI'
  | 'CHEQUE'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'POS'
  | 'BANK_TRANSFER'
  | 'UNKNOWN';

export interface ParsedTransaction {
  amount: number;
  type: TransactionType;

  sender?: string;
  merchant?: string;
  accountNumber?: string;

  date?: string;
  time?: string;

  balance?: number;

  referenceNumber?: string;

  paymentMethod: PaymentMethod;

  bankName?: string;

  rawMessage: string;
}
