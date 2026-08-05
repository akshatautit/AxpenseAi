import React, {useState} from 'react';
import {ScrollView, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button} from '../components/Button';
import {ParsedTransaction} from '../features/sms/types';
import {
  hasSmsPermission,
  requestSmsPermission,
} from '../features/sms/smsPermission';
import {readTransactionsFromSms} from '../features/sms/smsReader';
import {colors, radius, spacing} from '../theme';

export interface SmsDemoScreenProps {
  onBack: () => void;
}

export const SmsDemoScreen = ({onBack}: SmsDemoScreenProps) => {
  const [permission, setPermission] = useState(false);
  const [status, setStatus] = useState('idle');
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);

  const onCheck = async () => {
    setPermission(await hasSmsPermission());
  };

  const onGrant = async () => {
    setStatus('requesting');
    const granted = await requestSmsPermission();
    setPermission(granted);
    setStatus(granted ? 'granted' : 'denied');
  };

  const onRead = async () => {
    setStatus('reading');
    try {
      const result = await readTransactionsFromSms({limit: 200});
      setTransactions(result);
      setStatus(`done - ${result.length} transaction SMS found`);
    } catch (error) {
      setStatus(`error - ${(error as Error).message}`);
    }
  };

  const balanceTransactions = transactions.filter(
    (txn) => txn.balance !== undefined && txn.balance !== null,
  );

  const currentBalance = balanceTransactions[0]?.balance;

  const formattedBalance =
    currentBalance !== undefined && currentBalance !== null
      ? `₹${currentBalance.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : 'unknown';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Button title="← Back to home" variant="secondary" onPress={onBack} />

        <Text style={styles.title}>SMS Transaction Engine</Text>

        <Text style={styles.balance}>
          Current available balance: {formattedBalance}
        </Text>
        <Text style={styles.smallLine}>
          Balance found in {balanceTransactions.length} of{' '}
          {transactions.length} parsed transactions.
        </Text>

        <Text style={styles.line}>Permission: {String(permission)}</Text>
        <Text style={styles.line}>Status: {status}</Text>

        <Button title="Check permission" onPress={onCheck} />
        <Button title="Grant SMS permission" onPress={onGrant} style={styles.gap} />
        <Button title="Read & parse SMS" onPress={onRead} style={styles.gap} />

        <Text style={styles.section}>Parsed transactions</Text>

        {transactions.map((txn, index) => (
          <Text key={index} style={styles.line}>
            {JSON.stringify(txn)}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: spacing.xl,
    color: colors.textPrimary,
  },
  balance: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: spacing.md,
    color: colors.info,
  },
  line: {
    marginVertical: spacing.sm,
    color: colors.textSecondary,
    borderRadius: radius.md,
  },
  smallLine: {
    marginBottom: spacing.md,
    color: colors.textHint,
  },
  section: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: spacing.xl,
    color: colors.lightBlue,
  },
  gap: {
    marginTop: spacing.md,
  },
});
