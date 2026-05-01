export const UI_CONFIG = {
  colors: {
    primary: '#007AFF', // Blue
    secondary: '#5856D6', // Purple
    success: '#34C759', // Green
    danger: '#FF3B30', // Red
    warning: '#FF9500', // Orange
    info: '#5AC8FA', // Light Blue
    light: '#F2F2F7', // Light Gray
    dark: '#1C1C1E', // Dark Gray
    white: '#FFFFFF',
    black: '#000000',
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#E5E5EA',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      bold: '700' as const,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    round: 9999,
  },
};
