/**
 * Design Tokens - سیستم طراحی مرکزی
 * تمام رنگ‌ها، فاصله‌ها، تایپوگرافی و سایر توکن‌های طراحی در این فایل تعریف می‌شوند
 */

export const designTokens = {
  // ========================================
  // رنگ‌ها (Colors)
  // ========================================
  colors: {
    // Primary - رنگ اصلی (آبی)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },

    // Secondary - رنگ ثانویه (خاکستری)
    secondary: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },

    // Success - موفقیت (سبز)
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },

    // Warning - هشدار (زرد/نارنجی)
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },

    // Error - خطا (قرمز)
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },

    // Info - اطلاعات (آبی روشن)
    info: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },

    // Purple - بنفش (برای MBTI و غیره)
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },

    // Amber - کهربایی (برای Status)
    amber: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },

    // Background & Foreground
    background: {
      light: '#ffffff',
      dark: '#0a0a0a',
    },
    foreground: {
      light: '#171717',
      dark: '#ededed',
    },
  },

  // ========================================
  // فاصله‌ها (Spacing)
  // ========================================
  spacing: {
    0: '0',
    1: '0.25rem',    // 4px
    2: '0.5rem',     // 8px
    3: '0.75rem',    // 12px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    8: '2rem',       // 32px
    10: '2.5rem',    // 40px
    12: '3rem',      // 48px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
    32: '8rem',      // 128px
  },

  // ========================================
  // تایپوگرافی (Typography)
  // ========================================
  typography: {
    fontFamily: {
      primary: '"Vazirmatn", "Tahoma", "Iranian Sans", sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  // ========================================
  // سایه‌ها (Shadows)
  // ========================================
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // ========================================
  // شعاع‌ها (Border Radius)
  // ========================================
  borderRadius: {
    none: '0',
    sm: '0.125rem',    // 2px
    base: '0.25rem',   // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    full: '9999px',
  },

  // ========================================
  // انیمیشن‌ها (Animations)
  // ========================================
  transitions: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  },

  // ========================================
  // Z-Index
  // ========================================
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },

  // ========================================
  // Breakpoints
  // ========================================
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// ========================================
// Helper Types
// ========================================
export type ColorScale = keyof typeof designTokens.colors.primary;
export type ColorName = keyof typeof designTokens.colors;
export type SpacingSize = keyof typeof designTokens.spacing;
export type FontSize = keyof typeof designTokens.typography.fontSize;

// ========================================
// Helper Functions
// ========================================

/**
 * دریافت رنگ از پالت
 * @example getColor('primary', 500) => '#3b82f6'
 */
export function getColor(color: ColorName, scale?: ColorScale): string {
  const colorPalette = designTokens.colors[color];
  if (!scale) {
    // اگر scale داده نشده، رنگ پیش‌فرض (500 یا light/dark) را برگردان
    if ('light' in colorPalette) {
      return (colorPalette as any).light;
    }
    return (colorPalette as any)[500] || Object.values(colorPalette)[0];
  }
  return (colorPalette as any)[scale];
}

/**
 * دریافت فاصله
 * @example getSpacing(4) => '1rem'
 */
export function getSpacing(size: SpacingSize): string {
  return designTokens.spacing[size];
}

/**
 * دریافت سایه
 * @example getShadow('md') => '0 4px 6px...'
 */
export function getShadow(size: keyof typeof designTokens.shadows): string {
  return designTokens.shadows[size];
}

/**
 * کلاس‌های Tailwind برای حالت‌های مختلف Badge
 */
export const badgeVariants = {
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
  secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200',
  success: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
  error: 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200',
  info: 'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
} as const;

/**
 * کلاس‌های Tailwind برای دکمه‌ها
 */
export const buttonVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white',
  secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white',
  success: 'bg-success-600 hover:bg-success-700 text-white',
  warning: 'bg-warning-600 hover:bg-warning-700 text-white',
  error: 'bg-error-600 hover:bg-error-700 text-white',
  outline: 'border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800',
  ghost: 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800',
} as const;

/**
 * کلاس‌های Tailwind برای Input
 */
export const inputVariants = {
  default: 'border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
  error: 'border border-error-500 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-error-500 focus:border-error-500',
} as const;

/**
 * کلاس‌های Tailwind برای Card
 */
export const cardVariants = {
  default: 'bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700',
  elevated: 'bg-white dark:bg-secondary-800 rounded-lg shadow-lg',
  flat: 'bg-white dark:bg-secondary-800 rounded-lg',
} as const;
