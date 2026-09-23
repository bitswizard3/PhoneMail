export const theme = {
  colors: {
    // Desktop-inspired Dark Indigo theme
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: 'rgba(99, 102, 241, 0.12)',
    accent: '#06b6d4',
    accentLight: 'rgba(6, 182, 212, 0.12)',

    // Backgrounds
    background: '#0a0a0f',
    surface: '#16161e',
    surfaceElevated: '#222230',
    surfaceHighlight: '#1e1e2a',
    
    // Text
    textPrimary: '#f1f1f4',
    textSecondary: '#9ca3af',
    textTertiary: '#6b7280',
    textInverse: '#0a0a0f',

    // Borders
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.14)',

    // Status
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',

    // Chat
    chatBubbleSent: '#4f46e5',
    chatBubbleReceived: '#16161e',
    chatBubbleSentText: '#f1f1f4',
    chatBubbleReceivedText: '#f1f1f4',

    // Misc
    unreadBadge: '#6366f1',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  typography: {
    h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    bodySmall: { fontSize: 14, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
    label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;
