import React from 'react';
import {Alert} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {
  DarkTheme,
  NavigationContainer,
  Theme,
  useNavigation,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {HomeScreen} from './src/screens/HomeScreen';
import {SmsDemoScreen} from './src/screens/SmsDemoScreen';
import {ProfileScreen} from './src/screens/ProfileScreen';
import {AnalyticsScreen} from './src/screens/AnalyticsScreen';
import {TransactionsScreen} from './src/screens/TransactionsScreen';
import {BottomNav, TabKey} from './src/components/BottomNav';
import {AiAssistantScreen} from './src/screens/AiAssistantScreen';
import {OnboardingScreen} from './src/screens/OnboardingScreen';
import {OnboardingStartScreen} from './src/screens/OnboardingStartScreen';
import {colors} from './src/theme';
import {
  MainNavigation,
  MainTabParamList,
  RootStackParamList,
} from './src/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ROUTES: Record<TabKey, keyof MainTabParamList> = {
  home: 'Home',
  transactions: 'Transactions',
  ai: 'Ai',
  profile: 'Profile',
};

const MainTabBar = ({state, navigation}: BottomTabBarProps) => {
  const tabKeys: TabKey[] = ['home', 'transactions', 'ai', 'profile'];
  const activeTab = tabKeys[state.index] ?? 'home';
  return (
    <BottomNav
      activeTab={activeTab}
      onChange={tab => navigation.navigate(TAB_ROUTES[tab])}
      onFabPress={() =>
        Alert.alert('Add expense', 'Ye screen jald hi aa rahi hai')
      }
    />
  );
};

const HomeTab = () => {
  const navigation = useNavigation<MainNavigation>();
  return (
    <HomeScreen
      onOpenSmsDemo={() => navigation.navigate('SmsDemo')}
      onOpenProfile={() => navigation.navigate('Profile')}
      onOpenAnalytics={() => navigation.navigate('Analytics')}
      onOpenTransactions={() => navigation.navigate('Transactions')}
    />
  );
};

const TransactionsTab = () => <TransactionsScreen />;
const AiTab = () => <AiAssistantScreen />;

const MainTabs = () => (
  <Tab.Navigator
    tabBar={MainTabBar}
    screenOptions={{headerShown: false, animation: 'none'}}>
    <Tab.Screen name="Home" component={HomeTab} />
    <Tab.Screen name="Transactions" component={TransactionsTab} />
    <Tab.Screen name="Ai" component={AiTab} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accent,
    notification: colors.accent,
  },
};

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{animation: 'fade'}}
          />
          <Stack.Screen
            name="OnboardingStart"
            component={OnboardingStartScreen}
            options={{animation: 'slide_from_right'}}
          />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Analytics"
            component={AnalyticsScreen}
            options={{animation: 'slide_from_right'}}
          />
          <Stack.Screen
            name="Transactions"
            component={TransactionsScreen}
            options={{animation: 'slide_from_right'}}
          />
          <Stack.Screen
            name="SmsDemo"
            component={SmsDemoScreen}
            options={{animation: 'slide_from_right'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
