export const UI_CONFIG = {
  colors: {
    primary: '#2E7D32', // Tactical Green
    secondary: '#1B5E20', // Darker Green
    accent: '#EF6C00', // Alert Orange
    success: '#34C759', 
    danger: '#B71C1C', // Military Red
    warning: '#F57F17',
    info: '#0277BD',
    light: '#262626', // Dark Surface
    dark: '#0A0A0A', // Tactical Black
    white: '#FFFFFF',
    black: '#000000',
    background: '#0A0A0A',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
    glass: 'rgba(255, 255, 255, 0.05)',
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
