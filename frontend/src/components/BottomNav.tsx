import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {Icon, IconName} from './Icon';
import {colors, spacing} from '../theme';

export type TabKey = 'home' | 'transactions' | 'ai' | 'profile';

interface TabDef {
  key: TabKey;
  label: string;
  icon: IconName;
}

const BAR_HEIGHT = 60;
const FAB_SIZE = 60;
const radiusPill = 14;

const TABS: TabDef[] = [
  {key: 'home', label: 'Home', icon: 'home'},
  {key: 'transactions', label: 'Transactions', icon: 'fileText'},
  {key: 'ai', label: 'AI Bot', icon: 'bot'},
  {key: 'profile', label: 'Profile', icon: 'profile'},
];

export interface BottomNavProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  onFabPress: () => void;
}

export const BottomNav = ({
  activeTab,
  onChange,
  onFabPress,
}: BottomNavProps) => {
  const insets = useSafeAreaInsets();
  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2);

  const renderTab = (tab: TabDef) => {
    const active = tab.key === activeTab;

    return (
      <Pressable
        key={tab.key}
        accessibilityRole="tab"
        accessibilityState={{selected: active}}
        onPress={() => onChange(tab.key)}
        style={({pressed}) => [styles.tab, pressed && styles.pressed]}>
        <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
          <Icon
            name={tab.icon}
            color={active ? colors.accent : colors.textDisabled}
            size={21}
          />
        </View>
        <Text style={[styles.label, active && styles.labelActive]}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.bar,
        {paddingBottom: insets.bottom, height: BAR_HEIGHT + insets.bottom},
      ]}>
      {leftTabs.map(renderTab)}

      <View style={styles.fabWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add expense"
          onPress={onFabPress}
          style={({pressed}) => [
            styles.fab,
            activeTab === 'ai' && styles.fabLow,
            pressed && styles.fabPressed,
          ]}>
          <Svg style={styles.fabBg} viewBox="0 0 60 60">
            <Defs>
              <LinearGradient id="fabGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#3B82F6" />
                <Stop offset="1" stopColor="#1D4ED8" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="60" height="60" rx="30" fill="url(#fabGrad)" />
          </Svg>
          <Icon name="add" color={colors.textPrimary} size={26} strokeWidth={2.4} />
        </Pressable>
      </View>

      {rightTabs.map(renderTab)}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    height: 28,
    minWidth: 40,
    borderRadius: radiusPill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(59,130,246,0.16)',
  },
  label: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textDisabled,
  },
  labelActive: {
    color: colors.accent,
  },
  fabWrap: {
    width: FAB_SIZE + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    top: -FAB_SIZE * 0.3,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background,
    elevation: 10,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  fabLow: {
    top: -FAB_SIZE * 0.1,
  },
  fabBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  fabPressed: {
    transform: [{scale: 0.94}],
  },
});
