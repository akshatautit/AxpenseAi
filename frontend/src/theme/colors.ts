/**
 * Design tokens — Blue-first premium fintech palette.
 * Source: design system spec (Linear/Revolut/Stripe/CRED style).
 */
export const colors = {
  // Primary blue palette
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  accent: '#3B82F6',
  lightBlue: '#60A5FA',

  // Dark theme surfaces
  background: '#050816',
  surface: '#0F172A',
  card: '#162033',
  secondaryCard: '#1E293B',
  border: '#2C3A4F',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#CBD5E1',
  textHint: '#94A3B8',
  textDisabled: '#64748B',

  // Status
  income: '#22C55E',
  expense: '#EF4444',
  warning: '#F59E0B',
  info: '#38BDF8',
  aiHighlight: '#8B5CF6',

  // Charts
  chartBlue1: '#2563EB',
  chartBlue2: '#3B82F6',
  chartBlue3: '#60A5FA',
  chartPurple: '#8B5CF6',
  chartOrange: '#F59E0B',
  chartCyan: '#06B6D4',

  // Misc
  cardShadow: 'rgba(0,0,0,0.25)',
  transparent: 'transparent',
} as const;
