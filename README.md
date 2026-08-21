# Push

Push is a local-first push-up tracker built with Expo SDK 57, React Native, and
strict TypeScript. The original SwiftUI prototype is preserved in
[`legacy-ios`](./legacy-ios).

## Local prerequisites

The repository is ready, but native compilation requires local platform tools:

1. Install Node.js 24 LTS, pnpm 11, and CocoaPods.
2. Select stable Xcode:
   `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
3. Open Xcode once, accept its license, and install an iOS Simulator runtime.
4. For Android, install Android Studio, JDK 17, Android SDK Platform 36, Build
   Tools, Platform Tools, and a phone emulator.
5. Configure `JAVA_HOME`, `ANDROID_HOME`, and `ANDROID_SDK_ROOT` as described in
   Expo's Android setup guide.

This Mac already has those tools installed. Its paths are stored in an ignored
`.env.local`, so the commands below work without editing the global shell profile.
On another machine, create the equivalent local file or export the variables in
your shell.

Expo Go and an Expo account are not required for the local Development Build
workflow.

## Install and run

```bash
pnpm install
pnpm ios             # iOS Simulator
pnpm ios:device      # connected iPhone
pnpm android         # Android emulator
pnpm android:device  # connected Android phone
```

After the Development Build is installed, use `pnpm start` for normal TypeScript
and UI iteration. The command advertises the app's `push-dev` URL scheme. Rebuild
only after changing native dependencies or app config.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
```

The generated `ios/` and `android/` directories are intentionally ignored. App
identity is controlled by `APP_VARIANT`: development builds use `Push (Dev)` and
`dpl8300.push.dev`; production uses `Push` and `dpl8300.push`.
