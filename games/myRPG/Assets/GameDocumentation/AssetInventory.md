# Asset Inventory

Last updated: 12 July 2026

Raw third-party files remain in `rpgassets` outside Unity's `Assets` directory. Only chosen production formats will be copied into `Assets/ThirdParty`; adapted materials, controllers and prefabs belong under `Assets/Game`.

| Asset group | Raw location | Intended use | Readiness | Animation | Materials/textures | Commercial status |
|---|---|---|---|---|---|---|
| KayKit Adventurers 2.0 | `rpgassets/KayKit_Adventurers_2.0_FREE` | Knight, Mage, Ranger, Rogue and Barbarian player/companion models; weapons and props | Production-ready after Unity import/rig setup | Shared General and MovementBasic FBX collections | Character textures included | CC0 |
| KayKit Skeletons 1.1 | `rpgassets/KayKit_Skeletons_1.1_FREE` | Minion, Rogue, Warrior and Mage enemies; weapons; Bone King base | Production-ready after rig setup | Compatible shared medium-rig collections | Skeleton texture included | CC0 |
| KayKit Character Animations 1.1 | `rpgassets/KayKit_Character_Animations_1.1` | Expanded movement, combat and reaction library | Import verification required | 16 FBX animation files plus alternate formats | Not applicable | User confirmed free to use |
| KayKit Dungeon Remastered 1.1 | `rpgassets/KayKit_DungeonRemastered_1.1_FREE` | Crypt, keep, traps, doors, chests, floors, walls, torches and props | Production-ready modular environment | Static; moving pieces configured in Unity | Atlas texture included | CC0 |
| KayKit Medieval Hexagon 1.0 | `rpgassets/KayKit_Medieval_Hexagon_Pack_1.0_FREE` | Isometric overworld, village, road, terrain, buildings and nature | Production-ready modular environment | Static | Atlas texture included | CC0 |
| KayKit Halloween Bits 1.0 | `rpgassets/KayKit_HalloweenBits_1.0_FREE` | Crypt dressing, graves, dead trees and spooky props | Production-ready | Static | Texture included | CC0 |
| KayKit Fantasy Weapons Bits 1.0 | `rpgassets/KayKit_FantasyWeaponsBits_1.0_FREE` | Equipment variants and loot | Production-ready | Static equipment | Texture included | CC0 |
| KayKit Board Game Bits 1.0 | `rpgassets/KayKit_BoardGameBits_1.0_FREE` | D20 and other dice, tokens, coins and player-card props | Production-ready; deterministic die animation needed | Static models | Colour textures included | CC0 |
| Paper UI kit | `rpgassets/PNGs` | Menus, buttons, bars, loading, save slots and dialogue panels | Production-ready PNGs; configure slicing and nine-slice borders | UI transitions created in Unity | PNGs and PSD sources included | User confirmed free to use |
| Icon collections | `rpgassets/PNG (Transparent)` and `PNG (Black background)` | Combat, inventory, stats, maths and status icons | Transparent set preferred; map semantics during UI implementation | None | 96 transparent and 96 black-background images | User confirmed free to use |
| Beholden font family | `rpgassets/Beholden-*.ttf` | Game title, headings and concise labels | Production-ready; verify mathematical glyph coverage | None | Six TTF styles | User confirmed free to use |
| Free Fantasy SFX by TomMusic | `rpgassets/Free Fantasy SFX Pack By TomMusic` | Combat, footsteps, doors, chests, spells, torches and ambience | Production-ready; OGG preferred for WebGL | None | 204 OGG and 204 WAV files | User confirmed free to use; readme retained |
| Particle sample package | `rpgassets/Unity samples/particlePack_samples.unitypackage` | Base VFX for spells, hits, healing and feedback | Requires safe package import and reference audit | Particle animation | Package-contained materials/textures | User confirmed free to use |

## Duplicate and compatibility findings

- KayKit packs contain FBX, Unity-oriented FBX, OBJ and glTF copies of many identical models. Only Unity-oriented FBX plus the required textures will enter the Unity project.
- Audio contains WAV and OGG duplicates. OGG is the production WebGL format; WAV remains in raw sources.
- Icon collections contain black-background and transparent duplicates. Transparent images are preferred.
- No existing gameplay code, scenes, prefabs, materials, shaders or render pipeline existed to conflict with the new project.
- The project uses Unity 6000.5.2f1 and the built-in render pipeline. Imported particle materials must be checked after package import.
- Input System 1.14.2 is incompatible with Unity 6000.5.2f1 because removed instance-ID editor APIs are compiled as errors; it is excluded from the baseline pending a compatible release.
