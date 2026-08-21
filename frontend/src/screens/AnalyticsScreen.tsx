import React, {useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Svg, {Circle, Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {Icon, IconName} from '../components/Icon';
import {AnalyticsChart} from '../components/AnalyticsChart';
import {SectionCard} from '../components/SectionCard';
import {colors, radius, spacing} from '../theme';
import {RootNavigation} from '../navigation';

type TrendPeriod = 'Weekly' | 'Monthly' | 'Yearly';

const TREND_PERIODS: TrendPeriod[] = ['Weekly', 'Monthly', 'Yearly'];

const CATEGORIES: {icon: IconName; color: string; name: string; amount: string; pct: number}[] = [
  {icon: 'shoppingBag', color: colors.accent, name: 'Shopping', amount: '₹5,240', pct: 24},
  {icon: 'utensils', color: colors.chartOrange, name: 'Food & Dining', amount: '₹4,800', pct: 22},
  {icon: 'car', color: colors.chartCyan, name: 'Transport', amount: '₹3,620', pct: 17},
  {icon: 'creditCard', color: colors.info, name: 'Utilities', amount: '₹2,870', pct: 13},
  {icon: 'film', color: colors.chartPurple, name: 'Entertainment', amount: '₹2,450', pct: 11},
  {icon: 'star', color: colors.expense, name: 'Health', amount: '₹2,400', pct: 11},
];

const DONUT = [
  {frac: 0.245, color: colors.accent},
  {frac: 0.225, color: colors.chartOrange},
  {frac: 0.169, color: colors.chartCyan},
  {frac: 0.134, color: colors.info},
  {frac: 0.115, color: colors.chartPurple},
  {frac: 0.112, color: colors.expense},
];

const DONUT_SIZE = 168;
const DONUT_STROKE = 22;
const DONUT_GAP = 2;

export const AnalyticsScreen = () => {
  const navigation = useNavigation<RootNavigation>();
  const [period, setPeriod] = useState<TrendPeriod>('Monthly');

  const donutRadius = (DONUT_SIZE - DONUT_STROKE) / 2;
  const donutCirc = 2 * Math.PI * donutRadius;

  let accumulated = 0;
  const segments = DONUT.map(seg => {
    const length = Math.max(seg.frac * donutCirc - DONUT_GAP, 0);
    const offset = accumulated;
    accumulated += seg.frac * donutCirc;
    return {...seg, length, offset};
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>
            Spending insights, powered by AI
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={({pressed}) => [styles.iconBtn, pressed && styles.pressed]}>
            <Icon name="chevronLeft" color={colors.textSecondary} size={20} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter analytics"
            onPress={() => {}}
            style={({pressed}) => [styles.iconBtn, pressed && styles.pressed]}>
            <Icon name="filter" color={colors.textSecondary} size={19} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <SectionCard title="Total Spend" subtitle="6 categories · 248 transactions">
          <View style={styles.donutWrap}>
            <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
              <Circle
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={donutRadius}
                stroke={colors.secondaryCard}
                strokeWidth={DONUT_STROKE}
                fill="none"
              />
              {segments.map((seg, index) => (
                <Circle
                  key={index}
                  cx={DONUT_SIZE / 2}
                  cy={DONUT_SIZE / 2}
                  r={donutRadius}
                  stroke={seg.color}
                  strokeWidth={DONUT_STROKE}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${seg.length} ${donutCirc - seg.length}`}
                  strokeDashoffset={-seg.offset}
                  transform={`rotate(-90 ${DONUT_SIZE / 2} ${DONUT_SIZE / 2})`}
                />
              ))}
            </Svg>
            <View style={styles.donutCenter}>
              <Text style={styles.donutAmount}>₹21,380</Text>
              <Text style={styles.donutLabel}>this month</Text>
            </View>
          </View>

          <View style={styles.legendGrid}>
            {CATEGORIES.map(cat => (
              <View key={cat.name} style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: cat.color}]} />
                <Text style={styles.legendName} numberOfLines={1}>
                  {cat.name}
                </Text>
                <Text style={styles.legendPct}>{cat.pct}%</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Category Breakdown">
          {CATEGORIES.map((cat, index) => (
            <View
              key={cat.name}
              style={[
                styles.categoryRow,
                index < CATEGORIES.length - 1 && styles.categoryBorder,
              ]}>
              <View style={[styles.categoryIcon, {backgroundColor: `${cat.color}1A`}]}>
                <Icon name={cat.icon} color={cat.color} size={17} />
              </View>
              <View style={styles.categoryInfo}>
                <View style={styles.categoryTop}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryAmount}>{cat.amount}</Text>
                </View>
                <View style={styles.categoryBar}>
                  <View
                    style={[
                      styles.categoryFill,
                      {width: `${cat.pct}%`, backgroundColor: cat.color},
                    ]}
                  />
                </View>
                <Text style={styles.categoryPct}>{cat.pct}% of total spend</Text>
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard
          title="Spending Trend"
          subtitle={period === 'Weekly' ? 'Last 7 days' : period === 'Monthly' ? 'Last 12 months' : 'Last 5 years'}>
          <View style={styles.chipRow}>
            {TREND_PERIODS.map(option => {
              const active = period === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{selected: active}}
                  onPress={() => setPeriod(option)}
                  style={({pressed}) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <AnalyticsChart />
          <View style={styles.trendStats}>
            <View style={styles.trendStat}>
              <Text style={styles.trendLabel}>Daily avg</Text>
              <Text style={styles.trendValue}>₹712</Text>
            </View>
            <View style={styles.trendDivider} />
            <View style={styles.trendStat}>
              <Text style={styles.trendLabel}>Highest</Text>
              <Text style={styles.trendValue}>₹8,900</Text>
            </View>
            <View style={styles.trendDivider} />
            <View style={styles.trendStat}>
              <Text style={styles.trendLabel}>Lowest</Text>
              <Text style={styles.trendValue}>₹245</Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Cash Flow" subtitle="Income vs Expenses">
          <View style={styles.flowRow}>
            <View style={styles.flowBlock}>
              <View style={styles.flowTop}>
                <Icon name="trendingDown" color={colors.expense} size={15} />
                <Text style={styles.flowLabel}>Expenses</Text>
              </View>
              <Text style={styles.flowAmount}>₹21,380</Text>
              <View style={styles.flowBarTrack}>
                <View
                  style={[styles.flowBarExpense, {width: '71%'}]}
                />
              </View>
              <Text style={styles.flowMeta}>↑ 4.2% vs last month</Text>
            </View>
            <View style={styles.flowDivider} />
            <View style={styles.flowBlock}>
              <View style={styles.flowTop}>
                <Icon name="trendingUp" color={colors.income} size={15} />
                <Text style={styles.flowLabel}>Income</Text>
              </View>
              <Text style={styles.flowAmount}>₹30,000</Text>
              <View style={styles.flowBarTrack}>
                <View style={[styles.flowBarIncome, {width: '52%'}]} />
              </View>
              <Text style={styles.flowMeta}>→ Stable</Text>
            </View>
          </View>
          <View style={styles.netSavings}>
            <View style={styles.netSavingsIcon}>
              <Icon name="dollar" color={colors.income} size={16} />
            </View>
            <View style={styles.netSavingsInfo}>
              <Text style={styles.netSavingsLabel}>Net savings</Text>
              <Text style={styles.netSavingsValue}>+₹8,620 this month</Text>
            </View>
            <View style={styles.savingsPill}>
              <Text style={styles.savingsPillText}>29% saved</Text>
            </View>
          </View>
        </SectionCard>

        <View style={styles.aiCard}>
          <Svg style={styles.aiBg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="aiGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={colors.chartPurple} />
                <Stop offset="1" stopColor={colors.primary} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#aiGrad)" />
            <Circle cx="92" cy="8" r="22" fill="#FFFFFF" opacity="0.12" />
            <Circle cx="4" cy="96" r="28" fill="#FFFFFF" opacity="0.06" />
          </Svg>
          <View style={styles.aiHeader}>
            <View style={styles.aiChip}>
              <Icon name="cpu" color={colors.textPrimary} size={13} />
              <Text style={styles.aiChipText}>AI INSIGHTS</Text>
            </View>
            <Text style={styles.aiTitle}>What Axpense sees</Text>
          </View>
          <View style={styles.aiInsight}>
            <View style={styles.aiInsightIcon}>
              <Icon name="trendingUp" color={colors.textPrimary} size={14} />
            </View>
            <Text style={styles.aiInsightText}>
              Your shopping spend is 24% higher than your 3-month average.
            </Text>
          </View>
          <View style={styles.aiInsight}>
            <View style={styles.aiInsightIcon}>
              <Icon name="zap" color={colors.textPrimary} size={14} />
            </View>
            <Text style={styles.aiInsightText}>
              Set a ₹5,000 budget on Food & Dining to save ₹1,200 this month.
            </Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={styles.summaryValue}>₹30,000</Text>
            <Text style={styles.summaryHint}>+2.0% vs last month</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.summaryValue}>₹21,380</Text>
            <Text style={styles.summaryHint}>+4.2% vs last month</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Savings</Text>
            <Text style={styles.summaryValue}>₹8,620</Text>
            <Text style={styles.summaryHint}>29% of income</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net Cashflow</Text>
            <Text style={styles.summaryValue}>+₹8,620</Text>
            <Text style={styles.summaryHint}>Positive</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all transactions"
          onPress={() => navigation.navigate('Transactions')}
          style={({pressed}) => [
            styles.allTxCard,
            pressed && styles.pressed,
          ]}>
          <Icon name="creditCard" color={colors.accent} size={20} />
          <View style={styles.allTxInfo}>
            <Text style={styles.allTxTitle}>View All Transactions</Text>
            <Text style={styles.allTxDesc}>248 transactions this month</Text>
          </View>
          <Icon name="chevronRight" color={colors.textSecondary} size={18} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textHint,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl * 2,
  },
  donutWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  donutCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  donutLabel: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textHint,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '46%',
    flexGrow: 1,
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
  legendPct: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  categoryBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categoryBar: {
    marginTop: 6,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.secondaryCard,
    overflow: 'hidden',
  },
  categoryFill: {
    height: 5,
    borderRadius: 3,
  },
  categoryPct: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textHint,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.secondaryCard,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textPrimary,
  },
  trendStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  trendStat: {
    flex: 1,
    alignItems: 'center',
  },
  trendDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: colors.border,
  },
  trendLabel: {
    fontSize: 11,
    color: colors.textHint,
  },
  trendValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flowBlock: {
    flex: 1,
  },
  flowDivider: {
    width: StyleSheet.hairlineWidth,
    height: 84,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  flowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flowLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  flowAmount: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  flowBarTrack: {
    marginTop: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondaryCard,
    overflow: 'hidden',
  },
  flowBarExpense: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.expense,
  },
  flowBarIncome: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.income,
  },
  flowMeta: {
    marginTop: 6,
    fontSize: 11,
    color: colors.textHint,
  },
  netSavings: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  netSavingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(34,197,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  netSavingsInfo: {
    flex: 1,
  },
  netSavingsLabel: {
    fontSize: 11,
    color: colors.textHint,
  },
  netSavingsValue: {
    marginTop: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.income,
  },
  savingsPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  savingsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.income,
  },
  aiCard: {
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  aiBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  aiHeader: {
    marginBottom: spacing.lg,
  },
  aiChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  aiChipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textPrimary,
  },
  aiTitle: {
    marginTop: spacing.sm,
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  aiInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  aiInsightIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  aiInsightText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#E9D5FF',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryCard: {
    width: '46%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textHint,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  summaryHint: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textSecondary,
  },
  allTxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  allTxInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  allTxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  allTxDesc: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textHint,
  },
});
