import React, {useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Icon, IconName} from '../components/Icon';
import {colors, radius, spacing} from '../theme';
import {RootNavigation} from '../navigation';

type Filter = 'All' | 'Income' | 'Expense' | 'Shopping' | 'Food' | 'Transport';

const FILTERS: Filter[] = [
  'All',
  'Income',
  'Expense',
  'Shopping',
  'Food',
  'Transport',
];

interface Txn {
  icon: IconName;
  color: string;
  title: string;
  sub: string;
  amount: string;
  credit?: boolean;
  ai?: string;
}

const GROUPS: {label: string; meta: string; items: Txn[]}[] = [
  {
    label: 'Today',
    meta: '6 transactions',
    items: [
      {icon: 'shoppingBag', color: colors.accent, title: 'Amazon', sub: 'Shopping · 2:45 PM', amount: '-₹2,349'},
      {icon: 'utensils', color: colors.chartOrange, title: 'Zomato', sub: 'Food & Dining · 1:20 PM', amount: '-₹420', ai: 'Budget healthy'},
      {icon: 'bank', color: colors.income, title: 'Salary Credit', sub: 'Income · 10:02 AM', amount: '+₹30,000', credit: true},
      {icon: 'car', color: colors.chartCyan, title: 'Uber', sub: 'Transport · 9:15 AM', amount: '-₹186'},
      {icon: 'refresh', color: colors.info, title: 'PhonePe UPI', sub: 'Transfer · 8:40 AM', amount: '-₹500'},
      {icon: 'star', color: colors.warning, title: 'Cashback', sub: 'Income · 7:55 AM', amount: '+₹142', credit: true, ai: 'Saved ₹45'},
    ],
  },
  {
    label: 'Yesterday',
    meta: '4 transactions',
    items: [
      {icon: 'film', color: colors.chartPurple, title: 'Netflix', sub: 'Entertainment · 9:30 PM', amount: '-₹649', ai: 'Monthly recurring'},
      {icon: 'wifi', color: colors.info, title: 'Jio Recharge', sub: 'Utilities · 6:10 PM', amount: '-₹349'},
      {icon: 'utensils', color: colors.chartOrange, title: 'Swiggy', sub: 'Food & Dining · 1:45 PM', amount: '-₹312'},
      {icon: 'car', color: colors.chartCyan, title: 'Petrol', sub: 'Transport · 8:05 AM', amount: '-₹700'},
    ],
  },
  {
    label: 'This Week',
    meta: '5 transactions',
    items: [
      {icon: 'shoppingBag', color: colors.accent, title: 'Myntra', sub: 'Shopping · Mon', amount: '-₹1,890'},
      {icon: 'star', color: colors.expense, title: 'Apollo Pharmacy', sub: 'Health · Mon', amount: '-₹860'},
      {icon: 'shoppingBag', color: colors.accent, title: 'BigBasket', sub: 'Groceries · Sun', amount: '-₹1,240'},
      {icon: 'car', color: colors.chartCyan, title: 'IRCTC Train', sub: 'Travel · Sat', amount: '-₹1,105', ai: 'Booked 2 days early'},
      {icon: 'zap', color: colors.warning, title: 'Electricity Bill', sub: 'Utilities · Sat', amount: '-₹1,820'},
    ],
  },
  {
    label: 'Earlier',
    meta: '4 transactions',
    items: [
      {icon: 'shoppingBag', color: colors.accent, title: 'Blinkit', sub: 'Groceries · 3 days ago', amount: '-₹298'},
      {icon: 'creditCard', color: colors.info, title: 'Credit Card Bill', sub: 'Bills · 4 days ago', amount: '-₹6,400', ai: 'On time'},
      {icon: 'zap', color: colors.chartPurple, title: 'Gym Membership', sub: 'Health · 5 days ago', amount: '-₹1,500'},
      {icon: 'globe', color: colors.income, title: 'Refund · Flipkart', sub: 'Income · 6 days ago', amount: '+₹1,299', credit: true, ai: 'Refund tracked'},
    ],
  },
];

const AI_BADGE_TEXT = 'AI';

export const TransactionsScreen = () => {
  const navigation = useNavigation<RootNavigation>();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Text style={styles.headerSubtitle}>19 transactions · this month</Text>
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
            accessibilityLabel="Filter transactions"
            onPress={() => {}}
            style={({pressed}) => [styles.iconBtn, pressed && styles.pressed]}>
            <Icon name="filter" color={colors.textSecondary} size={19} />
          </Pressable>
        </View>
      </View>

      <View style={styles.sticky}>
        <View style={styles.searchBar}>
          <Icon name="search" color={colors.textDisabled} size={17} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search transactions"
            placeholderTextColor={colors.textDisabled}
            style={styles.searchInput}
            autoCorrect={false}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voice search"
            onPress={() => {}}
            style={({pressed}) => [styles.micBtn, pressed && styles.pressed]}>
            <Icon name="mic" color={colors.accent} size={17} />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {FILTERS.map(option => {
            const active = filter === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{selected: active}}
                onPress={() => setFilter(option)}
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
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sync SMS"
          onPress={() => {}}
          style={({pressed}) => [styles.syncBanner, pressed && styles.pressed]}>
          <View style={styles.syncBannerIcon}>
            <Icon name="messageSquare" color={colors.lightBlue} size={18} />
          </View>
          <View style={styles.syncBannerInfo}>
            <Text style={styles.syncBannerTitle}>Sync Bank SMS</Text>
            <Text style={styles.syncBannerDesc}>
              Keep transactions up to date automatically
            </Text>
          </View>
          <View style={styles.syncBannerBtn}>
            <Icon name="refresh" color={colors.lightBlue} size={16} />
          </View>
        </Pressable>

        <View style={styles.insightCard}>
          <View style={styles.insightRow}>
            <View style={styles.insightIcon}>
              <Icon name="trendingUp" color={colors.income} size={15} />
            </View>
            <Text style={styles.insightText}>
              You spent <Text style={styles.insightStrong}>₹2,349</Text> at
              Amazon — 18% more than usual.
            </Text>
          </View>
        </View>

        {GROUPS.map(group => (
          <View key={group.label} style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <Text style={styles.groupMeta}>{group.meta}</Text>
            </View>
            <View style={styles.txnList}>
              {group.items.map((txn, index) => (
                <Pressable
                  key={`${group.label}-${txn.title}-${index}`}
                  accessibilityRole="button"
                  onPress={() => {}}
                  style={({pressed}) => [
                    styles.txnRow,
                    index < group.items.length - 1 && styles.txnBorder,
                    pressed && styles.pressed,
                  ]}>
                  <View
                    style={[
                      styles.txnIcon,
                      {backgroundColor: `${txn.color}1A`},
                    ]}>
                    <Icon name={txn.icon} color={txn.color} size={18} />
                  </View>
                  <View style={styles.txnInfo}>
                    <View style={styles.txnTitleRow}>
                      <Text style={styles.txnTitle} numberOfLines={1}>
                        {txn.title}
                      </Text>
                      {txn.ai ? (
                        <View style={styles.aiBadge}>
                          <Icon name="cpu" color={colors.chartPurple} size={9} />
                          <Text style={styles.aiBadgeText}>{AI_BADGE_TEXT}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.txnSub} numberOfLines={1}>
                      {txn.sub}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txnAmount,
                      txn.credit ? styles.txnCredit : styles.txnDebit,
                    ]}>
                    {txn.amount}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Load more transactions"
          onPress={() => {}}
          style={({pressed}) => [styles.loadMore, pressed && styles.pressed]}>
          <Text style={styles.loadMoreText}>Load more transactions</Text>
          <Icon name="chevronRight" color={colors.accent} size={15} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          onPress={() => navigation.popToTop()}
          style={({pressed}) => [styles.backBtn, pressed && styles.pressed]}>
          <Icon name="chevronLeft" color={colors.textSecondary} size={17} />
          <Text style={styles.backText}>Back to Home</Text>
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
    paddingBottom: spacing.md,
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
  sticky: {
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xxl,
    paddingHorizontal: spacing.lg,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  micBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    gap: spacing.sm,
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
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl * 2,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  syncBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  syncBannerInfo: {
    flex: 1,
  },
  syncBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  syncBannerDesc: {
    marginTop: 1,
    fontSize: 11,
    color: colors.textHint,
  },
  syncBannerBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(59,130,246,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightCard: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(34,197,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  insightStrong: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  group: {
    marginBottom: spacing.xl,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  groupMeta: {
    fontSize: 12,
    color: colors.textHint,
  },
  txnList: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  txnBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  txnIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  txnInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  txnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txnTitle: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(139,92,246,0.16)',
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.chartPurple,
  },
  txnSub: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textHint,
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txnDebit: {
    color: colors.textPrimary,
  },
  txnCredit: {
    color: colors.income,
  },
  loadMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.lg,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    marginTop: spacing.sm,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
