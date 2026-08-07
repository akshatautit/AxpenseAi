import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Icon, IconName} from '../components/Icon';
import {colors, spacing} from '../theme';

export interface PlaceholderScreenProps {
  icon: IconName;
  title: string;
  subtitle?: string;
}

export const PlaceholderScreen = ({
  icon,
  title,
  subtitle,
}: PlaceholderScreenProps) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.center}>
      <View style={styles.iconCircle}>
        <Icon name={icon} color={colors.accent} size={34} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        {subtitle ?? 'Jald hi aa raha hai'}
      </Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(59,130,246,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.xl,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textDisabled,
  },
});
