# Missing Assets Report

Last updated: 12 July 2026

The current asset library is sufficient to build a complete first pass. “Procedural” means the production implementation will be made in Unity from supplied models, transforms, materials or particle systems rather than left non-functional.

| Requirement | Status | Plan |
|---|---|---|
| Player idle, movement, attack, hurt, death and victory | Supplied, import verification required | KayKit shared medium-rig animation collections plus Character Animations 1.1 |
| Enemy idle, attack, hurt and death | Supplied, import verification required | Skeletons use the compatible KayKit medium rig |
| Spell casting | Supplied, import verification required | Map the closest casting clip; keep combat timing independent of events |
| Dice rolling | Procedural | Animate/rotate the supplied D20 to a deterministic gameplay result |
| Treasure chest animation | Procedural | Animate lid transform and pair with supplied chest audio |
| Door opening animation | Procedural | Animate hinge/door transform and pair with supplied door audio |
| Combat, healing and damage effects | Supplied/adapted | Import particle sample package and create game-owned variants |
| UI sound effects | Partial | Derive restrained feedback from suitable supplied effects if dedicated UI clicks are absent |
| Combat sound effects | Supplied | Sword, bow, spell, impact and block libraries are present |
| Music | Partial | Environmental loops are present; no clearly identified melodic menu/battle/boss score |
| Environment ambience | Supplied | Forest, cave, interior, beach and sea loops in OGG and WAV |
| UI icons | Supplied | Paper UI icons plus two 96-image icon collections |
| Status-effect icons | Supplied/adapted | Select and colour-code transparent icons; always pair colour with shape/text |
| Portraits | Procedural | Render supplied character and enemy models to portrait textures |
| Suitable fonts | Supplied | Beholden family for display; Unity readable fallback for dense question copy if required |
| Controller button prompts | Missing, non-blocking | Use labelled text prompts initially; source a matching Xbox-style prompt set for final controller polish |
| Mobile/touch controls | Not required | WebGL keyboard/mouse is the first target |

## Optional improvements

- Dedicated loopable menu, exploration, battle, boss and victory music.
- A bespoke Bone King model. The planned adapted skeleton boss remains fully functional without it.
- Dedicated controller glyphs if controller support becomes a release requirement.
