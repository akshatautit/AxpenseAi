import {
  ParsedTransaction,
  PaymentMethod,
  TransactionType,
} from '../types';

export const parseGenericTransactionSms = (
  message: string,
): ParsedTransaction | null => {
  const text = message.replace(/\s+/g, ' ').trim();

  if (!text) {
    return null;
  }

  // 1. Check if SMS looks like a transaction SMS
  const transactionKeywords =
    /\b(debited|debited by|debited from|credited|credit|debit|spent|received|paid|withdrawn|withdrawal|transferred|transfer|transaction|payment|purchase|upi|neft|rtgs|imps|pos|wallet|emi|refund(?:ed)?|cashback|reversal|atm|ecs)\b|भुगतान|जमा|निकासी|धनराशि|काटा|रुपये/i;

  if (!transactionKeywords.test(text)) {
    console.log(
      '[SmsParser] reject: no transaction keyword:',
      text.slice(0, 80),
    );
    return null;
  }

  // 2. Extract amount. Currency symbol pehle; agar na ho to verb-anchored
  // number bhi chale (bina currency ke Indian SMS formats ke liye).
  const amountMatch =
    text.match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
    text.match(
      /\b(?:of|for|amount\s+(?:of|is))?\s*((?=[\d,]*[.,])[\d,]+(?:\.\d{1,2})?)\s+(?:debited|credited|withdrawn|transferred|paid|spent|refunded|cashback)\b/i,
    );

  if (!amountMatch) {
    console.log(
      '[SmsParser] reject: no amount:',
      text.slice(0, 80),
    );
    return null;
  }

  const amount = Number(amountMatch[1].replace(/,/g, ''));

  // 3. Determine credit/debit.
  // Precedence matters: "debited" (our account went out) wins even when a
  // counterparty is "credited" in the same SMS, e.g. ICICI:
  //   "Acct XX551 debited for Rs 30.00 on 05-Aug-26; Maha Mumbai Met credited."
  // Inbound payout formats ("transferred to your Bank A/C") are credits.
  let type: TransactionType;

  if (
    /\bdebit(?:ed)?\b|\bwithdraw(?:al|n)\b|\b(?:paid|spent)\s+at\b|\bpurchase(?:d)?\s+(?:at|of)\b|\bswiped\b|\bpayment\b|काटा|निकासी|भुगतान/i.test(
      text,
    )
  ) {
    type = 'debit';
  } else if (
    /\b(credited|credit|received|refund(?:ed)?|cashback|reversal|added to|salary)\b|जमा/i.test(
      text,
    ) ||
    /\b(?:has\s+been\s+)?(?:transferred?|transfer)\s+to\s+(?:your|my)\s*(?:bank\s*)?(?:a\/?c|account)\b/i.test(text)
  ) {
    type = 'credit';
  } else if (
    /\b(?:transferred?|spent|paid|withdrawn|purchase|swiped)\b/i.test(text)
  ) {
    type = 'debit';
  } else {
    console.log(
      '[SmsParser] reject: cannot determine debit/credit:',
      text.slice(0, 80),
    );
    return null;
  }

  // 4. Detect payment method
  const paymentMethod = detectPaymentMethod(text);

  // 5. Extract account number
  const accountMatch = text.match(
    /(?:a\/c|account|acct)\s*(?:no\.?|number)?\s*(?:xx|\*+)?(\d{2,6})/i,
  );

  // 6. Extract balance. "Avl.Bal." / "Avl. Bal" / "A/c Bal" / "Available
  // Balance" / "New Balance" / "Closing Bal" sab support hote hain. Purana
  // regex fallback ke liye rakha hai (naya miss kare to purana try hota hai).
  const balanceMatch =
    text.match(
      /\b(?:Avl(?:\.)?\s*Bal(?:ance)?\.?|Available\s*Bal(?:ance)?\.?|(?:A\/c|Acct|Account)\s*Bal(?:ance)?\.?|New\s*Bal(?:ance)?\.?|Closing\s*Bal(?:ance)?\.?|Bal(?:ance)?\.?)\s*[:.-]?\s*(?:is\s+)?(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    ) ||
    text.match(
      /(?:Avl\.?\s*Bal(?:ance)?|Available\s*Balance|Bal(?:ance)?)\s*(?:is|:)?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    );

  // 7. Extract reference / transaction ID
  const referenceMatch = text.match(
    /\b(?:Ref(?:erence)?|Transaction|Txn)\b(?:\.?\s*|\s*:\s*)(?:No\.?|Number|ID)?\s*[:#-]?\s*([A-Za-z0-9]+)|\bUPI\s*:?\s*([0-9]{8,})/i,
  );

  // 8. Try to extract merchant
  const merchant = extractMerchant(text, type, paymentMethod);

  return {
    amount,
    type,

    merchant,

    accountNumber: accountMatch
      ? `XXXX${accountMatch[1]}`
      : undefined,

    balance: balanceMatch
      ? Number(balanceMatch[1].replace(/,/g, ''))
      : undefined,

    referenceNumber: referenceMatch
      ? referenceMatch[1] ?? referenceMatch[2]
      : undefined,

    paymentMethod,

    rawMessage: message,
  };
};

const detectPaymentMethod = (text: string): PaymentMethod => {
  if (/\bUPI\b|upi@/i.test(text)) {
    return 'UPI';
  }

  if (/\bwallet\b|paytm|mobikwik|amazon pay/i.test(text)) {
    return 'WALLET';
  }

  if (/\bATM\b|cash withdrawal|withdrawn from/i.test(text)) {
    return 'ATM';
  }

  if (/\bNEFT\b/i.test(text)) {
    return 'NEFT';
  }

  if (/\bRTGS\b/i.test(text)) {
    return 'RTGS';
  }

  if (/\bIMPS\b/i.test(text)) {
    return 'IMPS';
  }

  if (/\bECS\b|\bauto.?pay\b|\bautopay\b/i.test(text)) {
    return 'ECS';
  }

  if (/\bEMI\b/i.test(text)) {
    return 'EMI';
  }

  if (/\bcheque\b|\bchq\b|\bcheq\b/i.test(text)) {
    return 'CHEQUE';
  }

  if (/\bcredit card\b|\bCC\b/i.test(text)) {
    return 'CREDIT_CARD';
  }

  if (/\bdebit card\b|\bDC\b/i.test(text)) {
    return 'DEBIT_CARD';
  }

  if (/\bPOS\b|point of sale/i.test(text)) {
    return 'POS';
  }

  if (
    /\bbank transfer\b|\btransferred\b|\btransfer\b/i.test(text)
  ) {
    return 'BANK_TRANSFER';
  }

  return 'UNKNOWN';
};

const MERCHANT_BLACKLIST = [
  'account',
  'a/c',
  'ac',
  'your',
  'yours',
  'yourself',
  'self',
  'myself',
  'beneficiary',
  'upi',
  'card',
  'wallet',
  'saving',
  'savings',
  'credited',
  'debited',
  'no',
  'number',
];

const isValidMerchant = (name: string): boolean => {
  const normalized = name.trim().toLowerCase();
  return (
    normalized.length > 0 &&
    !MERCHANT_BLACKLIST.some(
      (word) =>
        normalized === word ||
        normalized.startsWith(`${word} `) ||
        normalized.includes(` ${word}`),
    )
  );
};

const extractMerchant = (
  text: string,
  type: TransactionType,
  paymentMethod: PaymentMethod,
): string | undefined => {
  if (paymentMethod === 'ATM') {
    return 'ATM';
  }

  // UPI:
  // "debited ... to SWIGGY@upi"
  const upiMatch = text.match(
    /\bto\s+([A-Za-z0-9._-]+)@(?:upi|ybl|ibl|axl|paytm|okaxis|okhdfcbank|okicici|oksbi|oksbm|okpnb)\b/i,
  );

  if (upiMatch) {
    return upiMatch[1];
  }

  // ICICI-style debit: "... debited for Rs 30.00 on 05-Aug-26; Maha Mumbai Met credited."
  if (type === 'debit') {
    const creditedCounterparty = text.match(
      /;\s*([A-Za-z][A-Za-z0-9 &._-]*?)\s+credited\b/i,
    );

    if (creditedCounterparty && isValidMerchant(creditedCounterparty[1])) {
      return creditedCounterparty[1].trim();
    }
  }

  // "debited ... to SWIGGY" / "spent at AMAZON" / "paid for Netflix"
  // Stops at trailing metadata words, numbers, or punctuation.
  // Currency markers ("for Rs 30") are never merchants.
  const merchantMatch = text.match(
    /\b(?:to|at|for)\s+(?!Rs\.?\b|INR\b|₹|US\$)([A-Za-z][A-Za-z0-9 &._-]*?)(?=\s+(?:on|via|using|ref(?:erence)?(?: no)?|txn(?: id)?|upi|from|Avl|Bal(?:ance)?|at|for|to|is|date|time)\b|\s+[\d,]+|[,.]|$)/i,
  );

  if (merchantMatch && isValidMerchant(merchantMatch[1])) {
    return merchantMatch[1].trim();
  }

  // For credits such as salary
  if (type === 'credit') {
    if (/\bsalary\b/i.test(text)) {
      return 'SALARY';
    }
  }

  return undefined;
};
