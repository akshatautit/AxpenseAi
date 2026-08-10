import {ParsedTransaction} from '../sms/types';
import {readTransactionsFromSms} from '../sms/smsReader';

export interface MonthTotals {
  income: number;
  expense: number;
  savings: number;
  count: number;
}

export interface CategorySpend {
  label: string;
  amount: number;
  pct: number;
}

export interface DashboardData {
  balance?: number;
  thisMonth: MonthTotals;
  lastMonth: {income: number; expense: number};
  trendPct: number | null;
  lastTransaction?: ParsedTransaction;
  categories: CategorySpend[];
}

const CATEGORY_RULES: Array<[string, RegExp]> = [
  [
    'Food',
    /swiggy|zomato|foodpanda|dominos|pizza hut|kfc|mcdonald|starbucks|restaurant|cafe|bigbasket|grofers|blinkit|zepto|dmart|safal|dairy|kirana/i,
  ],
  [
    'Shopping',
    /amazon|flipkart|myntra|ajio|meesho|snapdeal|shopclues|shopping|mall|supermarket|bazaar/i,
  ],
  [
    'Transport',
    /uber|ola|rapido|irctc|redbus|petrol|fuel|indian oil|hpcl|bharat petroleum|metro|indigo|air india|vistara|railway|taxi/i,
  ],
  [
    'Entertainment',
    /netflix|amazon prime|hotstar|jio cinema|spotify|gaana|bookmyshow|pvr|cinepolis|game|playstation|steam/i,
  ],
  [
    'Bills & Utilities',
    /electricity|bseb|tneb|bill|jio|airtel|vodafone|idea|recharge|insurance|lic|gas|lpg|internet|broadband|postpaid|dth|wifi/i,
  ],
];

const monthKey = (dateStr?: string): string =>
  dateStr ? dateStr.slice(0, 7) : '';

const currentMonthKey = (): string => new Date().toISOString().slice(0, 7);

const previousMonthKey = (key: string): string => {
  const [year, month] = key.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const categorize = (txn: ParsedTransaction): string => {
  const hay = `${txn.merchant ?? ''} ${txn.sender ?? ''} ${
    txn.rawMessage ?? ''
  }`.toLowerCase();
  for (const [label, re] of CATEGORY_RULES) {
    if (re.test(hay)) {
      return label;
    }
  }
  return 'Other';
};

export const computeDashboard = (
  txns: ParsedTransaction[],
): DashboardData => {
  const current = currentMonthKey();
  const last = previousMonthKey(current);

  const thisMonth: MonthTotals = {income: 0, expense: 0, savings: 0, count: 0};
  const lastMonth = {income: 0, expense: 0};
  let balance: number | undefined;
  let lastTransaction: ParsedTransaction | undefined;
  const categoryTotals = new Map<string, number>();

  for (const txn of txns) {
    if (balance === undefined && txn.balance !== undefined && txn.balance !== null) {
      balance = txn.balance;
    }

    const mk = monthKey(txn.date);
    if (mk === current) {
      if (txn.type === 'credit') {
        thisMonth.income += txn.amount;
      } else {
        thisMonth.expense += txn.amount;
        const label = categorize(txn);
        categoryTotals.set(label, (categoryTotals.get(label) ?? 0) + txn.amount);
      }
      thisMonth.count += 1;
    } else if (mk === last) {
      if (txn.type === 'credit') {
        lastMonth.income += txn.amount;
      } else {
        lastMonth.expense += txn.amount;
      }
    }

    if (!lastTransaction) {
      lastTransaction = txn;
    }
  }

  thisMonth.savings = thisMonth.income - thisMonth.expense;

  const trendPct =
    lastMonth.expense > 0
      ? ((thisMonth.expense - lastMonth.expense) / lastMonth.expense) * 100
      : null;

  const totalExpense = [...categoryTotals.values()].reduce(
    (sum, v) => sum + v,
    0,
  );
  const categories: CategorySpend[] = [...categoryTotals.entries()]
    .map(([label, amount]) => ({
      label,
      amount,
      pct: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    balance,
    thisMonth,
    lastMonth,
    trendPct,
    lastTransaction,
    categories,
  };
};

export const loadDashboard = async (): Promise<DashboardData> => {
  const txns = await readTransactionsFromSms({limit: 200});
  return computeDashboard(txns);
};
