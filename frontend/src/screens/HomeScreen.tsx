import React, {useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import {Icon, IconName} from '../components/Icon';
import {AnalyticsChart} from '../components/AnalyticsChart';
import {colors, radius, spacing} from '../theme';

export interface HomeScreenProps {
  onOpenSmsDemo: () => void;
  onOpenProfile: () => void;
  onOpenAnalytics: () => void;
  onOpenTransactions: () => void;
}

const FILTERS = ['1W', '1M', '3M', '1Y'];

const SUMMARY = [
  {
    key: 'income',
    label: 'Income',
    amount: '₹0',
    icon: 'arrowUpRight' as IconName,
    color: colors.income,
  },
  {
    key: 'expense',
    label: 'Expense',
    amount: '₹0',
    icon: 'arrowDownRight' as IconName,
    color: colors.expense,
  },
  {
    key: 'savings',
    label: 'Savings',
    amount: '₹0',
    icon: 'pieChart' as IconName,
    color: colors.accent,
  },
];

const CATEGORIES = [
  {
    icon: 'utensils' as IconName,
    label: 'Food & Dining',
    amount: '₹4,250',
    pct: 34,
    color: colors.warning,
  },
  {
    icon: 'car' as IconName,
    label: 'Transport',
    amount: '₹2,150',
    pct: 18,
    color: colors.info,
  },
  {
    icon: 'shoppingBag' as IconName,
    label: 'Shopping',
    amount: '₹1,900',
    pct: 15,
    color: colors.chartPurple,
  },
  {
    icon: 'creditCard' as IconName,
    label: 'Bills & Utilities',
    amount: '₹1,600',
    pct: 13,
    color: colors.expense,
  },
  {
    icon: 'film' as IconName,
    label: 'Entertainment',
    amount: '₹980',
    pct: 8,
    color: colors.chartCyan,
  },
];

export const HomeScreen = ({
  onOpenSmsDemo,
  onOpenProfile,
  onOpenAnalytics,
  onOpenTransactions,
}: HomeScreenProps) => {
  const [filter, setFilter] = useState('1M');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Namaste</Text>
            <Text style={styles.headerTitle}>Aapke paise, ek jagah</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={() => {}}
              style={({pressed}) => [
                styles.iconBtn,
                pressed && styles.pressed,
              ]}>
              <Icon name="bell" color={colors.textSecondary} size={20} />
              <View style={styles.notifDot} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profile"
              onPress={onOpenProfile}
              style={({pressed}) => [
                styles.avatarRing,
                pressed && styles.pressed,
              ]}>
              <View style={styles.avatar}>
                <Icon name="profile" color={colors.lightBlue} size={18} />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <Svg style={styles.heroBg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={colors.primary} />
                <Stop offset="0.55" stopColor="#1D4ED8" />
                <Stop offset="1" stopColor="#0F172A" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#heroGrad)" />
            <Circle cx="88" cy="18" r="26" fill="#60A5FA" opacity="0.14" />
            <Circle cx="10" cy="88" r="32" fill="#FFFFFF" opacity="0.06" />
          </Svg>

          <View style={styles.heroBody}>
            <Text style={styles.heroLabel}>TOTAL BALANCE</Text>
            <Text style={styles.heroValue}>₹—</Text>
            <View style={styles.heroChangeRow}>
              <View style={styles.changePill}>
                <Icon
                  name="trendingUp"
                  color={colors.income}
                  size={12}
                  strokeWidth={2.5}
                />
                <Text style={styles.changePillText}>0%</Text>
              </View>
              <Text style={styles.heroHint}>this month</Text>
            </View>
          </View>

          <Svg
            width="120"
            height="44"
            viewBox="0 0 120 44"
            style={styles.heroTrend}>
            <Defs>
              <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#60A5FA" stopOpacity="0.35" />
                <Stop offset="1" stopColor="#60A5FA" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path
              d="M0 36 C 14 34, 18 30, 30 32 S 50 22, 62 24 S 82 14, 96 12 S 112 8, 120 4 L 120 44 L 0 44 Z"
              fill="url(#trendFill)"
            />
            <Path
              d="M0 36 C 14 34, 18 30, 30 32 S 50 22, 62 24 S 82 14, 96 12 S 112 8, 120 4"
              fill="none"
              stroke="#93C5FD"
              strokeWidth="1.6"
            />
          </Svg>
        </View>

        <View style={styles.summaryRow}>
          {SUMMARY.map(item => (
            <View key={item.key} style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryIcon,
                  {backgroundColor: `${item.color}1A`},
                ]}>
                <Icon name={item.icon} color={item.color} size={16} />
              </View>
              <Text style={styles.summaryAmount}>{item.amount}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Analytics</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View all analytics"
              onPress={onOpenAnalytics}>
              <View style={styles.viewAllRow}>
                <Text style={styles.viewAllText}>View All</Text>
                <Icon
                  name="chevronRight"
                  color={colors.accent}
                  size={14}
                  strokeWidth={2.5}
                />
              </View>
            </Pressable>
          </View>

          <View style={styles.chipsRow}>
            {FILTERS.map(item => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{selected: filter === item}}
                onPress={() => setFilter(item)}
                style={[styles.chip, filter === item && styles.chipActive]}>
                <Text
                  style={[
                    styles.chipText,
                    filter === item && styles.chipTextActive,
                  ]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.chartCard}>
            <AnalyticsChart />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View all categories"
              onPress={onOpenTransactions}>
              <View style={styles.viewAllRow}>
                <Text style={styles.viewAllText}>View All</Text>
                <Icon
                  name="chevronRight"
                  color={colors.accent}
                  size={14}
                  strokeWidth={2.5}
                />
              </View>
            </Pressable>
          </View>

          <View style={styles.categoryCard}>
            {CATEGORIES.map((cat, index) => (
              <View
                key={cat.label}
                style={[
                  styles.categoryRow,
                  index < CATEGORIES.length - 1 && styles.categoryRowBorder,
                ]}>
                <View
                  style={[
                    styles.categoryIcon,
                    {backgroundColor: `${cat.color}1A`},
                  ]}>
                  <Icon name={cat.icon} color={cat.color} size={16} />
                </View>
                <View style={styles.categoryBody}>
                  <View style={styles.categoryTop}>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                    <Text style={styles.categoryAmount}>
                      {cat.amount}
                      <Text style={styles.categoryPct}>  ·  {cat.pct}%</Text>
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {width: `${cat.pct}%`, backgroundColor: cat.color},
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testing</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scan bank SMS"
            onPress={onOpenSmsDemo}
            style={({pressed}) => [
              styles.smsCard,
              pressed && styles.smsCardPressed,
            ]}>
            <View style={styles.smsIcon}>
              <Icon
                name="messageSquare"
                color={colors.accent}
                size={18}
              />
            </View>
            <View style={styles.smsBody}>
              <Text style={styles.smsTitle}>Scan bank SMS</Text>
              <Text style={styles.smsSubtitle}>
                Naya SMS parse karke expense dekho
              </Text>
            </View>
            <Icon
              name="chevronRight"
              color={colors.textDisabled}
              size={16}
            />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xxl,
    paddingBottom: spacing.xxl * 3.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  greeting: {
    fontSize: 13,
    color: colors.textHint,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.expense,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  avatarRing: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  hero: {
    marginTop: spacing.xl,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heroBody: {
    padding: spacing.xl,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.6,
    color: '#BFDBFE',
  },
  heroValue: {
    marginTop: spacing.sm,
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  heroChangeRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  changePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.income,
  },
  heroHint: {
    fontSize: 12,
    color: '#93C5FD',
  },
  heroTrend: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryAmount: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textHint,
  },
  section: {
    marginTop: spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textPrimary,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  categoryCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryBody: {
    flex: 1,
  },
  categoryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryPct: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textHint,
  },
  progressTrack: {
    marginTop: spacing.sm,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.secondaryCard,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  smsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  smsCardPressed: {
    opacity: 0.7,
  },
  smsIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  smsBody: {
    flex: 1,
  },
  smsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  smsSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textHint,
  },
});
