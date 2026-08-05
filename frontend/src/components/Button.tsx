import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {colors, radius, spacing} from '../theme';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: ButtonProps) => {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text
        style={[
          styles.text,
          isPrimary ? styles.primaryText : styles.secondaryText,
          disabled && styles.disabledText,
        ]}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.card,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{scale: 0.98}],
  },
  disabled: {
    backgroundColor: colors.secondaryCard,
    borderColor: colors.border,
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: colors.textPrimary,
  },
  secondaryText: {
    color: colors.accent,
  },
  disabledText: {
    color: colors.textDisabled,
  },
});
