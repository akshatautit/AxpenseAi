import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {colors, radius, spacing} from '../theme';

export interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const SectionCard = ({
  title,
  subtitle,
  children,
  style,
}: SectionCardProps) => (
  <View style={styles.wrap}>
    {(title || subtitle) && (
      <View style={styles.header}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    )}
    <View style={[styles.card, style]}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textHint,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
});
