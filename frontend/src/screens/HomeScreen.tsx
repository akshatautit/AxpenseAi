import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button} from '../components/Button';
import {colors, radius, spacing} from '../theme';

export interface HomeScreenProps {
  onOpenSmsDemo: () => void;
}

export const HomeScreen = ({onOpenSmsDemo}: HomeScreenProps) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>AXPENSE</Text>
        <Text style={styles.tagline}>
          Bank SMS se apna expense track karo
        </Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Total balance</Text>
        <Text style={styles.heroValue}>₹—</Text>
        <Text style={styles.heroHint}>
          Balance naya bank SMS aate hi update hoga
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>

        <Button
          title="Scan bank SMS"
          variant="primary"
          onPress={onOpenSmsDemo}
        />

        <Button
          title="Add expense"
          variant="secondary"
          disabled
          style={styles.secondaryButton}
        />
      </View>

      <Text style={styles.footer}>
        SMS engine: read • parse • balance
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },
  header: {
    marginTop: spacing.md,
  },
  brand: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    color: colors.lightBlue,
  },
  tagline: {
    marginTop: spacing.sm,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hero: {
    marginTop: spacing.xxxl,
    padding: spacing.xxl,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroLabel: {
    fontSize: 13,
    color: colors.textHint,
  },
  heroValue: {
    marginTop: spacing.sm,
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  heroHint: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.xxxl,
  },
  sectionTitle: {
    marginBottom: spacing.lg,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  secondaryButton: {
    marginTop: spacing.md,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.xxl,
    textAlign: 'center',
    fontSize: 12,
    color: colors.textDisabled,
  },
});
