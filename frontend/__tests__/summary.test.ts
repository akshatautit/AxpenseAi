import {computeDashboard} from '../src/features/finance/summary';
import {ParsedTransaction} from '../src/features/sms/types';

const makeTxn = (
  overrides: Partial<ParsedTransaction> & Pick<ParsedTransaction, 'amount' | 'type'>,
): ParsedTransaction => ({
  sender: 'HDFCBK',
  paymentMethod: 'UPI',
  rawMessage: '',
  ...overrides,
});

describe('computeDashboard', () => {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const pym = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  test('aggregates income, expense, savings for current month only', () => {
    const dash = computeDashboard([
      makeTxn({amount: 10000, type: 'credit', date: `${ym}-05`, balance: 50000}),
      makeTxn({amount: 2500, type: 'debit', date: `${ym}-06`, merchant: 'Swiggy'}),
      makeTxn({amount: 3000, type: 'debit', date: `${ym}-07`, merchant: 'Swiggy'}),
      makeTxn({amount: 9000, type: 'debit', date: `${pym}-10`}),
    ]);

    expect(dash.thisMonth.income).toBe(10000);
    expect(dash.thisMonth.expense).toBe(5500);
    expect(dash.thisMonth.savings).toBe(4500);
    expect(dash.lastMonth.expense).toBe(9000);
    expect(dash.balance).toBe(50000);
  });

  test('trend compares current vs last month expense', () => {
    const dash = computeDashboard([
      makeTxn({amount: 2000, type: 'debit', date: `${ym}-02`}),
      makeTxn({amount: 1000, type: 'debit', date: `${pym}-02`}),
    ]);

    expect(dash.trendPct).toBe(100);
  });

  test('categories are scoped to current month and use regex rules', () => {
    const dash = computeDashboard([
      makeTxn({amount: 1000, type: 'debit', date: `${ym}-02`, merchant: 'Swiggy'}),
      makeTxn({amount: 2000, type: 'debit', date: `${pym}-02`, merchant: 'Zomato'}),
      makeTxn({amount: 500, type: 'debit', date: `${ym}-03`, merchant: 'Uber'}),
    ]);

    const food = dash.categories.find(c => c.label === 'Food');
    const transport = dash.categories.find(c => c.label === 'Transport');

    expect(food?.amount).toBe(1000);
    expect(transport?.amount).toBe(500);
    expect(dash.categories.reduce((s, c) => s + c.amount, 0)).toBe(1500);
  });

  test('no data yields zero totals and no categories', () => {
    const dash = computeDashboard([]);

    expect(dash.thisMonth.income).toBe(0);
    expect(dash.thisMonth.expense).toBe(0);
    expect(dash.categories).toEqual([]);
    expect(dash.lastTransaction).toBeUndefined();
  });
});
