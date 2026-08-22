import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Button} from '../components/Button';
import {Icon, IconName} from '../components/Icon';
import {RootNavigation} from '../navigation';
import {colors, radius, spacing} from '../theme';

interface Feature {
  icon: IconName;
  title: string;
  subtitle: string;
}

const FEATURES: Feature[] = [
  {
    icon: 'smartphone',
    title: 'Auto SMS tracking',
    subtitle: 'Bank transactions SMS se khud-ba-khud',
  },
  {
    icon: 'pieChart',
    title: 'Smart analytics',
    subtitle: 'Kahan kya kharcha — clear charts me',
  },
  {
    icon: 'bot',
    title: 'AI assistant',
    subtitle: 'Apne kharche ke baare me poochho',
  },
];

export const OnboardingScreen = () => {
  const navigation = useNavigation<RootNavigation>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <View style={styles.logoCircle}>
          <Icon name="bank" color={colors.accent} size={36} />
        </View>

        <Text style={styles.title}>Expense Tracker</Text>
        <Text style={styles.subtitle}>
          Apna paisa track karo, bina kuch manually add kiye.
        </Text>

        <View style={styles.features}>
          {FEATURES.map(feature => (
            <View key={feature.icon} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Icon name={feature.icon} color={colors.lightBlue} size={20} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>
                  {feature.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={() => navigation.navigate('OnboardingStart')}
        />
        <Text
          accessibilityRole="button"
          style={styles.skip}
          onPress={() => navigation.replace('Main')}>
          Skip
        </Text>
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
    backgroundColor: 'rgba(59,130,246,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
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
  features: {
    marginTop: spacing.xxxl,
    alignSelf: 'stretch',
    gap: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(59,130,246,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  featureSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textHint,
  },
  footer: {
    gap: spacing.md,
  },
  skip: {
    textAlign: 'center',
    fontSize: 15,
    color: colors.textHint,
    paddingVertical: spacing.sm,
  },
});
