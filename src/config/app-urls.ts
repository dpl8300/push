export const APP_URLS = {
  website: 'https://dpl8300.github.io/push/',
  privacyPolicy: 'https://dpl8300.github.io/push/privacy/',
  support: 'https://dpl8300.github.io/push/support/',
} as const satisfies Record<'website' | 'privacyPolicy' | 'support', `https://${string}`>;

export type AppUrlKey = keyof typeof APP_URLS;
