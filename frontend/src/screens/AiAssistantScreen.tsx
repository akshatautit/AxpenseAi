import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg';
import {Icon, IconName} from '../components/Icon';
import {colors, radius, spacing} from '../theme';
import {MainNavigation} from '../navigation';

type SmartCardType =
  | 'summary'
  | 'savings'
  | 'merchant'
  | 'budget'
  | 'forecast'
  | 'subscription';

type ChartSpec = {labels: string[]; values: number[]};

type Message = {
  id: string;
  role: 'user' | 'ai';
  text?: string;
  card?: SmartCardType;
  chart?: ChartSpec;
};

type AiResponse = {text: string; card?: SmartCardType; chart?: ChartSpec};

const QUICK_ACTIONS: {icon: IconName; label: string; prompt: string}[] = [
  {icon: 'trendingUp', label: 'This month spend', prompt: 'How much did I spend this month?'},
  {icon: 'clock', label: 'Today\u2019s expenses', prompt: 'Show today\u2019s expenses'},
  {icon: 'tag', label: 'Where to save', prompt: 'Where can I save money?'},
  {icon: 'refresh', label: 'Subscriptions', prompt: 'Show subscriptions'},
  {icon: 'arrowUpRight', label: 'Highest expense', prompt: 'Show my highest expense'},
  {icon: 'trendingDown', label: 'Monthly comparison', prompt: 'Compare this month with last month'},
  {icon: 'pieChart', label: 'Analyze spending', prompt: 'Analyze my spending'},
  {icon: 'gift', label: 'Create budget', prompt: 'Create a budget'},
  {icon: 'zap', label: 'Predict next month', prompt: 'Predict next month\u2019s expenses'},
];

const SUGGESTIONS = [
  'Compare this month',
  'Analyze shopping',
  'Find unusual spending',
  'Show refunds',
  'Top merchants',
  'Largest transactions',
  'Generate monthly report',
  'Create savings goal',
];

const SUMMARY_ROWS: [string, string, string, string][] = [
  ['Food', '₹4,250', '+14%', colors.expense],
  ['Shopping', '₹3,900', '-5%', colors.income],
  ['Transport', '₹2,100', '+2%', colors.warning],
];

const CHART_COLORS = [
  colors.chartBlue2,
  colors.chartPurple,
  colors.chartCyan,
  colors.chartOrange,
  colors.chartBlue1,
  colors.lightBlue,
];

const getAiResponse = (query: string): AiResponse => {
  const q = query.toLowerCase();
  if (q.replace(/[^a-z]/g, '').length < 2) {
    return {
      text:
        'I couldn\u2019t understand that request.\n\nTry asking in another way, like "How much did I spend this month?"',
    };
  }
  if (q.includes('swiggy') || q.includes('zomato') || q.includes('merchant')) {
    return {
      text:
        'Here\u2019s my analysis of your food delivery spending.\n\n\u2022 Swiggy: \u20b94,368 this month\n\u2022 Zomato: \u20b92,120 this month\n\u2022 Average order: \u20b9312\n\nFood delivery is up 14% versus last month.',
      card: 'merchant',
    };
  }
  if (q.includes('saving') || q.includes('save')) {
    return {
      text:
        'I found 3 ways you can save \u20b92,850 every month.\n\n\u2022 Switch Netflix to the mobile plan: save \u20b9200/mo\n\u2022 Cancel the unused gym add-on: save \u20b9500/mo\n\u2022 Trim weekend dining: save \u20b92,150/mo',
      card: 'savings',
    };
  }
  if (q.includes('subscription') || q.includes('recurring') || q.includes('bill')) {
    return {
      text: 'I detected 3 active subscriptions renewing this month, totalling \u20b9867/month.',
      card: 'subscription',
    };
  }
  if (q.includes('budget')) {
    return {
      text:
        'You\u2019re at 72% of your monthly budget with 9 days remaining.\n\n\u2022 Remaining: \u20b92,300\n\u2022 Safe daily spend: \u20b9255',
      card: 'budget',
    };
  }
  if (q.includes('predict') || q.includes('next month') || q.includes('forecast')) {
    return {
      text:
        'Based on your last 6 months, I expect you to spend around \u20b921,800 next month.\n\n\u2022 Shopping typically rises during festive sales\n\u2022 Transport usually stays stable',
      card: 'forecast',
    };
  }
  if (q.includes('today')) {
    return {
      text:
        'You\u2019ve spent \u20b9540 today across 3 transactions.\n\n\u2022 \u20b9220 Food (Swiggy)\n\u2022 \u20b9185 Transport (Uber)\n\u2022 \u20b9135 Shopping (Blinkit)',
      card: 'summary',
    };
  }
  if (q.includes('highest') || q.includes('large')) {
    return {
      text: 'Your highest expense this month was \u20b98,900 at Apple Store on July 14.',
      card: 'summary',
    };
  }
  if (q.includes('compare') || q.includes('comparison') || q.includes('vs')) {
    return {
      text:
        'Here\u2019s your spending comparison. You\u2019re tracking 6% lower than last month at the same point.',
      card: 'summary',
      chart: {labels: ['W1', 'W2', 'W3', 'W4'], values: [42, 51, 38, 46]},
    };
  }
  return {
    text:
      'Here\u2019s a quick snapshot of your finances this month.\n\n\u2022 Income: \u20b930,000\n\u2022 Expenses: \u20b921,380\n\u2022 Savings: \u20b98,620 (29%)\n\nYou\u2019re in great shape. Ask me about budgets, subscriptions, or where you can save more.',
    card: 'summary',
    chart: {labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], values: [54, 42, 98, 31, 76, 118, 23]},
  };
};

const PulsingDot = () => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={styles.dotWrap}>
      <Animated.View
        style={[
          styles.dotGlow,
          {
            opacity: pulse.interpolate({inputRange: [0, 1], outputRange: [0.55, 0]}),
            transform: [
              {scale: pulse.interpolate({inputRange: [0, 1], outputRange: [1, 2.8]})},
            ],
          },
        ]}
      />
      <View style={styles.dot} />
    </View>
  );
};

const AiOrb = () => {
  const ringA = useRef(new Animated.Value(0)).current;
  const ringB = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const spin = (v: Animated.Value, delay: number) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 2600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return loop;
    };
    const l1 = spin(ringA, 0);
    const l2 = spin(ringB, 1300);
    return () => {
      l1.stop();
      l2.stop();
    };
  }, [ringA, ringB]);
  return (
    <View style={styles.orbWrap}>
      <Animated.View
        style={[
          styles.orbRing,
          {
            opacity: ringA.interpolate({inputRange: [0, 1], outputRange: [0.55, 0]}),
            transform: [
              {scale: ringA.interpolate({inputRange: [0, 1], outputRange: [0.55, 1.55]})},
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orbRingB,
          {
            opacity: ringB.interpolate({inputRange: [0, 1], outputRange: [0.5, 0]}),
            transform: [
              {scale: ringB.interpolate({inputRange: [0, 1], outputRange: [0.55, 1.55]})},
            ],
          },
        ]}
      />
      <View style={styles.orbCore}>
        <Svg style={styles.orbCoreFill} viewBox="0 0 64 64">
          <Defs>
            <LinearGradient id="orbGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.primaryDark} />
              <Stop offset="0.5" stopColor={colors.primary} />
              <Stop offset="1" stopColor={colors.aiHighlight} />
            </LinearGradient>
          </Defs>
          <Circle cx="32" cy="32" r="32" fill="url(#orbGrad)" />
        </Svg>
        <Icon name="bot" color={colors.textPrimary} size={30} />
      </View>
    </View>
  );
};

const MiniOrb = () => {
  const scale = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.6,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);
  return (
    <View style={styles.miniOrb}>
      <Animated.View style={[styles.miniOrbCore, {transform: [{scale}]}]}>
        <Icon name="bot" color={colors.lightBlue} size={13} />
      </Animated.View>
    </View>
  );
};

const TypingIndicator = () => {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const mk = (v: Animated.Value, delay: number) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 420,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 420,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return loop;
    };
    const l1 = mk(a, 0);
    const l2 = mk(b, 140);
    const l3 = mk(c, 280);
    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
    };
  }, [a, b, c]);
  const dot = (v: Animated.Value) => ({
    opacity: v,
    transform: [
      {translateY: v.interpolate({inputRange: [0, 1], outputRange: [0, -4]})},
    ],
  });
  return (
    <View style={styles.typingRow}>
      <Animated.View style={[styles.typingDot, dot(a)]} />
      <Animated.View style={[styles.typingDot, dot(b)]} />
      <Animated.View style={[styles.typingDot, dot(c)]} />
    </View>
  );
};

const Waveform = () => {
  const values = useRef(
    [0, 1, 2, 3, 4].map(() => new Animated.Value(0.3)),
  ).current;
  useEffect(() => {
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: 480 + i * 90,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0.22,
            duration: 480 + i * 90,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [values]);
  return (
    <View style={styles.waveRow}>
      {values.map((v, i) => (
        <Animated.View key={i} style={[styles.waveBar, {transform: [{scaleY: v}]}]} />
      ))}
    </View>
  );
};

const StreamingText = ({text}: {text: string}) => {
  const wordsRef = useRef(text.split(' '));
  const [count, setCount] = useState(1);
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev >= wordsRef.current.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 2;
      });
    }, 24);
    return () => clearInterval(timer);
  }, [text]);
  const done = count >= wordsRef.current.length;
  return (
    <Text style={styles.aiText}>
      {wordsRef.current.slice(0, count).join(' ')}
      {done ? '' : '\u258b'}
    </Text>
  );
};

const Bar = ({value, color}: {value: number; color: string}) => {
  const scaleY = useRef(new Animated.Value(0.05)).current;
  useEffect(() => {
    Animated.spring(scaleY, {
      toValue: Math.max(value, 0.04),
      damping: 13,
      stiffness: 85,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [value, scaleY]);
  return (
    <Animated.View
      style={[styles.bar, {backgroundColor: color}, {transform: [{scaleY}]}]}
    />
  );
};

const MiniBars = ({labels, values}: ChartSpec) => {
  const max = Math.max(...values, 1);
  return (
    <View style={styles.chartWrap}>
      <View style={styles.barsArea}>
        {values.map((v, i) => (
          <Bar key={i} value={v / max} color={CHART_COLORS[i % CHART_COLORS.length]} />
        ))}
      </View>
      <View style={styles.labelsRow}>
        {labels.map((label, i) => (
          <Text key={i} numberOfLines={1} style={styles.barLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const BudgetBar = ({value}: {value: number}) => {
  const scaleX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleX, {
      toValue: value,
      damping: 13,
      stiffness: 80,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [value, scaleX]);
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, {transform: [{scaleX}]}]} />
    </View>
  );
};

const SummaryCard = () => (
  <View style={styles.smartCard}>
    <View style={styles.smartHeader}>
      <Text style={styles.smartTitle}>Expense Summary</Text>
      <View style={styles.trendBadge}>
        <Icon name="trendingUp" color={colors.expense} size={12} />
        <Text style={styles.trendText}>+14%</Text>
      </View>
    </View>
    <Text style={styles.smartAmount}>₹18,250</Text>
    <Text style={styles.smartLabel}>spent this week</Text>
    <View style={styles.smartRows}>
      {SUMMARY_ROWS.map(([name, value, trend, trendColor]) => (
        <View key={name} style={styles.smartRow}>
          <Text style={styles.smartRowLabel}>{name}</Text>
          <Text style={styles.smartRowValue}>{value}</Text>
          <Text style={[styles.smartRowTrend, {color: trendColor}]}>{trend}</Text>
        </View>
      ))}
    </View>
  </View>
);

const SavingsCard = () => (
  <View style={styles.smartCard}>
    <Text style={styles.smartTitle}>Savings Opportunity</Text>
    <Text style={styles.smartAmount}>₹2,850</Text>
    <Text style={styles.smartLabel}>potential monthly savings</Text>
    <View style={styles.confidenceRow}>
      <View style={styles.confidenceInfo}>
        <Text style={styles.confidenceLabel}>AI Confidence</Text>
        <Text style={styles.confidenceValue}>82%</Text>
      </View>
      <BudgetBar value={0.82} />
    </View>
    <Text style={styles.smartTip}>
      Tip: switch 2 subscriptions to annual plans to lock in discounts.
    </Text>
  </View>
);

const MerchantCard = () => (
  <View style={styles.smartCard}>
    <Text style={styles.smartTitle}>Merchant Analysis</Text>
    <View style={styles.merchantRow}>
      <View style={styles.merchantLogo}>
        <Icon name="utensils" color={colors.warning} size={20} />
      </View>
      <View style={styles.merchantInfo}>
        <Text style={styles.merchantName}>Swiggy</Text>
        <Text style={styles.merchantMeta}>most visited · 14 visits</Text>
      </View>
    </View>
    <View style={styles.metricsRow}>
      <View style={styles.metric}>
        <Text style={styles.metricValue}>₹312</Text>
        <Text style={styles.metricLabel}>Average order</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.metricValue}>14</Text>
        <Text style={styles.metricLabel}>Monthly visits</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.metricValue}>₹4,368</Text>
        <Text style={styles.metricLabel}>This month</Text>
      </View>
    </View>
  </View>
);

const BudgetCard = () => (
  <View style={styles.smartCard}>
    <View style={styles.smartHeader}>
      <Text style={styles.smartTitle}>Budget Status</Text>
      <Text style={styles.budgetPercent}>72%</Text>
    </View>
    <BudgetBar value={0.72} />
    <View style={styles.budgetRow}>
      <Text style={styles.budgetUsed}>Used ₹5,700</Text>
      <Text style={styles.budgetLeft}>Left ₹2,300</Text>
    </View>
  </View>
);

const ForecastCard = () => (
  <View style={styles.smartCard}>
    <Text style={styles.smartTitle}>Spending Forecast</Text>
    <Text style={styles.smartAmount}>₹21,800</Text>
    <Text style={styles.smartLabel}>expected next month</Text>
    <View style={styles.forecastRow}>
      <View style={styles.forecastPill}>
        <Icon name="check" color={colors.income} size={12} />
        <Text style={styles.forecastPillText}>Accuracy ±8%</Text>
      </View>
    </View>
    <Text style={styles.smartTip}>
      Shopping expenses are expected to rise during festive season sales.
    </Text>
  </View>
);

const SubscriptionCard = () => (
  <View style={styles.smartCard}>
    <Text style={styles.smartTitle}>Detected Subscriptions</Text>
    {[
      ['Netflix', '₹649', 'Renews Jul 12'],
      ['Spotify', '₹119', 'Renews Jul 19'],
      ['iCloud', '₹99', 'Renews Jul 26'],
    ].map(([name, cost, date], index) => (
      <View
        key={name}
        style={[
          styles.subRow,
          index < 2 && styles.subRowBorder,
        ]}>
        <View style={styles.subIcon}>
          <Icon name="film" color={colors.aiHighlight} size={15} />
        </View>
        <Text style={styles.subName}>{name}</Text>
        <View style={styles.subMeta}>
          <Text style={styles.subCost}>{cost}</Text>
          <Text style={styles.subDate}>{date}</Text>
        </View>
      </View>
    ))}
    <View style={styles.subTotal}>
      <Text style={styles.subTotalLabel}>Total / month</Text>
      <Text style={styles.subTotalValue}>₹867</Text>
    </View>
  </View>
);

const SmartCard = ({type}: {type: SmartCardType}) => {
  switch (type) {
    case 'savings':
      return <SavingsCard />;
    case 'merchant':
      return <MerchantCard />;
    case 'budget':
      return <BudgetCard />;
    case 'forecast':
      return <ForecastCard />;
    case 'subscription':
      return <SubscriptionCard />;
    default:
      return <SummaryCard />;
  }
};

const MessageActions = () => {
  const navigation = useNavigation<MainNavigation>();
  const onPress = (action: string) => {
    if (action === 'View Transactions') {
      navigation.navigate('Transactions');
    } else if (action === 'View Analytics') {
      navigation.navigate('Analytics');
    } else if (action === 'Export Report') {
      Alert.alert('Export Report', 'Your monthly report is being prepared.');
    } else if (action === 'Share') {
      Alert.alert('Share', 'Share link copied.');
    }
  };
  return (
    <View style={styles.actionsRow}>
      {[
        {icon: 'fileText' as IconName, label: 'View Transactions'},
        {icon: 'pieChart' as IconName, label: 'View Analytics'},
        {icon: 'download' as IconName, label: 'Export Report'},
        {icon: 'share' as IconName, label: 'Share'},
      ].map(action => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          onPress={() => onPress(action.label)}
          style={({pressed}) => [styles.actionPill, pressed && styles.pressedScale]}>
          <Icon name={action.icon} color={colors.lightBlue} size={13} />
          <Text style={styles.actionPillText}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
};

const AiMessage = ({message}: {message: Message}) => (
  <View style={styles.aiRow}>
    <MiniOrb />
    <View style={styles.aiContent}>
      <View style={styles.aiBubble}>
        {message.text ? <StreamingText text={message.text} /> : <TypingIndicator />}
        {message.chart ? <MiniBars {...message.chart} /> : null}
        {message.card ? <SmartCard type={message.card} /> : null}
      </View>
      <MessageActions />
    </View>
  </View>
);

const UserMessage = ({message}: {message: Message}) => (
  <View style={styles.userRow}>
    <View style={styles.userBubble}>
      <Text style={styles.userText}>{message.text}</Text>
    </View>
  </View>
);

const HeroCard = () => (
  <View style={styles.hero}>
    <Svg style={styles.heroBg} viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.primaryDark} />
          <Stop offset="0.55" stopColor={colors.primary} />
          <Stop offset="1" stopColor={colors.aiHighlight} />
        </LinearGradient>
      </Defs>
      <Circle cx="0" cy="0" r="45" fill="#FFFFFF" opacity="0.06" />
      <Circle cx="100" cy="30" r="30" fill="#60A5FA" opacity="0.12" />
      <Circle cx="85" cy="100" r="38" fill="#8B5CF6" opacity="0.12" />
    </Svg>
    <View style={styles.heroTop}>
      <AiOrb />
      <View style={styles.heroStatus}>
        <View style={styles.heroStatusRow}>
          <PulsingDot />
          <Text style={styles.heroStatusText}>Analyzing in real time</Text>
        </View>
        <Text style={styles.heroGreeting}>Good Morning, Akshata</Text>
        <Text style={styles.heroSubtitle}>
          I\u2019ve analyzed your latest transactions.
        </Text>
      </View>
    </View>
    <View style={styles.heroDivider} />
    <View style={styles.heroStats}>
      <View style={styles.heroStat}>
        <Text style={styles.heroStatValue}>₹18,250</Text>
        <Text style={styles.heroStatLabel}>spent this week</Text>
      </View>
      <View style={styles.heroStatSeparator} />
      <View style={styles.heroStat}>
        <View style={styles.heroStatTrend}>
          <Icon name="trendingUp" color="#FCA5A5" size={11} />
          <Text style={styles.heroStatTrendText}>+14%</Text>
        </View>
        <Text style={styles.heroStatLabel}>food expenses</Text>
      </View>
      <View style={styles.heroStatSeparator} />
      <View style={styles.heroStat}>
        <Text style={[styles.heroStatValue, styles.heroStatValueGreen]}>₹2,850</Text>
        <Text style={styles.heroStatLabel}>saved vs last month</Text>
      </View>
    </View>
  </View>
);

const QuickChips = ({onPick}: {onPick: (prompt: string) => void}) => (
  <View style={styles.quickSection}>
    <Text style={styles.sectionTitle}>Try asking</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickRow}>
      {QUICK_ACTIONS.map(action => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          onPress={() => onPick(action.prompt)}
          style={({pressed}) => [styles.quickChip, pressed && styles.pressedScale]}>
          <Icon name={action.icon} color={colors.lightBlue} size={14} />
          <Text style={styles.quickChipText}>{action.label}</Text>
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voice Mode"
        onPress={() => onPick('Voice Mode')}
        style={({pressed}) => [styles.quickChip, styles.voiceChip, pressed && styles.pressedScale]}>
        <Icon name="mic" color={colors.income} size={14} />
        <Text style={styles.voiceChipText}>Voice Mode · Hold to talk</Text>
      </Pressable>
    </ScrollView>
  </View>
);

const EmptyState = ({
  onPick,
  onVoice,
}: {
  onPick: (prompt: string) => void;
  onVoice: () => void;
}) => (
  <View>
    <HeroCard />
    <QuickChips onPick={onPick} />
    <View style={styles.emptyWrap}>
      <View style={styles.emptyOrbWrap}>
        <AiOrb />
      </View>
      <Text style={styles.emptyTitle}>Your AI Financial Assistant is Ready</Text>
      <Text style={styles.emptySubtitle}>
        Ask anything about your money, expenses, budgets, savings or transactions.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onVoice}
        style={({pressed}) => [styles.emptyVoice, pressed && styles.pressedScale]}>
        <View style={styles.emptyVoiceIcon}>
          <Icon name="mic" color={colors.textPrimary} size={18} />
        </View>
        <Text style={styles.emptyVoiceText}>Hold to talk to your AI</Text>
      </Pressable>
    </View>
  </View>
);

const SuggestionsRow = ({items, onPick}: {items: string[]; onPick: (p: string) => void}) => (
  <View style={styles.suggestionsWrap}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.suggestionsRow}>
      <Text style={styles.suggestionsLabel}>Suggestions</Text>
      {items.map(s => (
        <Pressable
          key={s}
          accessibilityRole="button"
          onPress={() => onPick(s)}
          style={({pressed}) => [styles.suggestionChip, pressed && styles.pressedScale]}>
          <Icon name="zap" color={colors.info} size={12} />
          <Text style={styles.suggestionText}>{s}</Text>
        </Pressable>
      ))}
    </ScrollView>
  </View>
);

const InsightsPanel = ({open, onToggle}: {open: boolean; onToggle: () => void}) => (
  <View style={styles.insightsWrap}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Toggle live insights"
      onPress={onToggle}
      style={({pressed}) => [styles.insightsHeader, pressed && styles.pressedScale]}>
      <View style={styles.insightsTitleWrap}>
        <View style={styles.insightsIcon}>
          <PulsingDot />
        </View>
        <View>
          <Text style={styles.insightsTitle}>Live Insights</Text>
          <Text style={styles.insightsSubtitle}>Real-time financial pulse</Text>
        </View>
      </View>
      <View style={styles.insightsChevron}>
        <Icon
          name="chevronRight"
          color={colors.textSecondary}
          size={16}
          strokeWidth={2.5}
        />
      </View>
    </Pressable>
    {open ? (
      <View style={styles.insightsGrid}>
        {[
          {label: 'Today\u2019s Spending', value: '₹540', color: colors.accent},
          {label: 'Budget Left', value: '₹2,300', color: colors.income},
          {label: 'Monthly Savings', value: '₹2,850', color: colors.chartCyan},
          {label: 'Upcoming Bills', value: '₹3,120', color: colors.warning},
          {label: 'AI Confidence', value: '94%', color: colors.aiHighlight},
          {label: 'Financial Health', value: '82%', color: colors.chartOrange},
        ].map(insight => (
          <View key={insight.label} style={styles.insightCard}>
            <View
              style={[styles.insightDot, {backgroundColor: insight.color}]}
            />
            <Text style={styles.insightValue}>{insight.value}</Text>
            <Text style={styles.insightLabel}>{insight.label}</Text>
          </View>
        ))}
      </View>
    ) : null}
  </View>
);

const InputBar = ({
  value,
  onChangeText,
  onSend,
  listening,
  onMic,
}: {
  value: string;
  onChangeText: (t: string) => void;
  onSend: () => void;
  listening: boolean;
  onMic: () => void;
}) => {
  const canSend = value.trim().length > 0;
  return (
    <View style={styles.inputBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Attach file"
        onPress={() => Alert.alert('Attach', 'Attachments coming soon.')}
        style={({pressed}) => [styles.inputIconBtn, pressed && styles.pressedScale]}>
        <Icon name="paperclip" color={colors.textHint} size={20} />
      </Pressable>
      <View style={styles.inputField}>
        {listening ? (
          <View style={styles.listeningRow}>
            <Waveform />
            <Text style={styles.listeningText}>Listening...</Text>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder="Ask anything about your finances..."
            placeholderTextColor={colors.textDisabled}
            multiline
            maxLength={400}
          />
        )}
      </View>
      {canSend && !listening ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          onPress={onSend}
          style={({pressed}) => [styles.sendBtn, pressed && styles.pressedScale]}>
          <Icon name="send" color={colors.textPrimary} size={18} />
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voice input"
          onPress={onMic}
          style={({pressed}) => [
            styles.micBtn,
            listening && styles.micBtnActive,
            pressed && styles.pressedScale,
          ]}>
          <Icon
            name="mic"
            color={listening ? colors.textPrimary : colors.lightBlue}
            size={20}
          />
        </Pressable>
      )}
    </View>
  );
};

export const AiAssistantScreen = () => {
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>(SUGGESTIONS);
  const idRef = useRef(0);

  const nextId = () => `m${idRef.current++}`;

  const sendMessage = (raw: string) => {
    const question = raw.trim();
    if (!question || typing) {
      return;
    }
    const userMessage: Message = {id: nextId(), role: 'user', text: question};
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setListening(false);
    setTyping(true);
    setSuggestions(prev => [
      ...prev.slice(2),
      prev[0],
      prev[1],
    ]);
    setTimeout(() => {
      const response = getAiResponse(question);
      const aiMessage: Message = {
        id: nextId(),
        role: 'ai',
        text: response.text,
        card: response.card,
        chart: response.chart,
      };
      setTyping(false);
      setMessages(prev => [...prev, aiMessage]);
    }, 1500);
  };

  const handleMic = () => {
    if (listening) {
      return;
    }
    setListening(true);
    setTimeout(() => {
      setListening(false);
      sendMessage('How much did I spend on Swiggy?');
    }, 1600);
  };

  const handlePick = (prompt: string) => {
    if (prompt === 'Voice Mode') {
      handleMic();
      return;
    }
    sendMessage(prompt);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <Text style={styles.headerSubtitle}>Your Personal Financial Intelligence</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.statusPill}>
            <PulsingDot />
            <Text style={styles.statusText}>Online</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => Alert.alert('AI Alerts', 'No new alerts.')}
            style={({pressed}) => [styles.headerIcon, pressed && styles.pressedScale]}>
            <Icon name="bell" color={colors.textSecondary} size={19} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voice settings"
            onPress={() => Alert.alert('Voice Settings', 'Voice & language settings.')}
            style={({pressed}) => [styles.headerIcon, pressed && styles.pressedScale]}>
            <Icon name="headphones" color={colors.textSecondary} size={19} />
          </Pressable>
        </View>
      </View>

      {messages.length === 0 ? (
        <InsightsPanel open={panelOpen} onToggle={() => setPanelOpen(o => !o)} />
      ) : null}

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          style={styles.bodyScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({animated: true})
          }>
          {messages.length === 0 ? (
            <EmptyState onPick={handlePick} onVoice={handleMic} />
          ) : (
            messages.map(message =>
              message.role === 'user' ? (
                <UserMessage key={message.id} message={message} />
              ) : (
                <AiMessage key={message.id} message={message} />
              ),
            )
          )}
          {typing ? (
            <View style={styles.aiRow}>
              <MiniOrb />
              <View style={styles.aiBubble}>
                <TypingIndicator />
              </View>
            </View>
          ) : null}
        </ScrollView>

        {messages.length > 0 ? (
          <SuggestionsRow items={suggestions} onPick={handlePick} />
        ) : null}

        <InputBar
          value={input}
          onChangeText={setInput}
          onSend={() => sendMessage(input)}
          listening={listening}
          onMic={handleMic}
        />
      </KeyboardAvoidingView>
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
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textHint,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.income,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedScale: {
    opacity: 0.75,
    transform: [{scale: 0.97}],
  },
  dotWrap: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotGlow: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.income,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.income,
    shadowColor: colors.income,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  orbWrap: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbRing: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  orbRingB: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1.5,
    borderColor: colors.chartPurple,
  },
  orbCore: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbCoreFill: {
    position: 'absolute',
    width: 64,
    height: 64,
  },
  miniOrb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
    marginRight: spacing.sm,
  },
  miniOrbCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(37,99,235,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.lightBlue,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 22,
  },
  waveBar: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: colors.lightBlue,
  },
  listeningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 4,
  },
  listeningText: {
    fontSize: 13,
    color: colors.lightBlue,
  },
  aiText: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textPrimary,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  aiContent: {
    flex: 1,
  },
  aiBubble: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderTopLeftRadius: radius.sm,
    padding: spacing.lg,
  },
  userRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  userBubble: {
    maxWidth: '86%',
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    borderTopRightRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userText: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(37,99,235,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.lightBlue,
  },
  smartCard: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(15,23,42,0.55)',
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  smartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.expense,
  },
  smartAmount: {
    marginTop: spacing.md,
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  smartLabel: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textHint,
  },
  smartRows: {
    marginTop: spacing.md,
  },
  smartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  smartRowLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  smartRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.md,
  },
  smartRowTrend: {
    fontSize: 12,
    fontWeight: '700',
    width: 42,
    textAlign: 'right',
  },
  confidenceRow: {
    marginTop: spacing.md,
  },
  confidenceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  confidenceLabel: {
    fontSize: 12,
    color: colors.textHint,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondaryCard,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    transformOrigin: 'left',
  },
  smartTip: {
    marginTop: spacing.md,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textHint,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  merchantLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(245,158,11,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  merchantMeta: {
    marginTop: 1,
    fontSize: 12,
    color: colors.textHint,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  metric: {
    flex: 1,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    marginTop: 1,
    fontSize: 11,
    color: colors.textHint,
  },
  budgetPercent: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  budgetUsed: {
    fontSize: 12,
    color: colors.textHint,
  },
  budgetLeft: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.income,
  },
  forecastRow: {
    marginTop: spacing.md,
  },
  forecastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  forecastPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.income,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  subRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  subIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  subName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subMeta: {
    alignItems: 'flex-end',
  },
  subCost: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subDate: {
    fontSize: 11,
    color: colors.textHint,
  },
  subTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  subTotalLabel: {
    fontSize: 12,
    color: colors.textHint,
  },
  subTotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.income,
  },
  chartWrap: {
    marginTop: spacing.md,
  },
  barsArea: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  bar: {
    flex: 1,
    height: 80,
    borderRadius: 8,
    transformOrigin: 'bottom',
  },
  labelsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  barLabel: {
    flex: 1,
    fontSize: 10,
    color: colors.textDisabled,
    textAlign: 'center',
  },
  hero: {
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
    marginBottom: spacing.xl,
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
  },
  heroStatus: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  heroStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#BFDBFE',
  },
  heroGreeting: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#DBEAFE',
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(219,234,254,0.25)',
    marginHorizontal: spacing.xl,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  heroStat: {
    flex: 1,
  },
  heroStatSeparator: {
    width: StyleSheet.hairlineWidth,
    height: 34,
    backgroundColor: 'rgba(219,234,254,0.25)',
    marginHorizontal: spacing.md,
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  heroStatValueGreen: {
    color: '#86EFAC',
  },
  heroStatLabel: {
    marginTop: 2,
    fontSize: 10,
    color: '#BFDBFE',
  },
  heroStatTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroStatTrendText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FCA5A5',
  },
  quickSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  quickRow: {
    gap: spacing.sm,
    paddingRight: spacing.xxl,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  voiceChip: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.35)',
  },
  voiceChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.income,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyOrbWrap: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textHint,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyVoice: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  emptyVoiceIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyVoiceText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  insightsWrap: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    borderRadius: radius.card,
    backgroundColor: 'rgba(22,32,51,0.75)',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  insightsTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  insightsIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  insightsSubtitle: {
    marginTop: 1,
    fontSize: 11,
    color: colors.textHint,
  },
  insightsChevron: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{rotate: '90deg'}],
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  insightCard: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: spacing.sm,
  },
  insightValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  insightLabel: {
    marginTop: 1,
    fontSize: 10,
    color: colors.textHint,
  },
  body: {
    flex: 1,
  },
  bodyScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  suggestionsWrap: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  suggestionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  suggestionsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDisabled,
    marginRight: spacing.xs,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.25)',
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  inputIconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  inputField: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
  },
  input: {
    fontSize: 15,
    color: colors.textPrimary,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  micBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
});
