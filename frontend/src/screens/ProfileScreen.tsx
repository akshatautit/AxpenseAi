import React, {useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Circle, Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {Icon, IconName} from '../components/Icon';
import {ProgressRing} from '../components/ProgressRing';
import {SectionCard} from '../components/SectionCard';
import {SettingRow} from '../components/SettingRow';
import {Button} from '../components/Button';
import {colors, radius, spacing} from '../theme';

type ToggleKey =
  | 'biometric'
  | 'faceId'
  | 'fingerprint'
  | 'appLock'
  | 'autoLock'
  | 'deviceBinding'
  | 'autoRead'
  | 'backgroundSync'
  | 'aiParsing'
  | 'smartCategorization'
  | 'merchantDetection'
  | 'duplicateDetection'
  | 'retryFailed'
  | 'voiceAssistant'
  | 'aiNotifications'
  | 'smartInsights'
  | 'monthlyReports'
  | 'expensePrediction'
  | 'budgetSuggestions'
  | 'fraudDetection'
  | 'aiMemory'
  | 'transactionAlerts'
  | 'largeExpenseAlerts'
  | 'budgetAlerts'
  | 'goalAlerts'
  | 'monthlySummary'
  | 'weeklySummary'
  | 'salaryReminder'
  | 'billReminder'
  | 'aiTips'
  | 'pushNotifications'
  | 'emailNotifications'
  | 'darkTheme'
  | 'animations'
  | 'haptics';

const DEFAULT_TOGGLES: Record<ToggleKey, boolean> = {
  biometric: true,
  faceId: false,
  fingerprint: true,
  appLock: true,
  autoLock: false,
  deviceBinding: true,
  autoRead: true,
  backgroundSync: true,
  aiParsing: true,
  smartCategorization: true,
  merchantDetection: true,
  duplicateDetection: true,
  retryFailed: true,
  voiceAssistant: false,
  aiNotifications: true,
  smartInsights: true,
  monthlyReports: true,
  expensePrediction: true,
  budgetSuggestions: true,
  fraudDetection: true,
  aiMemory: false,
  transactionAlerts: true,
  largeExpenseAlerts: true,
  budgetAlerts: true,
  goalAlerts: false,
  monthlySummary: true,
  weeklySummary: false,
  salaryReminder: true,
  billReminder: true,
  aiTips: true,
  pushNotifications: true,
  emailNotifications: false,
  darkTheme: true,
  animations: true,
  haptics: true,
};

const QUICK_ACTIONS: {icon: IconName; color: string; title: string; desc: string}[] = [
  {icon: 'edit', color: colors.accent, title: 'Edit Profile', desc: 'Update your details'},
  {icon: 'download', color: colors.info, title: 'Export Data', desc: 'Download your data'},
  {icon: 'cpu', color: colors.aiHighlight, title: 'AI Reports', desc: 'Personal insights'},
  {icon: 'bank', color: colors.income, title: 'Connected Accounts', desc: 'Manage banks'},
];

const STATS = [
  {label: 'Transactions', value: '2,486'},
  {label: 'Monthly Spend', value: '₹18,200'},
  {label: 'Savings', value: '₹64,500'},
  {label: 'Budgets', value: '6'},
];

const BANKS = [
  {name: 'HDFC Bank', account: '•••• 4832', type: 'Savings', status: 'Synced', sync: '2 min ago'},
  {name: 'ICICI Bank', account: '•••• 1290', type: 'Current', status: 'Synced', sync: 'Today, 9:12 AM'},
];

const ACCOUNT_ROWS: {icon: IconName; title: string; value: string}[] = [
  {icon: 'profile', title: 'Personal Information', value: 'Full name, DOB'},
  {icon: 'smartphone', title: 'Phone Number', value: '+91 98765 43210'},
  {icon: 'messageSquare', title: 'Email', value: 'aksh@axpense.app'},
  {icon: 'globe', title: 'Address', value: 'Mumbai, MH'},
  {icon: 'star', title: 'Occupation', value: 'Software Engineer'},
  {icon: 'globe', title: 'Language', value: 'English (IN)'},
  {icon: 'dollar', title: 'Currency', value: 'INR (₹)'},
  {icon: 'globe', title: 'Country', value: 'India'},
  {icon: 'clock', title: 'Timezone', value: 'IST (UTC+5:30)'},
];

const SECURITY_ROWS: {icon: IconName; title: string; type: 'toggle' | 'row'; key?: string}[] = [
  {icon: 'shield', title: 'Biometric Login', type: 'toggle', key: 'biometric'},
  {icon: 'shield', title: 'Face ID', type: 'toggle', key: 'faceId'},
  {icon: 'fingerprint', title: 'Fingerprint', type: 'toggle', key: 'fingerprint'},
  {icon: 'lock', title: 'Change PIN', type: 'row'},
  {icon: 'lock', title: 'App Lock', type: 'toggle', key: 'appLock'},
  {icon: 'lock', title: 'Auto Lock', type: 'toggle', key: 'autoLock'},
  {icon: 'smartphone', title: 'Device Binding', type: 'toggle', key: 'deviceBinding'},
  {icon: 'smartphone', title: 'Trusted Devices', type: 'row'},
  {icon: 'settings', title: 'Session Management', type: 'row'},
  {icon: 'clock', title: 'Login Activity', type: 'row'},
  {icon: 'logout', title: 'Logout Other Devices', type: 'row'},
];

const SMS_ROWS: {icon: IconName; title: string; type: 'toggle' | 'row'; key?: string}[] = [
  {icon: 'messageSquare', title: 'Auto Read SMS', type: 'toggle', key: 'autoRead'},
  {icon: 'refresh', title: 'Background Sync', type: 'toggle', key: 'backgroundSync'},
  {icon: 'cpu', title: 'AI Parsing', type: 'toggle', key: 'aiParsing'},
  {icon: 'tag', title: 'Smart Categorization', type: 'toggle', key: 'smartCategorization'},
  {icon: 'search', title: 'Merchant Detection', type: 'toggle', key: 'merchantDetection'},
  {icon: 'check', title: 'Duplicate Detection', type: 'toggle', key: 'duplicateDetection'},
  {icon: 'refresh', title: 'Retry Failed Parsing', type: 'toggle', key: 'retryFailed'},
  {icon: 'clock', title: 'Last Scan Time', type: 'row'},
  {icon: 'fileText', title: 'Transactions Parsed', type: 'row'},
];

const AI_ROWS: {icon: IconName; title: string; type: 'toggle' | 'row'; key?: string}[] = [
  {icon: 'mic', title: 'Voice Assistant', type: 'toggle', key: 'voiceAssistant'},
  {icon: 'globe', title: 'Voice Language', type: 'row'},
  {icon: 'bell', title: 'AI Notifications', type: 'toggle', key: 'aiNotifications'},
  {icon: 'zap', title: 'Smart Insights', type: 'toggle', key: 'smartInsights'},
  {icon: 'fileText', title: 'Monthly Reports', type: 'toggle', key: 'monthlyReports'},
  {icon: 'trendingUp', title: 'Expense Prediction', type: 'toggle', key: 'expensePrediction'},
  {icon: 'gift', title: 'Budget Suggestions', type: 'toggle', key: 'budgetSuggestions'},
  {icon: 'shield', title: 'Fraud Detection', type: 'toggle', key: 'fraudDetection'},
  {icon: 'tag', title: 'Auto Categorization', type: 'row'},
  {icon: 'database', title: 'AI Memory', type: 'toggle', key: 'aiMemory'},
  {icon: 'profile', title: 'Personalization', type: 'row'},
];

const NOTIFICATION_ROWS: {icon: IconName; title: string; type: 'toggle' | 'row'; key?: string}[] = [
  {icon: 'creditCard', title: 'Transaction Alerts', type: 'toggle', key: 'transactionAlerts'},
  {icon: 'bell', title: 'Large Expense Alerts', type: 'toggle', key: 'largeExpenseAlerts'},
  {icon: 'pieChart', title: 'Budget Alerts', type: 'toggle', key: 'budgetAlerts'},
  {icon: 'star', title: 'Goal Alerts', type: 'toggle', key: 'goalAlerts'},
  {icon: 'fileText', title: 'Monthly Summary', type: 'toggle', key: 'monthlySummary'},
  {icon: 'fileText', title: 'Weekly Summary', type: 'toggle', key: 'weeklySummary'},
  {icon: 'dollar', title: 'Salary Reminder', type: 'toggle', key: 'salaryReminder'},
  {icon: 'clock', title: 'Bill Reminder', type: 'toggle', key: 'billReminder'},
  {icon: 'cpu', title: 'AI Tips', type: 'toggle', key: 'aiTips'},
  {icon: 'bell', title: 'Push Notifications', type: 'toggle', key: 'pushNotifications'},
  {icon: 'messageSquare', title: 'Email Notifications', type: 'toggle', key: 'emailNotifications'},
];

const APPEARANCE_ROWS: {icon: IconName; title: string; value: string; type: 'toggle' | 'row'; key?: string}[] = [
  {icon: 'moon', title: 'Dark Theme', value: '', type: 'toggle', key: 'darkTheme'},
  {icon: 'pieChart', title: 'Accent Color', value: 'Royal Blue', type: 'row'},
  {icon: 'star', title: 'App Icon', value: 'Default', type: 'row'},
  {icon: 'fileText', title: 'Font Size', value: 'Medium', type: 'row'},
  {icon: 'zap', title: 'Animations', value: '', type: 'toggle', key: 'animations'},
  {icon: 'smartphone', title: 'Haptic Feedback', value: '', type: 'toggle', key: 'haptics'},
  {icon: 'globe', title: 'Language', value: 'English', type: 'row'},
];

const DATA_ROWS: {icon: IconName; title: string; destructive?: boolean; type: 'row'}[] = [
  {icon: 'fileText', title: 'Export PDF', type: 'row'},
  {icon: 'fileText', title: 'Export Excel', type: 'row'},
  {icon: 'database', title: 'Backup Data', type: 'row'},
  {icon: 'refresh', title: 'Restore Backup', type: 'row'},
  {icon: 'trash', title: 'Delete Transactions', type: 'row', destructive: true},
  {icon: 'trash', title: 'Delete Account', type: 'row', destructive: true},
  {icon: 'shield', title: 'Privacy Settings', type: 'row'},
  {icon: 'settings', title: 'Permission Manager', type: 'row'},
  {icon: 'database', title: 'Storage Usage', type: 'row'},
];

const HELP_ROWS: {icon: IconName; title: string; type: 'row'}[] = [
  {icon: 'helpCircle', title: 'Help Center', type: 'row'},
  {icon: 'messageSquare', title: 'FAQs', type: 'row'},
  {icon: 'messageSquare', title: 'Live Chat', type: 'row'},
  {icon: 'helpCircle', title: 'Contact Support', type: 'row'},
  {icon: 'trash', title: 'Report Bug', type: 'row'},
  {icon: 'star', title: 'Request Feature', type: 'row'},
  {icon: 'lock', title: 'Privacy Policy', type: 'row'},
  {icon: 'fileText', title: 'Terms & Conditions', type: 'row'},
  {icon: 'fileText', title: 'Open Source Licenses', type: 'row'},
  {icon: 'info', title: 'App Version', type: 'row'},
];

export const ProfileScreen = () => {
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES);

  const setToggle = (key: ToggleKey) => (v: boolean) =>
    setToggles(prev => ({...prev, [key]: v}));

  const renderRows = (
    rows: {
      icon: IconName;
      title: string;
      value?: string;
      type: 'toggle' | 'row';
      key?: string;
      destructive?: boolean;
    }[],
  ) =>
    rows.map((row, index) => {
      const isToggle = row.type === 'toggle' && !!row.key;
      const key = row.key as ToggleKey;
      return (
        <SettingRow
          key={row.title}
          icon={row.icon}
          iconColor={row.destructive ? colors.expense : colors.accent}
          title={row.title}
          value={row.value}
          last={index === rows.length - 1}
          onToggle={isToggle ? setToggle(key) : undefined}
          toggleValue={isToggle ? toggles[key] : undefined}
        />
      );
    });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>
            Manage your account and preferences
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => {}}
            style={({pressed}) => [styles.iconBtn, pressed && styles.pressed]}>
            <Icon name="settings" color={colors.textSecondary} size={19} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile photo"
            onPress={() => {}}
            style={({pressed}) => [styles.avatarRing, pressed && styles.pressed]}>
            <View style={styles.avatar}>
              <Icon name="profile" color={colors.lightBlue} size={18} />
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Svg style={styles.heroBg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="profileGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#1D4ED8" />
                <Stop offset="0.6" stopColor={colors.primary} />
                <Stop offset="1" stopColor="#0F172A" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#profileGrad)" />
            <Circle cx="90" cy="14" r="24" fill="#60A5FA" opacity="0.14" />
            <Circle cx="6" cy="94" r="30" fill="#FFFFFF" opacity="0.05" />
          </Svg>

          <View style={styles.heroRow}>
            <View style={styles.heroAvatarRing}>
              <View style={styles.heroAvatar}>
                <Icon name="profile" color={colors.lightBlue} size={30} />
              </View>
            </View>
            <View style={styles.heroIdentity}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>Akshat</Text>
                <Icon name="check" color={colors.accent} size={14} strokeWidth={3} />
              </View>
              <Text style={styles.heroText}>+91 98765 43210</Text>
              <Text style={styles.heroText}>aksh@axpense.app</Text>
              <View style={styles.planBadge}>
                <Icon name="star" color={colors.warning} size={11} />
                <Text style={styles.planBadgeText}>PRO PLAN · Member since 2025</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.healthRow}>
            <ProgressRing value={0.82} size={96} strokeWidth={9} color={colors.accent}>
              <Text style={styles.healthValue}>82%</Text>
            </ProgressRing>
            <View style={styles.healthInfo}>
              <Text style={styles.healthTitle}>Financial Health</Text>
              <Text style={styles.healthDesc}>
                Excellent. You're spending less than you earn. Keep it up.
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {STATS.map(stat => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(action => (
            <Pressable
              key={action.title}
              accessibilityRole="button"
              onPress={() => {}}
              style={({pressed}) => [
                styles.actionCard,
                pressed && styles.pressed,
              ]}>
              <View style={[styles.actionIcon, {backgroundColor: `${action.color}1A`}]}>
                <Icon name={action.icon} color={action.color} size={20} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDesc}>{action.desc}</Text>
              <Icon name="chevronRight" color={colors.textDisabled} size={14} />
            </Pressable>
          ))}
        </View>

        <SectionCard title="Account">
          {renderRows(ACCOUNT_ROWS.map(r => ({...r, type: 'row' as const})))}
        </SectionCard>

        <SectionCard title="Security">
          {renderRows(SECURITY_ROWS)}
        </SectionCard>

        <SectionCard title="Connected Banks" subtitle="Bank accounts synced via SMS">
          {BANKS.map((bank, index) => (
            <View
              key={bank.name}
              style={[
                styles.bankCard,
                index < BANKS.length - 1 && styles.bankCardBorder,
              ]}>
              <View style={styles.bankLogo}>
                <Icon name="bank" color={colors.accent} size={20} />
              </View>
              <View style={styles.bankInfo}>
                <Text style={styles.bankName}>{bank.name}</Text>
                <Text style={styles.bankSub}>
                  {bank.type} · {bank.account}
                </Text>
                <View style={styles.bankSyncRow}>
                  <View style={styles.syncDot} />
                  <Text style={styles.bankSync}>
                    {bank.status} · Last sync {bank.sync}
                  </Text>
                </View>
              </View>
              <View style={styles.bankActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Sync ${bank.name}`}
                  onPress={() => {}}
                  style={({pressed}) => [styles.syncBtn, pressed && styles.pressed]}>
                  <Icon name="refresh" color={colors.accent} size={15} />
                </Pressable>
              </View>
            </View>
          ))}
          <Button
            title="+  Add New Bank"
            variant="secondary"
            onPress={() => {}}
            style={styles.addBankBtn}
          />
        </SectionCard>

        <SectionCard title="SMS Transaction Sync" subtitle="Parsing engine settings">
          {renderRows(SMS_ROWS)}
        </SectionCard>

        <SectionCard title="AI Assistant">
          {renderRows(AI_ROWS)}
        </SectionCard>

        <SectionCard title="Notifications">
          {renderRows(NOTIFICATION_ROWS)}
        </SectionCard>

        <SectionCard title="Appearance">
          {renderRows(APPEARANCE_ROWS)}
        </SectionCard>

        <SectionCard title="Data Management">
          {renderRows(DATA_ROWS)}
        </SectionCard>

        <SectionCard title="Help & Support">
          {renderRows(HELP_ROWS)}
        </SectionCard>

        <View style={styles.aboutCard}>
          <View style={styles.aboutLogo}>
            <Icon name="zap" color={colors.lightBlue} size={22} />
          </View>
          <Text style={styles.aboutName}>AXPENSE</Text>
          <Text style={styles.aboutMeta}>Version 1.0.0 (14) · Made with ♥</Text>
        </View>

        <Button
          title="Logout"
          onPress={() => {}}
          style={styles.logoutBtn}
          variant="secondary"
        />
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
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textHint,
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
    opacity: 0.75,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl * 2,
  },
  hero: {
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
    marginBottom: spacing.lg,
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
  },
  heroAvatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  heroAvatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIdentity: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  heroText: {
    marginTop: 3,
    fontSize: 13,
    color: '#BFDBFE',
  },
  planBadge: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.warning,
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148,163,184,0.25)',
    marginHorizontal: spacing.xl,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
  },
  healthInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  healthDesc: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: '#BFDBFE',
  },
  healthValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    width: '46%',
    flexGrow: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textHint,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    width: '46%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionDesc: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textHint,
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  bankCardBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  bankLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bankSub: {
    marginTop: 1,
    fontSize: 12,
    color: colors.textHint,
  },
  bankSyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 5,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.income,
  },
  bankSync: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  bankActions: {
    marginLeft: spacing.sm,
  },
  syncBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBankBtn: {
    marginVertical: spacing.lg,
  },
  aboutCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  aboutLogo: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutName: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.textPrimary,
  },
  aboutMeta: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textHint,
  },
  logoutBtn: {
    borderColor: colors.expense,
    marginTop: spacing.sm,
  },
});
