# MyRPG Design Assumptions

Last updated: 12 July 2026

## Confirmed direction

- Audience: ages 8–12, centred on arithmetic at approximately age-ten level.
- Delivery: Unity WebGL embedded in the Sticks Tuition Game Lab; the editable Unity project remains the source deliverable.
- Camera: fixed-angle isometric exploration with player-relative movement.
- Combat: fixed cinematic positions and turn-based commands.
- Party: the player selects a class, then rescues one companion per chapter, to a maximum of three companions.
- Content pass: one adventure comprising three released chapters, each targeting 10–20 minutes.
- Education: arithmetic only in this pass. Questions are timed. An incorrect answer reveals the solution and grants no Focus. A retry requires an item or ability.
- Dice: controlled random D20 results modified by character attributes, equipment, preparation and temporary maths bonuses.
- Presentation: colourful cartoon fantasy, text dialogue, model-rendered portraits and the Beholden font for display text.
- Reporting: an encouraging end-of-chapter review with an A–F rating and supporting statistics.

## Implementation assumptions

- Unity 6000.5.2f1 is the project version because no Unity project existed before development and this editor is installed locally.
- The built-in render pipeline is used initially for broad compatibility with the supplied low-poly assets, the particle package and WebGL.
- Unity's built-in input APIs are the Phase 1 compatibility baseline because Input System 1.14.2 does not compile against Unity 6000.5.2f1. Input remains isolated behind game-owned components so a compatible Input System release can replace it later.
- Keyboard and mouse are required. Controller navigation is supported where practical. Touch controls are out of scope for this pass.
- Numerical and multiple-choice questions are the initial input types.
- Local versioned JSON saves use three slots, atomic replacement and a backup file. PlayerPrefs is reserved for small settings.
- Character classes in the first pass are Knight, Mage, Ranger and Rogue. The Barbarian model may be used for a companion.
- Existing models will be rendered to textures for portraits rather than requiring separate portrait art.
- The Bone King will be adapted from the skeleton roster with a distinctive scale, crown/equipment, material treatment and effects.
- The supplied ambience loops may substitute for melodic score until dedicated music is supplied.
- Required effects not covered by the particle package will use documented Unity particle-system adaptations.

## Content and safety

- No gore, online features, accounts, multiplayer, advertising, microtransactions or user-generated content.
- Incorrect answers are instructional rather than punitive and never remove earned progression.
- Chapter grades describe the current session and are paired with constructive topic feedback.
