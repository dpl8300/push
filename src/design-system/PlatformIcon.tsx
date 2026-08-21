import { SymbolView, type SFSymbol } from 'expo-symbols';
import type { ComponentProps } from 'react';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type PlatformIconProps = Omit<ComponentProps<typeof SymbolView>, 'name'> & {
  ios: SFSymbol;
  android: string;
};

export function PlatformIcon({ ios, android, ...props }: PlatformIconProps) {
  return (
    <SymbolView
      {...props}
      name={{ ios, android } as SymbolName}
    />
  );
}

