import React, {useRef} from 'react';
import {Animated, Pressable, StyleSheet} from 'react-native';
import {colors} from '../theme';

export interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export const AppSwitch = ({value, onValueChange}: AppSwitchProps) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.secondaryCard, colors.primary],
  });
  const thumbLeft = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 27],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{checked: value}}
      onPress={() => onValueChange(!value)}
      style={styles.wrap}>
      <Animated.View style={[styles.track, {backgroundColor: trackColor}]}>
        <Animated.View
          style={[styles.thumb, {left: thumbLeft}]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    padding: 4,
  },
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 0,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.textPrimary,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
});
