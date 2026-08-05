# SMS Parsing — Code Deep-Dive (Hinglish)

> Ye doc **SMS feature ki har file ka code line-by-line** samjhata hai. Har code block ke saath 3 cheezein hain:
> - **✅ Kyon** — humne ye kyun use kiya
> - **⚠️ Mistake** — isme kya galti ho sakti hai
> - **🔧 Change** — kya badal sakte ho
>
> Files covered: `types.ts`, `parsers/genericParser.ts`, `smsParser.ts`, `smsReader.ts`, `smsPermission.ts`, native Kotlin (`SmsModule.kt`, `SmsPackage.kt`, `SmsReceiver.kt`), `AndroidManifest.xml`, `App.tsx`, tests.

---

## 📊 Poore Flow ka Map

```
App.tsx (button click)
   │
   ▼
smsReader.ts  ── readTransactionsFromSms()
   │  (1) ensureSmsPermission()  → smsPermission.ts
   │  (2) getAllSms()            → NativeModules.SmsModule  → SmsModule.kt (Kotlin)
   │  (3) parseSmsMessage()      → smsParser.ts
   │                                    └─ parseGenericTransactionSms() → genericParser.ts
   ▼
ParsedTransaction[]  → UI pe dikhta hai
```

Data types: `SmsMessage` (raw SMS) → `ParsedTransaction` (clean transaction).

---

## 📁 1. `src/features/sms/types.ts` — Sab Types (Data Contract)

**Kaam:** App ke saare data shapes yahan defined hain — koi bhi file inhe import karti hai.

```ts
export type TransactionType = 'credit' | 'debit';
```
- Kya karta: Sirf 2 values allow karta hai.
- **✅ Kyon:** Credit/debit ko strings me galti se galat likhna bachaata hai.
- **⚠️ Mistake:** Hindi/other languages ke transactions handle nahi karte.
- **🔧 Change:** Agar "refund" type chahiye to `| 'refund'` add karo.

```ts
export interface SmsMessage {
  id: string;
  threadId: string;
  address: string;   // sender number, jaise "HDFCBK"
  body: string;      // SMS ka text
  date: number;      // Unix timestamp (ms)
  read: boolean;
  type: number;
}
```
- Kya karta: **Raw SMS** ka shape — **Kotlin module se yahi shape aata hai**.
- **✅ Kyon:** Native aur JS ke beech ka "contract" — exact column names match karte hain `SmsModule.kt` ke `cursorToMap()` se.
- **⚠️ Mistake:** Agar Kotlin me field ka naam badla aur types me nahi, to JS me `undefined` milega — koi error nahi aayega.
- **🔧 Change:** `date` ko number ke bajaye ISO string bhi rakh sakte ho (par conversion Kotlin me karni padegi).

```ts
export interface SmsQueryOptions {
  sender?: string;
  keywords?: string[];
  startDate?: number;
  limit?: number;
}
```
- **⚠️ Mistake:** Ye **currently unused** hai — `SmsModule.kt` me ab `querySms()` method nahi hai (pehle tha, hata diya gaya). Dead code hai.
- **🔧 Change:** Ya toh hata do, ya Kotlin me `querySms()` wapas add karke use karo (filtered queries ke liye useful hai).

```ts
export type PaymentMethod =
  | 'UPI' | 'WALLET' | 'ATM' | 'NEFT' | 'RTGS' | 'IMPS'
  | 'ECS' | 'EMI' | 'CHEQUE' | 'CREDIT_CARD' | 'DEBIT_CARD'
  | 'POS' | 'BANK_TRANSFER' | 'UNKNOWN';
```
- **✅ Kyon:** Payment method ke saare possible values ek jagah.
- **🔧 Change:** Naya method (jaise `CASH`) add karna ho to yahan + `detectPaymentMethod` dono update karo.

```ts
export interface ParsedTransaction {
  amount: number;
  type: TransactionType;
  sender?: string;        // ⚠️ declare hai par kabhi set nahi hota (dead field)
  merchant?: string;
  accountNumber?: string;
  date?: string;
  time?: string;
  balance?: number;
  referenceNumber?: string;
  paymentMethod: PaymentMethod;
  bankName?: string;
  rawMessage: string;     // original SMS body, debugging ke liye
}
```
- **✅ Kyon:** Ye final output shape hai jo UI/DB me jayega.
- **⚠️ Mistake:** `sender` field kabhi set nahi hota — remove karo ya set karo.
- **🔧 Change:** `category`, `id` jaisi future fields yahan add hogi.

---

## 📁 2. `src/features/sms/parsers/genericParser.ts` — Asli Parsing Logic ⭐

**Kaam:** Raw SMS **string** → `ParsedTransaction` convert karta hai (sabse important file).

### Block 1 — Text Normalize (Line 10)

```ts
const text = message.replace(/\s+/g, ' ').trim();
```
- Kya karta: `\s+` = ek ya zyada spaces/newlines → ek single space. `trim()` = aage-peeche ki spaces hatao.
- **✅ Kyon:** Bank SMS multi-line aati hain; single line me regex easy match karta hai.
- **⚠️ Mistake:** Non-breaking space (`\u00a0`) se SMS me `\s` kaam nahi karta — parse fail ho sakta hai.
- **🔧 Change:** `.replace(/\u00a0/g, ' ')` bhi add karo.

### Block 2 — Transaction Check (Lines 17-22)

```ts
const transactionKeywords =
  /\b(debited|credited|debit|credit|spent|received|paid|withdrawn|transferred|transaction)\b/i;
if (!transactionKeywords.test(text)) return null;
```
- Kya karta: Agar text me in words me se koi nahi, to **pehle hi `null` return** (fast reject — OTP SMS jaise ignore).
- **✅ Kyon:** Parser sirf transaction SMS pe kaam kare, baaki pe time waste na kare.
- **⚠️ Mistake:** Hinglish SMS ("क्रेडिट", "पैसा कटा") miss ho jata hai; `\b` non-ASCII words ke saath sahi nahi chalta.
- **🔧 Change:** Aur words add karo (`upi`, `at POS`, `refund`) ya ek array me rakho.

### Block 3 — Amount Extract (Lines 25-33)

```ts
const amountMatch = text.match(
  /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i,
);
if (!amountMatch) return null;
const amount = Number(amountMatch[1].replace(/,/g, ''));
```
- Kya karta: `₹` / `Rs` / `Rs.` / `INR` ke baad ka number pakadta hai (commas + decimals allowed), phir commas hata kar `Number` banaata hai.
- **✅ Kyon:** Amount hi transaction ka core hai — bina uske SMS ignore.
- **⚠️ Mistake:** Bina currency symbol wali SMS ("850 debited...") fail hoti hai; `USD`, `$` support nahi.
- **🔧 Change:** Currency symbol ko **optional** banao: `(?:₹|Rs\.?|INR)?` — par dhyan, tab OTP numbers bhi match ho sakte hain.

### Block 4 — Credit / Debit (Lines 36-56)

```ts
if (/\bdebit(?:ed)?\b/i.test(text)) {
  type = 'debit';
} else if (
  /\b(credited|credit|received|refund(?:ed)?|cashback|reversal|added to)\b/i.test(text) ||
  /\b(?:has\s+been\s+)?(?:transferred?|transfer)\s+to\s+(?:your|my)\s*(?:bank\s*)?(?:a\/?c|account)\b/i.test(text)
) {
  type = 'credit';
} else if (/\b(?:transferred?|spent|paid|withdrawn|purchase|swiped)\b/i.test(text)) {
  type = 'debit';
} else {
  return null;
}
```
- Kya karta: Pehle **`debited`** check (precedence — sabse strong signal), phir credit keywords + inbound payout ("transferred **to your** Bank A/C"), phir baaki debit keywords. Dono nahi to null.
- **✅ Kyon:** Precedence zaroori hai — real ICICI SMS me **donon** aate hain: `"Acct XX551 debited for Rs 30.00; Maha Mumbai Met credited"` (yahan "credited" merchant ke liye hai). Agar pehle credit check hota to **debit ko credit** bana deta (real bug mila device test me).
- **⚠️ Mistake (Real Bug Fixed):** Purane order me credit pehle tha → ICICI UPI debits galat "credit" ban rahe the. Ab `debited` hamesha win karta hai.
- **⚠️ Mistake (Real Bug Fixed):** "Rs.22.08 **transferred to your** Bank A/C (SEBI payout)" pehle debit ban jaata tha (`transferred` = debit keyword). Ab "transferred to your account" = **inbound credit**. "transferred **from**" / "transferred **to <merchant>**" = debit.
- **🔧 Change:** Aur modes add karne ho (jaise `written off`) to dono lists update karo.

### Block 5 — Payment Method (Lines 47, 91-123)

```ts
const paymentMethod = detectPaymentMethod(text);
```
```ts
if (/\bUPI\b|upi@/i.test(text)) return 'UPI';
if (/\bwallet\b|paytm|mobikwik|amazon pay/i.test(text)) return 'WALLET';
if (/\bATM\b|cash withdrawal|withdrawn from/i.test(text)) return 'ATM';
if (/\bNEFT\b/i.test(text)) return 'NEFT';
if (/\bRTGS\b/i.test(text)) return 'RTGS';
if (/\bIMPS\b/i.test(text)) return 'IMPS';
if (/\bECS\b|\bauto.?pay\b|\bautopay\b/i.test(text)) return 'ECS';
if (/\bEMI\b/i.test(text)) return 'EMI';
if (/\bcheque\b|\bchq\b|\bcheq\b/i.test(text)) return 'CHEQUE';
if (/\bcredit card\b|\bCC\b/i.test(text)) return 'CREDIT_CARD';
if (/\bdebit card\b|\bDC\b/i.test(text)) return 'DEBIT_CARD';
if (/\bPOS\b|point of sale/i.test(text)) return 'POS';
if (/\bbank transfer\b|\btransferred\b|\btransfer\b/i.test(text)) return 'BANK_TRANSFER';
return 'UNKNOWN';
```
- Kya karta: Keyword milne par method return karta hai, **order se** (UPI pehle).
- **✅ Kyon:** Har method ka format alag hota hai; rule-based classification sabse simple.
- **⚠️ Mistake:** Order matter karta hai — agar SMS me "UPI Ref" + "Debit Card" dono hain to UPI return hoga (galat ho sakta hai).
- **🔧 Change:** Isme aur patterns (jaise `POS`, `card no`) add karo — ab `WALLET`, `RTGS`, `ECS`, `EMI`, `CHEQUE`, `POS` add ho chuke hain.

### Block 6 — Account Number (Lines 50-52)

```ts
const accountMatch = text.match(
  /(?:a\/c|account|acct)\s*(?:no\.?|number)?\s*(?:xx|\*+)?(\d{2,6})/i,
);
```
- Kya karta: `A/c` / `Account` / `Acct` ke baad ke digits (2-6) pakadta hai, aur prefix me `XXXX` jodta hai (privacy ke liye).
- **✅ Kyon:** Full account number store karna security risk hai — mask kar deta hai.
- **⚠️ Mistake:** Agar SMS me account masked nahi hai (poora number) to bhi `XXXX`+last digits hi milega.
- **⚠️ Mistake (Real Bug Fixed):** Real ICICI SMS me **`Acct XX551`** likha aata hai (`A/c`/`Account` nahi) — `acct` + `/i` flag add kiya, warna accountNumber miss hota tha.
- **🔧 Change:** Last 4 digits hi chahiye to `(\d{4})` kar do.

### Block 7 — Balance (Lines 55-57)

```ts
const balanceMatch = text.match(
  /(?:Avl\.?\s*Bal(?:ance)?|Available\s*Balance|Bal(?:ance)?)\s*(?:is|:)?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
);
```
- Kya karta: `Avl Bal` / `Available Balance` ke baad ka number.
- **✅ Kyon:** Current balance nikalne ke liye (App.tsx me show hota hai).
- **⚠️ Mistake:** `Bal` (chhota) bahut cheezon ko match kar sakta hai; multiple numbers wali SMS me galat number utha sakta hai.
- **⚠️ Mistake (Confusion):** Bank SMS me "8,136.29 CR" ka "CR" = **Credit** hai, crore nahi. Regex sirf number capture karta hai isliye `balance: 8136.29` sahi aata hai — "CR" suffix ignore hota hai. (Regression test: `smsParser.test.ts` me "balance CR suffix means Credit, not crore".)
- **🔧 Change:** Regex ko strict karo — sirf `Avl Bal` aur `Available Balance` ko match karo.

### Block 8 — Reference Number (Lines 60-62)

```ts
const referenceMatch = text.match(
  /\b(?:Ref(?:erence)?|Transaction|Txn)\b(?:\.?\s*|\s*:\s*)(?:No\.?|Number|ID)?\s*[:#-]?\s*([A-Za-z0-9]+)|\bUPI\s*:?\s*([0-9]{8,})/i,
);
```
- Kya karta: UPI Ref / Txn ID / Ref No ke baad ka alphanumeric ID; real ICICI format me **`UPI:978368986522`** ka bhi txn id (`[0-9]{8,}`) nikalta hai.
- **✅ Kyon:** Duplicate transactions filter karne ke liye (future me unique key banega).
- **⚠️ Mistake (Real Bug Fixed):** Purane regex me "Reference Number : CO0001W679AU" se value ki jagah label "Number" capture ho jata tha (`Number` ko value samajhta tha). Ab label (`No|Number|ID`) pehle consume hota hai.
- **⚠️ Mistake (Real Bug Fixed):** ICICI UPI SMS me sirf `UPI:978368986522` hota hai (Ref/Txn label nahi) — pehle referenceNumber milta hi nahi tha. Ab alternation me `\bUPI\s*:?\s*([0-9]{8,})` add kiya; `referenceMatch[1] ?? referenceMatch[2]` se value li jati hai.
- **🔧 Change:** Bina label wala ID (`RefNo12345`) abhi miss hota hai — bank-specific parsers me handle karna hoga.

### Block 9 — Merchant Extract (Lines 64-65, 125-162)

```ts
if (paymentMethod === 'ATM') return 'ATM';

const upiMatch = text.match(
  /\bto\s+([A-Za-z0-9._-]+)@(?:upi|ybl|ibl|axl|paytm|okaxis|okhdfcbank|okicici|oksbi|oksbm|okpnb)\b/i,
);   // "to SWIGGY@upi" → SWIGGY

if (type === 'debit') {
  const creditedCounterparty = text.match(
    /;\s*([A-Za-z][A-Za-z0-9 &._-]*?)\s+credited\b/i,
  );   // "debited for Rs 30.00 on 05-Aug-26; Maha Mumbai Met credited." → Maha Mumbai Met
  if (creditedCounterparty && isValidMerchant(creditedCounterparty[1])) {
    return creditedCounterparty[1].trim();
  }
}

const merchantMatch = text.match(
  /\b(?:to|at|for)\s+(?!Rs\.?\b|INR\b|₹|US\$)([A-Za-z][A-Za-z0-9 &._-]*?)(?=\s+(?:on|via|using|ref(?:erence)?(?: no)?|txn(?: id)?|upi|from|Avl|Bal(?:ance)?|at|for|to|is|date|time)\b|\s+[\d,]+|[,.]|$)/i,
);   // "to SWIGGY on 03-08" → SWIGGY (stop pehle "on" pe); "for Rs 30" → match nahi

if (merchantMatch && isValidMerchant(merchantMatch[1])) {
  return merchantMatch[1].trim();   // blacklist check — "your account" reject
}

if (type === 'credit' && /\bsalary\b/i.test(text)) return 'SALARY';
```
- Kya karta: UPI VPA (`X@upi`) pehle; real ICICI debit me **`; <merchant> credited`** (counterparty); phir `to X` / `at X` / `for X` pattern; credits me `salary` → `SALARY`.
- **✅ Kyon:** Merchant = expense ka category/naam nikalne ka main source; ICICI format me merchant semicolon ke baad hota hai ("... debited; Maha Mumbai Met credited").
- **⚠️ Mistake (Real Bug Fixed):** "debited **for Rs** 30.00" me `for Rs` ko merchant samajh ke `"Rs"` junk merchant banta tha — ab currency markers (`Rs/INR/₹/$`) negative lookahead se excluded.
- **⚠️ Mistake (Real Bug Fixed):** ICICI me merchant `to`/`at`/`for` se nahi, `; NAME credited` se milta hai — pehle merchant `undefined` rehta tha. (Note: ICICI SMS me merchant name ~20 chars me truncated hota hai — "Zepto Marketpla", "ZEPTOMARKETPLAC" — SMS body ka hi format hai, parser bug nahi.)
- **🔧 Change:** `isValidMerchant()` blacklist (`account`, `your`, `self`, `upi`...) junk merchants filter karta hai — apne words wahan add kar sakte ho.

---

## 📁 3. `src/features/sms/smsParser.ts` — Smart Layer (Bank + Date/Time)

**Kaam:** Generic parser ka result lekar usme **bankName**, **date**, **time** add karta hai.

```ts
export const parseTransactionSms = parseGenericTransactionSms;
export {parseGenericTransactionSms} from './parsers/genericParser';
```
- Kya karta: Old-style string parser ka **alias** + re-export.
- **✅ Kyon:** Purana code (jo raw string pass karta tha) tut jaye isliye compatibility rakhi hai.
- **⚠️ Mistake:** `parseTransactionSms` me **bankName/date/time NAHI** aata, `parseSmsMessage` me aata hai — 2 alag entry points, result alag. Confusing.
- **🔧 Change:** Ek entry point rakho (sirf `parseSmsMessage`) aur alias hatao.

```ts
const BANK_SENDERS: Array<[RegExp, string]> = [
  [/HDFCBK|VM-HDFCBK/i, 'HDFC Bank'],
  [/ICICIT|ICICIO|ICICIB|ICICIPB|VM-ICICI/i, 'ICICI Bank'],
  [/SBIINB|SBIUPI|SBIIN/i, 'State Bank of India'],
  ...
  [/AUSFB|VM-AUSFB|AUSBK/i, 'AU Small Finance Bank'],   // 30+ banks
];
```
- Kya karta: Sender number (address) ka pattern → bank ka naam.
- **✅ Kyon:** Bank SMS sender IDs fixed hote hain (HDFCBK, SBIINB...), isliye mapping banayi.
- **⚠️ Mistake:** Pattern overlap ho sakta hai (jaise `^UBI` kisi aur sender se bhi match); naya bank add karna bhoolna easy hai.
- **⚠️ Mistake (Real Bug Fixed):** Real ICICI transaction SMS ka sender **`AD-ICICIT-S` / `AX-ICICIT-S`** hota hai (pehle sirf `ICICIPB|ICICIBK|VM-ICICI` the, jo match nahi karte the) → bankName missing tha. Ab `ICICIT|ICICIO|ICICIB` add kiya. OTP senders (`AD-ICICIO-S`) bhi match honge par OTP SMS parse hote nahi (transaction keywords nahi hote).
- **🔧 Change:** List me `[/pattern/i, 'Bank Name']` line add karke naya bank support karo — ab private, PSU, small finance aur payments banks (30+) sab included hain.

```ts
const detectBankName = (sender: string): string | undefined => {
  const match = BANK_SENDERS.find(([pattern]) => pattern.test(sender));
  return match ? match[1] : undefined;
};
```
- **✅ Kyon:** Pehla matching bank return karta hai (find order pe chalta hai).
- **⚠️ Mistake:** Agar sender undefined/empty hai to `pattern.test('')` bhi call hota hai — pehle guard chahiye.
- **🔧 Change:** `if (!sender) return undefined;` add karo.

```ts
const formatDate = (ts: number) => new Date(ts).toISOString().slice(0, 10);   // 2026-08-03
const formatTime = (ts: number) => new Date(ts).toTimeString().slice(0, 5);   // 14:30
```
- Kya karta: Timestamp → date string (`YYYY-MM-DD`) aur time string (`HH:MM`).
- **✅ Kyon:** Consistent format DB/UI ke liye; UTC me date banati hai `toISOString`.
- **⚠️ Mistake:** `toISOString()` **UTC** me hai — India (IST, +5:30) me local date galat dikh sakti hai.
- **🔧 Change:** Local date chahiye to `new Date(ts).toLocaleDateString('en-CA')` ya offset handle karo.

```ts
export const parseSmsMessage = (message: SmsMessage): ParsedTransaction | null => {
  const senderBank = detectBankName(message.address);

  // Bank gating: sirf bank SMS parse karo, non-bank (recharge/ad/OTP) skip.
  const hasAccountReference =
    /\bA\/c\b|\b(?:Account|Acct)\s+(?:No\.?|Number|Num|[0-9*Xx]{2,})\b/i.test(message.body);

  if (!senderBank && !hasAccountReference) return null;

  const parsed = parseGenericTransactionSms(message.body);
  if (!parsed) return null;
  return {
    ...parsed,
    bankName: senderBank,
    date: formatDate(message.date),
    time: formatTime(message.date),
  };
};
```
- Kya karta: **Main entry**: raw `SmsMessage` object leta hai, enriched `ParsedTransaction` return karta hai.
- **✅ Kyon:** Metadata (sender, timestamp) sirf yahan available hai — string parser ko nahi.
- **⚠️ Mistake (Real Bug Fixed):** Pehle koi bhi SMS jisme "Rs." + keyword hota tha parse ho jata tha — Jio SIM recharge SMS galat transaction ban gaya. Ab sender known bank ho ya message me "A/c"/"Account No"/"**Acct**" ho tabhi parse.
- **⚠️ Mistake (Real Bug Fixed):** Real ICICI SMS **`Acct XX551`** likhta hai (`Account` nahi) — gating me `Acct` add kiya, warna ICICI debit SMS (unknown sender pe) skip ho jata tha.
- **⚠️ Mistake:** `^JIO` pattern telecom Jio ko bhi payments bank maan leta tha — tighten kiya (`JIOBANK|VM-JIOBANK`).
- **🔧 Change:** Bank wali SMS bina "A/c" ke (card alerts) sender pattern pe depend karti hain — naya bank add karte waqt sender list update karna zaroori.

---

## 📁 4. `src/features/sms/smsReader.ts` — JS → Native Bridge

**Kaam:** Native `SmsModule` ko call karta hai aur results parse karta hai.

```ts
interface SmsNativeModule {
  getAllSms(): Promise<SmsMessage[]>;
  getUnreadSms(): Promise<SmsMessage[]>;
  getSmsByAddress(address: string): Promise<SmsMessage[]>;
}

const SmsModule = NativeModules.SmsModule as SmsNativeModule | undefined;
```
- Kya karta: Native module ka **type** declare karta hai; `NativeModules.SmsModule` se pakadta hai.
- **✅ Kyon:** TypeScript ko native ka shape pata ho — galat call pe compile-time error.
- **⚠️ Mistake:** Agar Kotlin me method add karo aur yahan interface me nahi, to TS check nahi hoga; agar name mismatch ho to `SmsModule` = `undefined`.
- **🔧 Change:** Interface ko Kotlin ke saath hamesha sync rakho.

```ts
const requireSmsModule = (): SmsNativeModule => {
  if (!SmsModule) {
    throw new Error('SmsModule not found. Rebuild the app: `npm run android`');
  }
  return SmsModule;
};
```
- **✅ Kyon:** Module missing ho to clear, actionable error — silent fail nahi.
- **⚠️ Mistake (Removed):** `isSupported()` dead function tha (kahin call nahi hota) — delete kar diya; functions seedha `Platform.OS` check + `requireSmsModule()` use karte hain.
- **🔧 Change:** Error message me device name/arch bhi add kar sakte ho (debugging).

```ts
export const getAllSms = async (): Promise<SmsMessage[]> => {
  if (Platform.OS !== 'android') return [];   // iOS safe
  return requireSmsModule().getAllSms();
};
```
- **✅ Kyon:** iOS me module nahi hai — crash na ho isliye empty return.
- **⚠️ Mistake:** Agar Android pe permission nahi hai to native `SecurityException` throw karega (JS me reject).
- **🔧 Change:** `getSmsByAddress` me sender pass karke sirf bank senders ki SMS lo — bridge load kam.

```ts
export const readTransactionsFromSms = async ({limit = 200} = {}): Promise<ParsedTransaction[]> => {
  if (!(await ensureSmsPermission())) {
    throw new Error('READ_SMS permission not granted');
  }
  const messages = await getAllSms();
  ...
  for (const message of messages) {
    const parsed = parseSmsMessage(message);
    if (parsed) transactions.push(parsed);
  }
  return transactions.slice(0, limit);
};
```
- Kya karta: **Main orchestrator** — permission → SMS → parse → limit → return.
- **✅ Kyon:** Saara flow ek jagah; caller ko sirf ek function chahiye.
- **⚠️ Mistake:** Poori inbox (hazaroon SMS) bridge pe aati hai → slow; limit sirf end me lagta hai (pehle sab parse hote hain).
- **🔧 Change:** Native me hi filter (sender/keywords) karke chhota data lo — limit native query me lagao.

---

## 📁 5. `src/features/sms/smsPermission.ts` — Permission Handling

```ts
const PERMISSION = PermissionsAndroid.PERMISSIONS.READ_SMS;
```
- **✅ Kyon:** Ek jagah constant — baar-baar na likhna.
- **🔧 Change:** Naya permission add karna ho to yahan list bana sakte ho.

```ts
export const hasSmsPermission = async (): Promise<boolean> => {
  try { return await PermissionsAndroid.check(PERMISSION); }
  catch { return false; }
};
```
- **✅ Kyon:** try/catch — kisi bhi exception pe `false` (safe default).
- **⚠️ Mistake:** Android 11+ (15/16) pe non-default SMS app ke liye **permission hamesha denied** rehti hai — check `false` aayega chahe kuch bhi karo.
- **🔧 Change:** Android 15/16 pe `Platform.Version` check karke alag message dikhao.

```ts
export const requestSmsPermission = async (): Promise<boolean> => {
  const result = await PermissionsAndroid.request(PERMISSION, {...});
  return result === PermissionsAndroid.RESULTS.GRANTED;
};
```
- Kya karta: System dialog dikhata hai.
- **⚠️ Mistake:** Android 15/16 pe dialog **aata hi nahi** (system auto-deny) — user "Allow" daba hi nahi sakta. **Best fix: app ko default SMS app banao** (Settings → Default apps → SMS → Axpense, ya `adb shell cmd role add-role-holder --user 0 android.app.role.SMS com.exptracker`).
- **🔧 Change:** Default SMS app hone ka check `RoleManager` se karke UI me hint dikhao.

```ts
export const ensureSmsPermission = async (): Promise<boolean> => {
  if (await hasSmsPermission()) return true;
  return requestSmsPermission();
};
```
- **✅ Kyon:** "Check pehle, warna request" — reusable helper.
- **🔧 Change:** Yahan `NEVER_ASK_AGAIN` wala result handle karke Settings kholein (Linking.openSettings).

---

## 📁 6. Native — `SmsModule.kt` (Kotlin)

**Kaam:** Android `ContentResolver` se SMS inbox query karke JS ko deta hai.

```kotlin
@ReactModule(name = SmsModule.NAME)
class SmsModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
```
- **✅ Kyon:** `@ReactModule(name)` se JS me `NativeModules.SmsModule` available hota hai — **naam match zaroori**.
- **⚠️ Mistake:** Name badla + JS me nahi badla = module `undefined`.
- **🔧 Change:** NAME constant rakho (pehle se hai — good practice).

```kotlin
companion object {
  const val NAME = "SmsModule"
  private const val COLUMN_ID = Telephony.Sms._ID
  ...
  private val PROJECTION = arrayOf(COLUMN_ID, COLUMN_THREAD_ID, COLUMN_ADDRESS, COLUMN_DATE, COLUMN_READ, COLUMN_BODY, COLUMN_TYPE)
  private const val SORT_DESC = "${COLUMN_DATE} DESC"
}
```
- **✅ Kyon:** Columns/order ek jagah — query clean; latest SMS pehle (`DATE DESC`).
- **⚠️ Mistake:** `Telephony.Sms` (saare boxes) vs `Telephony.Sms.Inbox` (sirf inbox) — ye module **Inbox.CONTENT_URI** use karta hai (line 47).
- **🔧 Change:** Aur columns chahiye (`PERSON`, `SERVICE_CENTER`) to yahan add karo.

```kotlin
@ReactMethod
fun getAllSms(promise: Promise) {
  query(Telephony.Sms.Inbox.CONTENT_URI, null, null, promise)
}
@ReactMethod
fun getUnreadSms(promise: Promise) {
  query(Telephony.Sms.Inbox.CONTENT_URI, "$COLUMN_READ = 0", null, promise)
}
@ReactMethod
fun getSmsByAddress(address: String, promise: Promise) {
  query(Telephony.Sms.Inbox.CONTENT_URI, "$COLUMN_ADDRESS = ?", arrayOf(address), promise)
}
```
- **✅ Kyon:** Har public method pe `@ReactMethod` zaroori hai; `Promise` se result/error wapas.
- **⚠️ Mistake:** Yahan **permission check nahi hai** — agar READ_SMS granted nahi to `SecurityException` throw hoga (JS me "SMS_READ_ERROR").
- **🔧 Change:** Method me `context.checkSelfPermission(READ_SMS)` daal kar `promise.reject("SMS_PERMISSION_DENIED", ...)` bhejo — clear error.

```kotlin
private fun query(uri, selection, selectionArgs, promise) {
  try {
    val resolver = reactApplicationContext.contentResolver
    val cursor = resolver.query(uri, PROJECTION, selection, selectionArgs, SORT_DESC)
    cursor ?: run { promise.reject("SMS_READ_ERROR", "Unable to query SMS inbox"); return }
    cursor.use { c ->
      val result = Arguments.createArray()
      while (c.moveToNext()) result.pushMap(cursorToMap(c))
      promise.resolve(result)
    }
  } catch (e: Exception) {
    promise.reject("SMS_READ_ERROR", e.message, e)
  }
}
```
- **✅ Kyon:** `try/catch` + `cursor.use` (auto-close) — memory leak se bachata hai; `?:` null check.
- **⚠️ Mistake:** `cursor.use` ke andar `promise.resolve` — agar bahut badi result ho to bridge pe slow.
- **🔧 Change:** Native me `limit` param add karke results cap karo.

```kotlin
private fun cursorToMap(cursor: Cursor): WritableMap {
  val map = Arguments.createMap()
  map.putString("id", cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_ID)))
  ...
  map.putString("body", getStringOrNull(cursor, COLUMN_BODY))
  return map
}
```
- **✅ Kyon:** Har row ko JS-friendly `WritableMap` me; `getStringOrNull` null-safe (body/address null ho sakte hain).
- **⚠️ Mistake:** `getColumnIndexOrThrow` column missing ho to exception — tabhi try/catch me hai, par ek row ka failure poora query fail kar dega.
- **🔧 Change:** Har field `getStringOrNull` jaisa safe getter use karo.

---

## 📁 7. Native — `SmsPackage.kt`

```kotlin
class SmsPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext):
      List<NativeModule> = listOf(SmsModule(reactContext))
  override fun createViewManagers(...) = emptyList()
}
```
- **✅ Kyon:** Module ko RN se register karwata hai (MainApplication me add hota hai).
- **⚠️ Mistake:** Sirf native views banane wale packages `createViewManagers` me entries dete hain — hamare liye empty sahi.
- **🔧 Change:** Naya module add karna ho to list me `, SmsModule(reactContext)` aur `, OtherModule(...)`.

---

## 📁 8. Native — `SmsReceiver.kt` (Naya SMS receive karta hai)

```kotlin
class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action
    if (action != "android.provider.Telephony.SMS_DELIVER") return
    val pdusObj = intent.extras?.get("pdus") as? Array<*>
    ...
    val messages = pdusObj.mapNotNull { ... SmsMessage.createFromPdu(...) }
    val fullMessage = messages.joinToString("") { it.messageBody ?: "" }
    val originating = messages.firstOrNull()?.originatingAddress ?: ""
    Log.d("SmsReceiver", "Received SMS from $originating: $fullMessage")
  }
}
```
- Kya karta: Naye SMS ka raw data (PDU) decode karke **log** karta hai.
- **✅ Kyon:** Ye app ko default SMS app banane par **live SMS capture** ke liye hai (history ke liye READ_SMS, naye ke liye ye).
- **⚠️ Mistake (2):** (1) Action string literal hai — `Telephony.Sms.Intents.SMS_DELIVER_ACTION` use karo. (2) Sirf **log** karta hai — JS ko kuch nahi bhejta, isliye abhi UI me naya SMS live nahi aata. (3) **`SMS_DELIVER` tabhi milta hai jab app default SMS app ho.**
- **🔧 Change:** `SMS_RECEIVED` bhi handle karo + `ReactApplicationContext` se JS event (`DeviceEventEmitter`) bhejo, taaki app khuli ho to naya transaction turant dikhe.

---

## 📁 9. `AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />

<receiver
  android:name=".sms.SmsReceiver"
  android:permission="android.permission.BROADCAST_SMS"
  android:exported="true">
  <intent-filter>
    <action android:name="android.provider.Telephony.SMS_DELIVER" />
  </intent-filter>
</receiver>
```
- **✅ Kyon:** `BROADCAST_SMS` permission ka matlab hai sirf system hi receiver ko SMS bhej sakta hai (secure); `SMS_DELIVER` filter se app default SMS app ke liye eligible.
- **⚠️ Mistake:** `RECEIVE_SMS` + receiver **tabhi kaam karta hai jab app default SMS app ho** (Android 11+) — warna Android receiver ko broadcast hi nahi karta.
- **🔧 Change:** Real app me `READ_SMS` publish nahi ho sakta (Play policy) — default SMS app approach hi sahi raasta hai.

---

## 📁 10. `App.tsx` (Demo UI)

```tsx
const balanceTransactions = transactions.filter(
  (txn) => txn.balance !== undefined && txn.balance !== null,
);
const currentBalance = balanceTransactions[0]?.balance;
```
- Kya karta: Jis transactions me balance hai unme se **pehla** (sabse naya, kyunki native `DATE DESC` deta hai) → current balance.
- **✅ Kyon:** Simple "current balance" dikhane ka shortcut.
- **⚠️ Mistake:** Agar pehli parsed SMS me balance hi nahi to `unknown` dikhega; sirf demo logic hai — real app me DB se balance aayega.
- **🔧 Change:** Isse dashboard/transaction list screen me replace karna (Phase 3).

---

## 📁 11. Tests — `__tests__/smsParser.test.ts` aur `testParser.ts`

```ts
// describe('parseSmsMessage', () => { ... })   // 23 tests, SAB ENABLED
```
- Kya karta: Parser ke sample cases (HDFC UPI, SBI salary, ICICI card, UPI VPA, ATM, payout credit, ICICI "merchant credited" debit, ICICI sender, gating/reference/CR-suffix, OTP-reject, empty-reject) — ab **enabled** hain, `npm test` = 23/23 pass.
- **✅ Kyon:** Naya regex add karne par regression na aaye iske liye tests gold mine hain.
- **⚠️ Mistake:** Abhi **18 → 23 tests** me real-device bugs ke regression cases add hain — koi parser change karne ke baad `npm test` chalao.
- **🔧 Change:** Naya format milne pe test add karo; `testParser.ts` me apne **real bank SMS** paste karke console me dekh sakte ho.

---

## 🔧 Quick Checklist — Kya Badal Sakte Ho (Ek Line Me)

| Kya badalna hai | Kahan | Kaise |
|---|---|---|
| Naya bank add karna | `smsParser.ts` `BANK_SENDERS` | Ek `[/pattern/i, 'Name']` line add karo (broad `^XYZ` patterns se bacho) |
| Naya payment method | `genericParser.ts` `detectPaymentMethod` + `types.ts` | Regex + union type dono update karo |
| Credit/debit precedence | `genericParser.ts` Block 4 | `debited` pehle check karo; "transferred to your A/c" = credit (payout), "transferred from" = debit |
| ICICI "merchant credited" debit | `genericParser.ts` Block 9 | `; <NAME> credited` counterparty regex — merchant + debit dono sahi |
| Local time (IST) fix | `smsParser.ts` `formatDate` | `toISOString` ki jagah local date use karo |
| Android 15/16 permission | App | `READ_SMS` sirf default SMS app ko auto-milta hai; manual Settings toggle greyed — abhi read history bina default app ke kaam karta hai agar permission pehle grant ho (adb: `pm grant`) |
| Live naya SMS | `SmsReceiver.kt` | JS event emit karo (DeviceEventEmitter) |
| Native query limit | `SmsModule.kt` | `query()` me `limit` param + SQL `LIMIT` |
| Dead code | `types.ts` `SmsQueryOptions`, `ParsedTransaction.sender` | Delete ya use karo |
| Tests chalana | `smsParser.test.ts` | `npm test` run karo (23 tests, enabled) |

---

## 🎯 Key Takeaways

1. **Flow:** `SmsMessage` (native) → `genericParser` (raw text) → `smsParser` (bank/date enrich) → `ParsedTransaction`.
2. **Parser = Regex game** — har regex realistic SMS ke saath test karo.
3. **Android 15/16 me SMS** sirf default SMS app ko milta hai — receiver ready hai, bas default set karo.
4. **`@ReactModule` name = `NativeModules` name** — match karna zaroori hai.
5. **Koi bhi native change** → `npm run android` rebuild zaroori (sirf JS reload kaafi nahi).

---

*Documentation date: Aug 2026 | SMS feature — Phase 2*
