import type { ConfigContext, ExpoConfig } from 'expo/config';

const isDevelopment = process.env.APP_VARIANT === 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isDevelopment ? 'Push (Dev)' : 'Push',
  slug: 'push',
  version: '1.0.0',
  platforms: ['ios', 'android'],
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: isDevelopment ? 'push-dev' : 'push',
  userInterfaceStyle: 'dark',
  ios: {
    bundleIdentifier: isDevelopment ? 'dpl8300.push.dev' : 'dpl8300.push',
    supportsTablet: false,
    icon: './assets/images/icon.png',
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: isDevelopment ? 'dpl8300.push.dev' : 'dpl8300.push',
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#000000',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    ['expo-dev-client', { launchMode: 'most-recent' }],
    [
      'expo-font',
      {
        android: {
          fonts: [
            {
              fontFamily: 'Orbitron',
              fontDefinitions: [
                {
                  path: './assets/fonts/Orbitron-Black.ttf',
                  weight: 900,
                },
              ],
            },
          ],
        },
        ios: {
          fonts: ['./assets/fonts/Orbitron-Black.ttf'],
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#040406',
        image: './assets/images/icon.png',
        imageWidth: 220,
        resizeMode: 'contain',
      },
    ],
    'expo-sqlite',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    ...config.extra,
    eas: {
      projectId: '7b581788-33be-4325-a38f-06eeec79ed78',
    },
  },
});
