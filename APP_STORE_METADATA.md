# Push Daily — App Store metadata

Use the recommended entries for the first submission. Alternate copy is included so the listing can
shift toward motivation or privacy without inventing unsupported features.

## Product identity and URLs

- App Store name: `Push Daily`
- Installed app name: `Push`
- Bundle ID: `dpl8300.push`
- Version: `1.0.0`
- Primary category: `Health & Fitness`
- Secondary category: `Lifestyle`
- Price: `Free`
- Availability: All supported countries and regions
- Marketing URL: `https://dpl8300.github.io/push/`
- Support URL: `https://dpl8300.github.io/push/support/`
- Privacy Policy URL: `https://dpl8300.github.io/push/privacy/`
- Copyright: `2026 Daniel Phan Leavitt`

## Subtitle options

1. **Recommended:** `Make every push-up count` (24 characters)
2. `Build a stronger daily habit` (28 characters)
3. `Simple push-up habit tracker` (28 characters)

## Promotional text options

1. **Recommended:** `Build your daily push-up habit with one-tap logging, a seven-day graph, streaks, lifetime stats, and a full progress calendar.`
2. `One rep or a full set—log it in seconds, keep your streak alive, and watch your consistency grow over time.`
3. `No account. No ads. No analytics. Just a focused, private push-up tracker that keeps your history on your device.`

## Description option 1 — Focused (recommended)

Build a push-up habit one rep at a time.

Push Daily is a fast, focused push-up tracker designed to stay out of your way. Log a single rep or an entire set, see today's total change instantly, and follow your consistency over time.

• Add 1, 5, 10, or 25 push-ups with one tap
• Enter a custom set when you need it
• See your latest seven days at a glance
• Explore and adjust your history in a full progress calendar
• Track your streak, lifetime total, best day, and daily average
• Keep your history privately on your device
• No account required

Whether you're starting with one push-up or building toward a bigger daily goal, Push Daily makes every rep count.

## Description option 2 — Motivational

Consistency starts with one rep.

Push Daily helps you turn push-ups into a habit without adding friction to your workout. Tap to record a set, watch your week take shape, and use your streak and progress calendar to keep showing up.

Quick logging lets you add common set sizes instantly or enter a custom amount. Your home dashboard shows today's total, recent activity, lifetime push-ups, best day, daily average, and active days. Open Progress to explore your calendar or correct an earlier count.

There are no accounts, feeds, or distractions—just a clear record of the work you put in.

Do one. Do another tomorrow. Keep pushing.

## Description option 3 — Privacy-first

A private push-up tracker that works without an account.

Push Daily stores your history locally on your device. There are no ads, analytics, profiles, or cloud accounts. Open the app, record your reps, and get back to your day.

Use one-tap buttons for common set sizes or enter a custom amount. Follow your current streak and seven-day graph from Home, then open Progress for monthly totals, active days, your best day, and an adjustable calendar history.

Your push-up data stays with you on your device. Simple tracking, useful progress, and nothing extra.

## Keyword options

Each set is within Apple's 100-character limit. Use one set, not all three.

1. **Recommended (80 characters):** `pushups,fitness,workout,habit,tracker,strength,reps,streak,training,calisthenics`
2. **Goals (80 characters):** `exercise,daily,goals,progress,home workout,bodyweight,routine,rep counter,health`
3. **Search variants (83 characters):** `push-up counter,daily fitness,strength tracker,streaks,repetition,workout log,habit`

## App privacy and compliance

- App Privacy answer: `No, we do not collect data from this app.`
- Privacy Policy URL: use the URL above and publish the response.
- Tracking: None.
- Advertising: None.
- Accounts: None.
- Export compliance: the app does not use non-exempt encryption; this is declared in the binary.
- Content rights: the app does not contain or access third-party content.
- Age rating: answer `None` for objectionable-content and capability questions that do not apply; use the lowest rating App Store Connect calculates.
- Regulated medical-device declaration: this is a general fitness tracker, not a medical device and it makes no diagnosis or treatment claims.

## App Review information

- Sign-in required: `No`
- Contact: use the private email address and phone number associated with the developer account.
- Review notes:

  `Push Daily is a local-first push-up tracker. No sign-in is required. Push-up counts and history are stored only in the app's local database; the app does not collect user data or include analytics or advertising. From Home, tap “See more progress.” The bottom of the Progress page contains the in-app Privacy Policy and Support links.`

## Screenshot order

1. `store-assets/screenshots/01-home.jpg` — Home dashboard with an active daily total
2. `store-assets/screenshots/02-progress.jpg` — Progress calendar and selected-day controls

Both files are 1206 × 2622 portrait screenshots for the iPhone 17 Pro display class. JPEG copies are
used because App Store screenshots cannot contain alpha channels.

## Release build and submission

Before building, verify that the GitHub Pages URLs above load publicly, then run:

```bash
pnpm check
pnpm dlx eas-cli@latest build --platform ios --profile production --auto-submit
```

After Apple processes the build, select the newest build in App Store Connect, paste the recommended
metadata, upload the two screenshots in the documented order, choose automatic release, click **Add
for Review**, and submit the draft from the App Review section.
