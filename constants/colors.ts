/**
 * Premium Tactical Military Theme Color Palette
 * Manages all colors centrally to prevent display overlap (e.g. white text on white background)
 */
export const colors = {
  // Theme Accent & Status Colors
  primary: '#2E7D32',       // Tactical Green (Primary Brand)
  secondary: '#1B5E20',     // Darker Green (Secondary Brand)
  accent: '#EF6C00',        // Alert Orange (Attention)
  success: '#34C759',       // Military Green Success
  danger: '#B71C1C',        // Military Red (Danger/Errors)
  warning: '#F57F17',       // Yellow Warning
  info: '#0277BD',          // Tactical Blue Info

  // Neutral Theme Colors (Dark Theme Base & Surfaces)
  background: '#0A0A0A',    // Tactical Black (Main App Background)
  surface: '#1A1A1A',       // Dark Gray Surface (Cards, Modals, Input fields, Sidebars)
  surfaceLighter: '#262626',// Slightly lighter gray for active elements / item hover state
  border: '#2A2A2A',        // Subtle dark border color

  // Text Colors
  text: '#FFFFFF',          // Primary Text (White) - perfectly visible on 'surface' and 'background'
  textSecondary: '#B0B0B0', // Muted text color for secondary labels/hints
  textDark: '#0A0A0A',      // Dark text for light elements (e.g., success buttons, badges)

  // Standard Colors
  white: '#FFFFFF',
  black: '#000000',
  glass: 'rgba(255, 255, 255, 0.05)',
};
