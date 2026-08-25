import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { APP_URLS } from '@/config/app-urls';
import { Colors } from '@/design-system/tokens';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

export function ProgressComplianceFooter() {
  const [linkError, setLinkError] = useState<string | null>(null);

  const openLink = async (url: string) => {
    try {
      setLinkError(null);
      await Linking.openURL(url);
    } catch {
      setLinkError('Unable to open the link. Please try again.');
    }
  };

  return (
    <View accessibilityLabel="App information" style={styles.footer}>
      <View style={styles.content}>
        <Text style={styles.localData}>Your push-up history stays on this device.</Text>
        <View style={styles.metadata}>
          <FooterLink
            accessibilityLabel="Open Privacy Policy"
            label="Privacy Policy"
            onPress={() => void openLink(APP_URLS.privacyPolicy)}
          />
          <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.dot}>•</Text>
          <FooterLink
            accessibilityLabel="Open Support"
            label="Support"
            onPress={() => void openLink(APP_URLS.support)}
          />
          <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.dot}>•</Text>
          <Text style={styles.version}>Version {appVersion}</Text>
        </View>
      </View>
      {linkError ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>{linkError}</Text>
      ) : null}
    </View>
  );
}

function FooterLink({
  accessibilityLabel,
  label,
  onPress,
}: {
  accessibilityLabel: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
    >
      <Text style={styles.linkLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingTop: 3,
    paddingBottom: 5,
  },
  content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 12,
    rowGap: 3,
  },
  localData: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  link: {
    borderRadius: 5,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  linkPressed: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    opacity: 0.72,
  },
  linkLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  dot: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
  },
  version: {
    color: 'rgba(255,255,255,0.34)',
    fontSize: 11,
    lineHeight: 16,
  },
  error: {
    color: Colors.coral,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
    textAlign: 'center',
  },
});
