# Push physical-device QA

Run this checklist on at least one current iPhone and one current Android phone.

## Visual

- PUSH renders in the bundled Eurostile Extended Black font.
- App icon and splash artwork retain their original proportions and colors.
- Background is near-black with pink top-right and orange bottom-left glows.
- Header, total, motivation, chart, stats, quick-add buttons, and tab bar fit
  without clipping on compact and large portrait phones.
- The graph always shows seven days, uses the center-left-right square fill order,
  and marks today with a white weekday circle and count badge.
- Progress and Settings switch correctly and return to Home without resetting data.

## Behavior and persistence

- A fresh production install starts at zero without demo records; development builds reset
  to seven graph days with today and one earlier day at zero whenever the database starts.
- +1, +5, +10, and +25 update the count and graph sequentially.
- Rapid repeated taps cannot start overlapping additions.
- Custom Amount accepts 1–250 and rejects 0, 251, decimals, signs, and letters.
- Force-closing and reopening the app preserves the total and history.
- Advancing to a new calendar day preserves the streak and creates the new day.

## Haptics and motion

- Each added rep produces a light impact on a physical device.
- +10 and +25 have five-rep milestone accents.
- +5/+10 finish with a medium impact; +25 finishes with a rigid impact.
- Buttons compress on touch, new squares pulse, and the active column glows.
- Animations remain smooth with a +250 custom addition.
