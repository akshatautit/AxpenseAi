import {parseGenericTransactionSms} from './parsers/genericParser';
import {ParsedTransaction, SmsMessage} from './types';

export const parseTransactionSms = parseGenericTransactionSms;

export {parseGenericTransactionSms} from './parsers/genericParser';

// Generic parser ka result lekar usme **bankName**, **date**, **time** add karta hai.
const BANK_SENDERS: Array<[RegExp, string]> = [
  // Major private banks
  [/HDFCBK|VM-HDFCBK/i, 'HDFC Bank'],
  [/ICICIT|ICICIO|ICICIB|ICICIPB|VM-ICICI/i, 'ICICI Bank'],
  [/AXISBANK|AXISBK|VM-AXIS|AXSB/i, 'Axis Bank'],
  [/KOTAKBANK|KOTAKBK|KOTAKUPI|VM-KOTAK/i, 'Kotak Mahindra Bank'],
  [/YESBANK/i, 'Yes Bank'],
  [/IDFCBK/i, 'IDFC First Bank'],
  [/INDB|INDUS|VM-INDUS/i, 'IndusInd Bank'],
  [/RBLBK|VM-RBL|^RBL/i, 'RBL Bank'],
  [/BANDHAN|VM-BANDHAN|BANDBK/i, 'Bandhan Bank'],

  // PSU (government) banks
  [/SBIINB|SBIUPI|SBIIN/i, 'State Bank of India'],
  [/PNBSMS|^PNB/i, 'Punjab National Bank'],
  [/BOBSMS|^BOB/i, 'Bank of Baroda'],
  [/CBSCNB|CNB|VM-CANARA/i, 'Canara Bank'],
  [/BOIMSG|VM-BOI|^BOI/i, 'Bank of India'],
  [/CBISMS|VM-CBI|^CBI/i, 'Central Bank of India'],
  [/INBK|VM-INBK|INDIANBK/i, 'Indian Bank'],
  [/IOBSMS|VM-IOB|^IOB/i, 'Indian Overseas Bank'],
  [/BOMBANK|VM-BOMBANK|BMSMS/i, 'Bank of Maharashtra'],
  [/PSBSMS|VM-PSB|^PSB/i, 'Punjab & Sind Bank'],
  [/^UBI/i, 'Union Bank of India'],
  [/JKBK|VM-JKBK/i, 'Jammu & Kashmir Bank'],

  // Private / old private banks
  [/FEDBANK/i, 'Federal Bank'],
  [/SIBM|VM-SIBM|^SIB/i, 'South Indian Bank'],
  [/^TMB/i, 'Tamilnad Mercantile Bank'],
  [/KARNBK|VM-KARNBK/i, 'Karnataka Bank'],
  [/KVB|VM-KVB/i, 'Karur Vysya Bank'],
  [/CITYUNION|VM-CUB|^CUB/i, 'City Union Bank'],
  [/DHANL|VM-DHANL/i, 'Dhanlaxmi Bank'],

  // Small finance banks
  [/AUSFB|VM-AUSFB|AUSBK/i, 'AU Small Finance Bank'],
  [/EQUITAS|VM-EQUITAS/i, 'Equitas Small Finance Bank'],
  [/UJJIVAN|VM-UJJIVAN/i, 'Ujjivan Small Finance Bank'],
  [/JANASF|VM-JANA/i, 'Jana Small Finance Bank'],
  [/ESAF|VM-ESAF/i, 'ESAF Small Finance Bank'],

  // Payments banks
  [/PAYTM/i, 'Paytm Payments Bank'],
  [/ADBIND/i, 'Airtel Payments Bank'],
  [/JIOBANK|VM-JIOBANK/i, 'Jio Payments Bank'],
  [/IPPB|VM-IPPB/i, 'India Post Payments Bank'],
];

// Sender IDs bina pattern ke bhi bank ka naam rakh sakte hain
// (e.g. "ADB-SBI", "VM-BOB", "SBICARDS"). Fragment fallback unhe tag karta hai.
const BANK_NAME_FRAGMENTS: Array<[RegExp, string]> = [
  [/\bHDFC\b/i, 'HDFC Bank'],
  [/\bICICI\b/i, 'ICICI Bank'],
  [/\bAXIS\b/i, 'Axis Bank'],
  [/\bKOTAK\b/i, 'Kotak Mahindra Bank'],
  [/\bSBI\b/i, 'State Bank of India'],
  [/\bPNB\b/i, 'Punjab National Bank'],
  [/\bBOB\b/i, 'Bank of Baroda'],
  [/\bBOI\b/i, 'Bank of India'],
  [/\bCBI\b/i, 'Central Bank of India'],
  [/\bCANARA\b/i, 'Canara Bank'],
  [/\bIDFC\b/i, 'IDFC First Bank'],
  [/\bINDUS\b/i, 'IndusInd Bank'],
  [/\bRBL\b/i, 'RBL Bank'],
  [/\bFEDERAL\b/i, 'Federal Bank'],
  [/\bBANDHAN\b/i, 'Bandhan Bank'],
  [/\bPAYTM\b/i, 'Paytm Payments Bank'],
  [/\bAU\s+(?:SMALL)?\b/i, 'AU Small Finance Bank'],
  [/\bEQUITAS\b/i, 'Equitas Small Finance Bank'],
  [/\bUJJIVAN\b/i, 'Ujjivan Small Finance Bank'],
  [/\bIPPB\b/i, 'India Post Payments Bank'],
  [/\bYES\b/i, 'Yes Bank'],
];

const detectBankName = (sender: string): string | undefined => {
  if (!sender) {
    return undefined;
  }

  const match = BANK_SENDERS.find(([pattern]) => pattern.test(sender));

  if (match) {
    return match[1];
  }

  const fragment = BANK_NAME_FRAGMENTS.find(([pattern]) =>
    pattern.test(sender),
  );

  return fragment ? fragment[1] : undefined;
};

const formatDate = (timestampMs: number): string => {
  const date = new Date(timestampMs);
  return date.toISOString().slice(0, 10);
};

const formatTime = (timestampMs: number): string => {
  const date = new Date(timestampMs);
  return date.toTimeString().slice(0, 5);
};

export const parseSmsMessage = (
  message: SmsMessage,
): ParsedTransaction | null => {
  const senderBank = detectBankName(message.address);

  // Sirf non-transaction SMS (OTP/ad/promo) filter karo. Unknown sender bhi
  // parse ho sakta hai agar body me strong transaction verb ho.
  const hasAccountReference =
    /\bA\/c\b|\b(?:Account|Acct)\s+(?:No\.?|Number|Num|[0-9*Xx]{2,})\b/i.test(
      message.body,
    );

  const hasStrongTransactionVerb =
    /\b(debited|credited|transferred?|withdrawn|spent|refund(?:ed)?)\b/i.test(
      message.body,
    );

  if (!senderBank && !hasAccountReference && !hasStrongTransactionVerb) {
    return null;
  }

  const parsed = parseGenericTransactionSms(message.body);

  if (!parsed) {
    return null;
  }

  return {
    ...parsed,
    bankName: senderBank,
    date: formatDate(message.date),
    time: formatTime(message.date),
  };
};
