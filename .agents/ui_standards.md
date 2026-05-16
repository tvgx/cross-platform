# UI STANDARDS & COMPONENTS
## Design Tokens
- Colors: `bg: #0A0A0A`, `surface: #1A1A1A`, `primary: #2E7D32`, `accent: #EF6C00`.
- Shadows: Glassmorphism (blur: 10, color: rgba(255,255,255,0.05)).

## Components Spec
- `TacticalButton`: 
    - Props: `text`, `icon`, `onPress`, `type` (filled|outline|ghost).
    - Style: Heavy font-weight, uppercase, haptic feedback on press.
- `StatusBadge`:
    - Logic: If `sync_status === 'pending'` -> Pulse animation + Orange color.
    - If `sync_status === 'synced'` -> Static Green check icon.

## Screen Layouts
- Use `SafeArea` for all screens.
- `Header`: Dynamic title + Right action (Cart/Sync Status).
- `TacticalList`: Use `FlashList` for high performance with heavy media.
