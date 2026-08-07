import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {colors} from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export const ProgressRing = ({
  value,
  size = 120,
  strokeWidth = 10,
  color = colors.accent,
  trackColor = colors.secondaryCard,
  children,
}: ProgressRingProps) => {
  const progress = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: Math.min(Math.max(value, 0), 1),
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [value, progress]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference * (1 - Math.min(Math.max(value, 0), 1))],
  });

  return (
    <View style={{width: size, height: size}}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
