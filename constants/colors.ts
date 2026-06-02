/**
 * Communism Theme Color Palette
 * Manages all colors centrally for both Light and Dark modes.
 */

export const lightColors = {
  // Theme Accent & Status Colors
  primary: '#DA251D',       // Vibrant Red (Communist Flag)
  secondary: '#C62828',     // Darker Red
  accent: '#FFDE00',        // Gold/Yellow (Star)
  success: '#2E7D32',       // Green Success
  danger: '#B71C1C',        // Dark Red Error
  warning: '#F57F17',       // Yellow Warning
  info: '#0277BD',          // Blue Info

  // Neutral Theme Colors (Light Theme Base & Surfaces)
  background: '#F5F5F5',    // Light Gray (Main App Background)
  surface: '#FFFFFF',       // White Surface (Cards, Modals, Input fields)
  surfaceLighter: '#FAFAFA',// Slightly lighter gray for active elements
  border: '#EBEBEB',        // Subtle light border color

  // Text Colors
  text: '#333333',          // Primary Text (Dark Gray)
  textSecondary: '#757575', // Muted text color for secondary labels
  textDark: '#0A0A0A',      // Darkest text
  textLight: '#FFFFFF',     // White text for primary buttons/headers

  // Standard Colors
  white: '#FFFFFF',
  black: '#000000',
  glass: 'rgba(255, 255, 255, 0.8)',
};

export const darkColors = {
  // Theme Accent & Status Colors
  primary: '#D32F2F',       // Deep Red
  secondary: '#B71C1C',     // Darker Red
  accent: '#FBC02D',        // Muted Gold
  success: '#388E3C',       // Green Success
  danger: '#D32F2F',        // Dark Red Error
  warning: '#FBC02D',       // Yellow Warning
  info: '#0288D1',          // Blue Info

  // Neutral Theme Colors (Dark Theme Base & Surfaces)
  background: '#121212',    // Very dark gray/black
  surface: '#1E1E1E',       // Dark gray cards
  surfaceLighter: '#2C2C2C',// Slightly lighter dark gray
  border: '#333333',        // Dark borders

  // Text Colors
  text: '#FFFFFF',          // Primary Text (White)
  textSecondary: '#AAAAAA', // Muted light gray text
  textDark: '#0A0A0A',      // Dark text
  textLight: '#FFFFFF',     // White text

  // Standard Colors
  white: '#FFFFFF',
  black: '#000000',
  glass: 'rgba(0, 0, 0, 0.5)',
};

// Default export for static usages (defaults to light mode)
export const colors = lightColors;
