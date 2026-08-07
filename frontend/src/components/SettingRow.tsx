import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Icon, IconName} from './Icon';
import {AppSwitch} from './AppSwitch';
import {colors, spacing} from '../theme';

export interface SettingRowProps {
  icon: IconName;
  iconColor?: string;
  title: string;
  value?: string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  toggleValue?: boolean;
  last?: boolean;
}

export const SettingRow = ({
  icon,
  iconColor = colors.accent,
  title,
  value,
  onPress,
  onToggle,
  toggleValue,
  last,
}: SettingRowProps) => {
  return (
    <Pressable
      accessibilityRole={onToggle ? 'switch' : 'button'}
      accessibilityState={onToggle ? {checked: toggleValue} : undefined}
      onPress={onToggle ? undefined : onPress}
      style={({pressed}) => [
        styles.row,
        !last && styles.rowBorder,
        pressed && onToggle === undefined && styles.pressed,
      ]}>
      <View style={[styles.iconWrap, {backgroundColor: `${iconColor}1A`}]}>
        <Icon name={icon} color={iconColor} size={17} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {onToggle ? (
        <AppSwitch value={!!toggleValue} onValueChange={onToggle} />
      ) : (
        <Icon name="chevronRight" color={colors.textDisabled} size={16} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    minHeight: 62,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  value: {
    marginLeft: spacing.sm,
    maxWidth: '42%',
    fontSize: 13,
    fontWeight: '500',
    color: colors.textHint,
  },
});
