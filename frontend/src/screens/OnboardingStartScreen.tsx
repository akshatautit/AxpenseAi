import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Button} from '../components/Button';
import {Icon} from '../components/Icon';
import {RootNavigation} from '../navigation';
import {colors, radius, spacing} from '../theme';

export const OnboardingStartScreen = () => {
  const navigation = useNavigation<RootNavigation>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <View style={styles.logoCircle}>
          <Icon name="zap" color={colors.aiHighlight} size={36} />
        </View>

        <Text style={styles.title}>Ready to start?</Text>
        <Text style={styles.subtitle}>
          SMS permission do — app aapke kharche ko sambhal lega.
          Transactions, analytics aur AI insights sab kuch ek jagah.
        </Text>

        <View style={styles.notes}>
          <View style={styles.noteRow}>
            <Icon name="lock" color={colors.income} size={18} />
            <Text style={styles.noteText}>
              Data sirf aapke device par hi rahta hai
            </Text>
          </View>
          <View style={styles.noteRow}>
            <Icon name="database" color={colors.lightBlue} size={18} />
            <Text style={styles.noteText}>
              SMS ke dawai se automatic transaction parsing
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Get Started"
          onPress={() => navigation.replace('Main')}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(139,92,246,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.xl,
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  notes: {
    marginTop: spacing.xxxl,
    alignSelf: 'stretch',
    gap: spacing.lg,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    gap: spacing.md,
  },
});
