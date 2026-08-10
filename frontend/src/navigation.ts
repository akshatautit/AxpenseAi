import type {CompositeNavigationProp} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export type RootStackParamList = {
  Onboarding: undefined;
  OnboardingStart: undefined;
  Main: undefined;
  Analytics: undefined;
  Transactions: undefined;
  SmsDemo: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Transactions: undefined;
  Ai: undefined;
  Profile: undefined;
};

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export type MainNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
