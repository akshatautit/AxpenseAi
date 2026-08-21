import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {colors} from '../theme';

const DATA = [
  {key: 'J', value: 42},
  {key: 'F', value: 65},
  {key: 'M', value: 38},
  {key: 'A', value: 78},
  {key: 'M', value: 52},
  {key: 'J', value: 86},
  {key: 'J', value: 61},
  {key: 'A', value: 94},
  {key: 'S', value: 70},
  {key: 'O', value: 82},
  {key: 'N', value: 56},
  {key: 'D', value: 100},
];

const CHART_HEIGHT = 132;
const BAR_SLOT = 14;
const LABEL_HEIGHT = 16;

export const AnalyticsChart = () => {
  return (
    <View style={styles.wrap}>
      <Svg
        width="100%"
        height={CHART_HEIGHT}
        viewBox={`0 0 ${DATA.length * BAR_SLOT} ${CHART_HEIGHT}`}>
        <Defs>
          <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.lightBlue} />
            <Stop offset="1" stopColor={colors.primary} />
          </LinearGradient>
        </Defs>
        {DATA.map((item, index) => {
          const barHeight = (item.value / 100) * CHART_HEIGHT;
          const x = index * BAR_SLOT;
          const active = index === DATA.length - 1;
          return (
            <Rect
              key={`${item.key}-${index}`}
              x={x + 2}
              y={CHART_HEIGHT - barHeight}
              width={10}
              height={barHeight}
              rx={4}
              fill={active ? 'url(#barGrad)' : colors.secondaryCard}
            />
          );
        })}
      </Svg>
      <View style={styles.labels}>
        {DATA.map((item, index) => {
          const active = index === DATA.length - 1;
          return (
            <Text
              key={`${item.key}-${index}`}
              style={[
                styles.label,
                {left: index * BAR_SLOT},
                active && styles.labelActive,
              ]}>
              {item.key}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    height: CHART_HEIGHT + LABEL_HEIGHT,
  },
  labels: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: CHART_HEIGHT + 2,
    height: LABEL_HEIGHT,
  },
  label: {
    position: 'absolute',
    width: BAR_SLOT,
    fontSize: 9,
    fontWeight: '600',
    color: colors.textDisabled,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.lightBlue,
  },
});
