import {
  parseSmsMessage,
  parseTransactionSms,
} from '../src/features/sms/smsParser';
import {SmsMessage} from '../src/features/sms/types';

const makeMessage = (
  body: string,
  address = 'HDFCBK',
  date = new Date(2026, 7, 3, 14, 30).getTime(),
): SmsMessage => ({
  id: '1',
  threadId: '1',
  address,
  body,
  date,
  read: true,
  type: 1,
});

describe('parseSmsMessage', () => {
  test('enriches with bank name, date and time', () => {
    const result = parseSmsMessage(
      makeMessage(
        'HDFC Bank: Rs.850.00 debited from A/c XX1234 to SWIGGY UPI on 03-08-26. Avl Bal Rs.12,540.00',
      ),
    );

    expect(result).toMatchObject({
      amount: 850,
      type: 'debit',
      merchant: 'SWIGGY',
      bankName: 'HDFC Bank',
      date: '2026-08-03',
      time: '14:30',
    });
  });

  test('returns null for non-transaction SMS', () => {
    expect(
      parseSmsMessage(makeMessage('Your OTP is 482913.')),
    ).toBeNull();
  });

  test('rejects non-bank SMS with Rs amount (no sender match, no account ref)', () => {
    const result = parseSmsMessage(
      makeMessage(
        'We have received SIM card/eSIM replacement request for your Jio Number 7298052222. maximum charges for duplicate SIM card is Rs. 50.00 only.',
        'Jio',
      ),
    );

    expect(result).toBeNull();
  });

  test('accepts account reference even when sender is unknown', () => {
    const result = parseSmsMessage(
      makeMessage(
        'Your A/c No xx 1712 has been credited by INR 1.00 on 21-JAN-2026 by IMPS 602109052439 from REMITTER. A/c Bal is INR 8,136.29 CR',
        '51651',
      ),
    );

    expect(result).toMatchObject({
      amount: 1,
      type: 'credit',
      paymentMethod: 'IMPS',
      balance: 8136.29,
    });
  });

  test('balance CR suffix means Credit, not crore', () => {
    const result = parseSmsMessage(
      makeMessage(
        'Your A/c No xx 1712 has been credited by INR 1.00 on 21-JAN-2026 by IMPS 602109052439 from REMITTER. A/c Bal is INR 8,136.29 CR and AVL Bal INR 8,136.29-Bank of Maharashtra',
        '51651',
      ),
    );

    expect(result).toMatchObject({
      amount: 1,
      type: 'credit',
      balance: 8136.29,
    });
    expect(result?.balance).toBeLessThan(100000);
  });

  test('extracts reference number label correctly', () => {
    const result = parseSmsMessage(
      makeMessage(
        'Rs.500 debited from A/c XX1234 on 03-08-26 Ref No 880238473219 via NEFT',
        'SBIINB',
      ),
    );

    expect(result).toMatchObject({referenceNumber: '880238473219'});
  });

  test('detects real ICICI sender AD-ICICIT-S', () => {
    const result = parseSmsMessage(
      makeMessage(
        'ICICI Bank Acct XX551 debited for Rs 90.00 on 04-Aug-26; DELICIA FOODS credited. UPI:244911710317.',
        'AD-ICICIT-S',
      ),
    );

    expect(result).toMatchObject({
      amount: 90,
      type: 'debit',
      merchant: 'DELICIA FOODS',
      bankName: 'ICICI Bank',
      paymentMethod: 'UPI',
      referenceNumber: '244911710317',
    });
  });

  test('Acct reference passes gating even for unknown sender', () => {
    const result = parseSmsMessage(
      makeMessage(
        'ICICI Bank Acct XX551 debited for Rs 30.00 on 05-Aug-26; Maha Mumbai Met credited.',
        '51651',
      ),
    );

    expect(result).toMatchObject({amount: 30, type: 'debit'});
  });
});

describe('parseTransactionSms', () => {
  test('parses HDFC UPI debit to merchant', () => {
    const result = parseTransactionSms(
      'HDFC Bank: Rs.850.00 debited from A/c XX1234 to SWIGGY UPI on 03-08-26. Avl Bal Rs.12,540.00',
    );

    expect(result).toMatchObject({
      amount: 850,
      type: 'debit',
      merchant: 'SWIGGY',
      accountNumber: 'XXXX1234',
      paymentMethod: 'UPI',
      balance: 12540,
    });
  });

  test('parses SBI salary credit', () => {
    const result = parseTransactionSms(
      'SBI: INR 2,500.00 credited to A/c XX5678. Salary credit. Available Balance Rs.45,500.00',
    );

    expect(result).toMatchObject({
      amount: 2500,
      type: 'credit',
      merchant: 'SALARY',
      accountNumber: 'XXXX5678',
      paymentMethod: 'UNKNOWN',
      balance: 45500,
    });
  });

  test('parses ICICI debit card purchase', () => {
    const result = parseTransactionSms(
      'ICICI Bank: Rs.1,200.00 debited from A/c XX9876 to AMAZON via Debit Card.',
    );

    expect(result).toMatchObject({
      amount: 1200,
      type: 'debit',
      merchant: 'AMAZON',
      paymentMethod: 'DEBIT_CARD',
    });
  });

  test('parses UPI transaction with VPA handle', () => {
    const result = parseTransactionSms(
      'UPI transaction: Rs.500 debited from A/c XX1234 to swiggy@upi.',
    );

    expect(result).toMatchObject({
      amount: 500,
      type: 'debit',
      merchant: 'swiggy',
      paymentMethod: 'UPI',
    });
  });

  test('parses ATM withdrawal', () => {
    const result = parseTransactionSms(
      'ATM: Rs.5,000 withdrawn from A/c XX1234. Avl Bal Rs.20,000.00',
    );

    expect(result).toMatchObject({
      amount: 5000,
      type: 'debit',
      merchant: 'ATM',
      paymentMethod: 'ATM',
    });
  });

  test('parses new payment methods', () => {
    expect(
      parseTransactionSms(
        'Rs.50,000 debited from A/c XX1234 by RTGS',
      ),
    ).toMatchObject({paymentMethod: 'RTGS'});

    expect(
      parseTransactionSms(
        'Rs.3,500 debited from A/c XX1234 towards EMI of LOAN',
      ),
    ).toMatchObject({paymentMethod: 'EMI'});

    expect(
      parseTransactionSms(
        'Rs.500 debited from A/c XX1234 to JIO MART via Paytm wallet',
      ),
    ).toMatchObject({paymentMethod: 'WALLET'});

    expect(
      parseTransactionSms(
        'Cheque No. 123456 for Rs.4,000 debited from A/c XX1234',
      ),
    ).toMatchObject({paymentMethod: 'CHEQUE'});
  });

  test('transferred keyword is treated as debit', () => {
    const result = parseTransactionSms(
      'SBI: Rs.500 transferred from A/c XX1234 to SURESH',
    );

    expect(result).toMatchObject({
      type: 'debit',
      amount: 500,
      merchant: 'SURESH',
    });
  });

  test('refunded is treated as credit', () => {
    const result = parseTransactionSms(
      'Rs.2,000 refunded to A/c XX5678',
    );

    expect(result).toMatchObject({
      type: 'credit',
      amount: 2000,
    });
  });

  test('ICICI "debited for Rs ... merchant credited" is a DEBIT', () => {
    const result = parseTransactionSms(
      'ICICI Bank Acct XX551 debited for Rs 30.00 on 05-Aug-26; Maha Mumbai Met credited. UPI:978368986522.',
    );

    expect(result).toMatchObject({
      type: 'debit',
      amount: 30,
      merchant: 'Maha Mumbai Met',
      paymentMethod: 'UPI',
      referenceNumber: '978368986522',
    });
  });

  test('payout "transferred to your Bank A/C" is a credit', () => {
    const result = parseTransactionSms(
      'Rs.22.08 transferred to your Bank A/C Ref No. 4321098765 SEBI payout',
    );

    expect(result).toMatchObject({
      type: 'credit',
      amount: 22.08,
    });
  });

  test('merchant is not "Rs" when text says "debited for Rs"', () => {
    const result = parseTransactionSms(
      'ICICI Bank Acct XX551 debited for Rs 45.00 on 03-Aug-26; VINOD SAW credited.',
    );

    expect(result).toMatchObject({
      type: 'debit',
      merchant: 'VINOD SAW',
    });
  });

  test('merchant blacklist filters junk merchants', () => {
    const result = parseTransactionSms(
      'Rs.100 debited from A/c XX1234 to your account',
    );

    expect(result).toMatchObject({
      type: 'debit',
      amount: 100,
      merchant: undefined,
    });
  });

  test('returns null for non-transaction SMS', () => {
    expect(parseTransactionSms('Your OTP for login is 482913. Do not share it.')).toBeNull();
  });

  test('returns null for empty message', () => {
    expect(parseTransactionSms('')).toBeNull();
  });
});
