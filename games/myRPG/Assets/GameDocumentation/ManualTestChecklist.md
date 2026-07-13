# Manual Test Checklist

## Project and build

- [ ] Project opens in Unity 6000.5.2f1 without errors.
- [ ] Boot scene is first in build settings and reaches Main Menu.
- [ ] Development and production WebGL builds complete.
- [ ] WebGL build loads from a local HTTP server and from the Game Lab wrapper.
- [ ] Browser console contains no recurring errors.

## New game and saves

- [ ] Each class can create a named adventure in each of three slots.
- [ ] Save title uses `[Name]’s Great Adventure`.
- [ ] Manual save and all autosave points survive an application/browser restart.
- [ ] Backup recovery handles a deliberately corrupt primary save.
- [ ] Deleting or overwriting a slot requires confirmation.

## Exploration and content

- [ ] Movement, camera, interaction, pause and prompts work at supported resolutions.
- [ ] Chests, doors, checkpoints, hazards and collectibles persist correctly.
- [ ] Each chapter objective can be completed without a soft-lock.
- [ ] One companion joins after each chapter and appears in later combat.

## Combat, dice and education

- [ ] Every action completes even when an animation or sound reference is missing.
- [ ] Victory, defeat, retry and flee paths restore a valid game state.
- [ ] D20 results stay within 1–20 and visually match the controlled result.
- [ ] Attribute/equipment bonuses are displayed and included exactly once.
- [ ] Arithmetic questions match the configured age level and never divide by zero.
- [ ] Timers can be disabled; wrong answers show the correct method and grant no Focus.
- [ ] Retry works only when the appropriate power-up is available.
- [ ] Chapter review totals match recorded responses and grades A–F correctly.

## Presentation and accessibility

- [ ] UI is usable at 1280×720, 1920×1080 and a narrow browser viewport.
- [ ] Keyboard focus, mouse input and controller navigation do not activate buttons twice.
- [ ] Large text, high contrast, reduced motion, audio sliders and timer settings persist.
- [ ] Status effects remain distinguishable without relying on colour alone.
- [ ] No important text clips and all mathematical symbols render correctly.
