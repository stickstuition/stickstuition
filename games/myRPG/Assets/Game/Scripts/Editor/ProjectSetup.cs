using System.IO;
using MyRPG.Core;
using MyRPG.Data;
using MyRPG.UI;
using MyRPG.World;
using MyRPG.Education;
using MyRPG.Dice;
using MyRPG.Combat;
using MyRPG.Inventory;
using MyRPG.Presentation;
using MyRPG.UI;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace MyRPG.Editor
{
    public static class ProjectSetup
    {
        private const string SceneFolder = "Assets/Game/Scenes";

        [MenuItem("MyRPG/Run Phase 1 Setup")]
        public static void Run()
        {
            Directory.CreateDirectory(SceneFolder);
            CreateBootScene();
            CreateMainMenuScene();
            CreateVillageScene();
            CreateBrokenRoadScene();
            CreateCryptScene();
            CreateKeepScene();
            CreateEndingScene();
            ConfigureBuild();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("MyRPG Phase 1 setup completed.");
        }

        private static void CreateBootScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject root = new GameObject("GameBootstrap");
            root.AddComponent<GameBootstrap>();
            EditorSceneManager.SaveScene(scene, $"{SceneFolder}/{SceneNames.Boot}.unity");
        }

        private static void CreateMainMenuScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            Camera camera = new GameObject("Main Camera", typeof(Camera), typeof(AudioListener)).GetComponent<Camera>();
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.10f, 0.16f, 0.23f);
            camera.tag = "MainCamera";
            MainMenuController controller = new GameObject("MainMenu", typeof(MainMenuController)).GetComponent<MainMenuController>();
            ConfigureMainMenu(controller);
            CreatePresentation("Assets/ThirdParty/Audio/BGS Loops/Interior Day/Inside Day.ogg", false);
            EditorSceneManager.SaveScene(scene, $"{SceneFolder}/{SceneNames.MainMenu}.unity");
        }

        private static void ConfigureMainMenu(MainMenuController controller)
        {
            SerializedObject serialized = new SerializedObject(controller);
            serialized.FindProperty("displayFont").objectReferenceValue =
                AssetDatabase.LoadAssetAtPath<Font>("Assets/ThirdParty/Fonts/Beholden-Regular.ttf");
            serialized.FindProperty("panelSprite").objectReferenceValue =
                AssetDatabase.LoadAssetAtPath<Sprite>("Assets/ThirdParty/UI/Backgrounds/BackgroundSettingsMenu.png");
            serialized.FindProperty("buttonSprite").objectReferenceValue =
                AssetDatabase.LoadAssetAtPath<Sprite>("Assets/ThirdParty/UI/Buttons/LargeButtons/ButtonLargeBlue.png");
            serialized.FindProperty("buttonPressedSprite").objectReferenceValue =
                AssetDatabase.LoadAssetAtPath<Sprite>("Assets/ThirdParty/UI/Buttons/LargeButtons/ButtonLargeBlueActive.png");

            SerializedProperty classList = serialized.FindProperty("classes");
            string[] names = { "Knight", "Mage", "Ranger", "Rogue" };
            classList.arraySize = names.Length;
            for (int i = 0; i < names.Length; i++)
                classList.GetArrayElementAtIndex(i).objectReferenceValue =
                    AssetDatabase.LoadAssetAtPath<CharacterClassDefinition>($"Assets/Game/Data/Classes/{names[i]}.asset");
            serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void ConfigureBuild()
        {
            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene($"{SceneFolder}/{SceneNames.Boot}.unity", true),
                new EditorBuildSettingsScene($"{SceneFolder}/{SceneNames.MainMenu}.unity", true),
                new EditorBuildSettingsScene($"{SceneFolder}/{SceneNames.Village}.unity", true)
                ,new EditorBuildSettingsScene($"{SceneFolder}/{SceneNames.BrokenRoad}.unity", true)
                ,new EditorBuildSettingsScene($"{SceneFolder}/{SceneNames.Crypt}.unity", true)
                ,new EditorBuildSettingsScene($"{SceneFolder}/{SceneNames.BoneKingKeep}.unity", true)
                ,new EditorBuildSettingsScene($"{SceneFolder}/{SceneNames.Ending}.unity", true)
            };

            PlayerSettings.companyName = "Sticks Tuition";
            PlayerSettings.productName = "MyRPG";
            PlayerSettings.defaultScreenWidth = 1280;
            PlayerSettings.defaultScreenHeight = 720;
            PlayerSettings.runInBackground = true;
            PlayerSettings.colorSpace = ColorSpace.Linear;
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.WebGL, "com.stickstuition.myrpg");
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.WebGL.initialMemorySize = 256;
        }

        private static void CreateVillageScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            RenderSettings.ambientLight = new Color(0.55f, 0.62f, 0.68f);
            Light sun = new GameObject("Sun", typeof(Light)).GetComponent<Light>();
            sun.type = LightType.Directional; sun.intensity = 1.15f; sun.transform.rotation = Quaternion.Euler(48f, -32f, 0f);

            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ground.name = "Village Ground"; ground.transform.position = new Vector3(0f, -0.5f, 6f); ground.transform.localScale = new Vector3(34f, 1f, 38f);
            SetMaterialColor(ground, new Color(0.34f, 0.55f, 0.30f));
            for (int z = -8; z <= 22; z += 3)
            {
                GameObject path = GameObject.CreatePrimitive(PrimitiveType.Cube);
                path.name = "Road"; path.transform.position = new Vector3(0f, 0.02f, z); path.transform.localScale = new Vector3(4.5f, 0.08f, 3.1f);
                SetMaterialColor(path, new Color(0.54f, 0.44f, 0.31f));
            }

            PlaceModel("Assets/ThirdParty/KayKit/Environment/Overworld/buildings/yellow/building_tavern_yellow.fbx", "Village Tavern", new Vector3(-8f, 0f, 4f), Quaternion.Euler(0f, 90f, 0f), 1.4f, true);
            PlaceModel("Assets/ThirdParty/KayKit/Environment/Overworld/buildings/red/building_blacksmith_red.fbx", "Blacksmith", new Vector3(8f, 0f, 7f), Quaternion.Euler(0f, -90f, 0f), 1.25f, true);
            PlaceModel("Assets/ThirdParty/KayKit/Environment/Overworld/buildings/blue/building_home_A_blue.fbx", "Village Home", new Vector3(-8f, 0f, 14f), Quaternion.Euler(0f, 90f, 0f), 1.3f, true);
            PlaceModel("Assets/ThirdParty/KayKit/Environment/Overworld/decoration/props/tent.fbx", "Guide Tent", new Vector3(7f, 0f, -2f), Quaternion.Euler(0f, -110f, 0f), 1.2f, true);
            for (int i = 0; i < 8; i++)
            {
                float x = i % 2 == 0 ? -14f : 14f;
                PlaceModel("Assets/ThirdParty/KayKit/Environment/Overworld/decoration/nature/tree_single_A.fbx", $"Tree {i + 1}", new Vector3(x, 0f, -5f + i * 4f), Quaternion.Euler(0f, i * 33f, 0f), 1.1f, true);
            }

            GameObject player = new GameObject("Player", typeof(CharacterController), typeof(PlayerController), typeof(InteractionScanner), typeof(PlayerAvatarSelector));
            player.transform.position = new Vector3(0f, 0.1f, -7f);
            CharacterController character = player.GetComponent<CharacterController>(); character.height = 1.8f; character.radius = 0.38f; character.center = new Vector3(0f, 0.9f, 0f);
            ConfigureAvatars(player.GetComponent<PlayerAvatarSelector>(), player.transform);

            Camera camera = new GameObject("Main Camera", typeof(Camera), typeof(AudioListener), typeof(IsometricCamera)).GetComponent<Camera>();
            camera.tag = "MainCamera"; camera.transform.position = new Vector3(9f, 11f, -16f); camera.fieldOfView = 48f;
            camera.GetComponent<IsometricCamera>().SetTarget(player.transform);

            new GameObject("World UI", typeof(WorldUI));
            new GameObject("Question Manager", typeof(QuestionManager));
            CreateDiceManager();
            new GameObject("Combat Manager", typeof(CombatManager));
            CreatePresentation("Assets/ThirdParty/Audio/BGS Loops/Forest Day/Forest Day.ogg", true);
            CreateInventoryMenu();
            CreateSign(new Vector3(3.2f, 0.8f, -1f));
            CreateChest(new Vector3(-4.5f, 0f, 8f));
            CreateCoin(new Vector3(4f, 0.6f, 12f));
            CreateGate(new Vector3(0f, 0f, 20f));
            CreateCheckpoint(new Vector3(0f, 1.2f, 23f));
            CreateHazard(new Vector3(5.5f, 0.15f, 16f));
            CreateMathsShrine(new Vector3(-4.5f, 0.7f, 14f));
            CreateDiceChallenge(new Vector3(3.5f, 0.7f, 18f));
            CreateCombatEncounter(new Vector3(6.5f, 0f, 10f));
            CreatePortal(new Vector3(0f, 0.8f, 27f), SceneNames.BrokenRoad, "Enter the Broken Road", "village_old_gate");
            EditorSceneManager.SaveScene(scene, $"{SceneFolder}/{SceneNames.Village}.unity");
        }

        private static void CreateBrokenRoadScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            CreateLighting(new Color(0.54f, 0.62f, 0.67f));
            CreateGround(new Vector3(0f, -0.5f, 18f), new Vector3(30f, 1f, 54f), new Color(0.31f, 0.48f, 0.27f));
            CreateRoad(-6, 40);
            for (int i = 0; i < 10; i++)
            {
                float x = i % 2 == 0 ? -11f : 11f;
                PlaceModel("Assets/ThirdParty/KayKit/Environment/Overworld/decoration/nature/tree_single_A.fbx", $"Road Tree {i}", new Vector3(x, 0f, -3f + i * 5f), Quaternion.Euler(0f, i * 37f, 0f), 1f, true);
            }
            PlayerController player = CreateAdventureSystems(new Vector3(0f, 0.1f, -6f), "Defeat the skeleton scouts");
            CreateCombatEncounter(new Vector3(4f, 0f, 8f), "road_scout", "Skeleton Scout", "Skeleton_Rogue.fbx", Stats(48, 10, 6, 3, 2, 3, 8, 3), 25, false);
            CreateCombatEncounter(new Vector3(-4f, 0f, 19f), "road_warrior", "Skeleton Warrior", "Skeleton_Warrior.fbx", Stats(78, 10, 8, 7, 2, 3, 4, 3), 40, false);
            CreateChest(new Vector3(7f, 0f, 14f), "road_chest", "focus_potion");
            CreateMathsShrine(new Vector3(-6f, 0.7f, 27f));
            CreateCheckpoint(new Vector3(0f, 1.2f, 30f), "broken_road_camp");
            CreateCompanion(new Vector3(4f, 0f, 34f), CompanionId.Bramble, "Barbarian.fbx", "Those skeletons trapped me here. Let’s finish this road together!");
            CreateChapterExit(new Vector3(0f, 0.8f, 41f), 1, CompanionId.Bramble, SceneNames.Crypt);
            EditorSceneManager.SaveScene(scene, $"{SceneFolder}/{SceneNames.BrokenRoad}.unity");
        }

        private static void CreateCryptScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            CreateLighting(new Color(0.25f, 0.30f, 0.38f), 0.55f);
            CreateGround(new Vector3(0f, -0.5f, 18f), new Vector3(26f, 1f, 52f), new Color(0.18f, 0.20f, 0.23f));
            for (int z = -5; z <= 40; z += 5)
            {
                PlaceModel("Assets/ThirdParty/KayKit/Environment/Dungeon/floor_tile_large.fbx", $"Crypt Floor {z}", new Vector3(0f, 0f, z), Quaternion.identity, 1.2f, true);
                PlaceModel("Assets/ThirdParty/KayKit/Environment/Dungeon/wall.fbx", $"Left Wall {z}", new Vector3(-8f, 0f, z), Quaternion.identity, 1.2f, true);
                PlaceModel("Assets/ThirdParty/KayKit/Environment/Dungeon/wall.fbx", $"Right Wall {z}", new Vector3(8f, 0f, z), Quaternion.Euler(0f, 180f, 0f), 1.2f, true);
            }
            CreateAdventureSystems(new Vector3(0f, 0.1f, -5f), "Solve the crypt’s number locks");
            CreateCombatEncounter(new Vector3(3.5f, 0f, 8f), "crypt_mage", "Skeleton Mage", "Skeleton_Mage.fbx", Stats(68, 22, 4, 4, 9, 8, 5, 4), 55, false);
            CreateDiceChallenge(new Vector3(-3.5f, 0.7f, 15f), "crypt_number_lock", 14);
            CreateChest(new Vector3(5f, 0f, 21f), "crypt_treasure", "lucky_dice");
            CreateMathsShrine(new Vector3(-5f, 0.7f, 25f));
            CreateCombatEncounter(new Vector3(3f, 0f, 29f), "crypt_guard", "Crypt Guard", "Skeleton_Warrior.fbx", Stats(92, 12, 9, 8, 2, 4, 4, 3), 65, false);
            CreateCheckpoint(new Vector3(0f, 1.2f, 32f), "crypt_sanctum");
            CreateCompanion(new Vector3(-3.5f, 0f, 36f), CompanionId.Lyra, "Mage.fbx", "You broke the number seal! My magic is yours.");
            CreateChapterExit(new Vector3(0f, 0.8f, 42f), 2, CompanionId.Lyra, SceneNames.BoneKingKeep);
            EditorSceneManager.SaveScene(scene, $"{SceneFolder}/{SceneNames.Crypt}.unity");
        }

        private static void CreateKeepScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            CreateLighting(new Color(0.35f, 0.28f, 0.34f), 0.75f);
            CreateGround(new Vector3(0f, -0.5f, 20f), new Vector3(34f, 1f, 58f), new Color(0.22f, 0.18f, 0.20f));
            for (int z = -5; z <= 44; z += 6)
            {
                PlaceModel("Assets/ThirdParty/KayKit/Environment/Dungeon/floor_tile_large_rocks.fbx", $"Keep Floor {z}", new Vector3(0f, 0f, z), Quaternion.identity, 1.4f, true);
                PlaceModel("Assets/ThirdParty/KayKit/Environment/Dungeon/torch_lit.fbx", $"Keep Torch {z}", new Vector3(z % 12 == 0 ? -7f : 7f, 1.6f, z), Quaternion.identity, 1f, false);
            }
            CreateAdventureSystems(new Vector3(0f, 0.1f, -5f), "Storm the Bone King’s Keep");
            CreateCombatEncounter(new Vector3(4f, 0f, 8f), "bone_captain", "Bone Captain", "Skeleton_Warrior.fbx", Stats(135, 20, 10, 9, 4, 6, 6, 5), 95, false);
            CreateCompanion(new Vector3(-4f, 0f, 16f), CompanionId.Flint, "Ranger.fbx", "Perfect timing. My arrows will help against the Bone King!");
            CreateChest(new Vector3(5f, 0f, 22f), "keep_armoury", "fraction_charm");
            CreateCheckpoint(new Vector3(0f, 1.2f, 27f), "bone_king_antechamber");
            CreateCombatEncounter(new Vector3(0f, 0f, 37f), "bone_king", "The Bone King", "Skeleton_Warrior.fbx", Stats(300, 40, 13, 10, 11, 10, 7, 8), 250, true);
            CreateChapterExit(new Vector3(0f, 0.8f, 44f), 3, CompanionId.Flint, SceneNames.Ending, "bone_king");
            EditorSceneManager.SaveScene(scene, $"{SceneFolder}/{SceneNames.BoneKingKeep}.unity");
        }

        private static void CreateEndingScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            Camera camera = new GameObject("Main Camera", typeof(Camera), typeof(AudioListener)).GetComponent<Camera>(); camera.tag = "MainCamera"; camera.backgroundColor = new Color(0.08f, 0.15f, 0.22f);
            new GameObject("Ending", typeof(EndingController));
            CreatePresentation("Assets/ThirdParty/Audio/BGS Loops/Interior Day/Inside Day.ogg", false);
            EditorSceneManager.SaveScene(scene, $"{SceneFolder}/{SceneNames.Ending}.unity");
        }

        private static PlayerController CreateAdventureSystems(Vector3 spawn, string objective)
        {
            GameObject player = new GameObject("Player", typeof(CharacterController), typeof(PlayerController), typeof(InteractionScanner), typeof(PlayerAvatarSelector));
            player.transform.position = spawn; CharacterController cc=player.GetComponent<CharacterController>();cc.height=1.8f;cc.radius=0.38f;cc.center=new Vector3(0f,0.9f,0f);
            ConfigureAvatars(player.GetComponent<PlayerAvatarSelector>(), player.transform);
            Camera camera = new GameObject("Main Camera", typeof(Camera), typeof(AudioListener), typeof(IsometricCamera)).GetComponent<Camera>();camera.tag="MainCamera";camera.transform.position=spawn+new Vector3(9f,11f,-9f);camera.fieldOfView=48f;camera.GetComponent<IsometricCamera>().SetTarget(player.transform);
            WorldUI ui = new GameObject("World UI", typeof(WorldUI)).GetComponent<WorldUI>(); SerializedObject uiSerialized=new SerializedObject(ui);uiSerialized.FindProperty("initialObjective").stringValue=objective;uiSerialized.ApplyModifiedPropertiesWithoutUndo();
            new GameObject("Question Manager", typeof(QuestionManager)); CreateDiceManager(); new GameObject("Combat Manager", typeof(CombatManager)); CreateInventoryMenu(); new GameObject("Chapter Report", typeof(ChapterReportUI));
            string ambience = objective.Contains("crypt") ? "Assets/ThirdParty/Audio/BGS Loops/Cave/Cave.ogg" : objective.Contains("Keep") ? "Assets/ThirdParty/Audio/BGS Loops/Interior Night/Inside Night.ogg" : "Assets/ThirdParty/Audio/BGS Loops/Forest Day/Forest Day.ogg";
            CreatePresentation(ambience, true);
            return player.GetComponent<PlayerController>();
        }

        private static void CreatePresentation(string ambiencePath, bool tutorial)
        {
            ScenePresentation presentation = new GameObject("Scene Presentation", typeof(ScenePresentation)).GetComponent<ScenePresentation>();
            SerializedObject so = new SerializedObject(presentation);
            so.FindProperty("ambience").objectReferenceValue = AssetDatabase.LoadAssetAtPath<AudioClip>(ambiencePath);
            so.FindProperty("attackSound").objectReferenceValue = AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/ThirdParty/Audio/SFX/Attacks/Sword Attacks Hits and Blocks/Sword Attack 1.ogg");
            so.FindProperty("impactSound").objectReferenceValue = AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/ThirdParty/Audio/SFX/Attacks/Sword Attacks Hits and Blocks/Sword Impact Hit 1.ogg");
            so.FindProperty("hitParticles").objectReferenceValue = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Kenney/Particle samples/Prefabs/Sparks.prefab");
            so.FindProperty("magicParticles").objectReferenceValue = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Kenney/Particle samples/Prefabs/Magic.prefab");
            so.ApplyModifiedPropertiesWithoutUndo();
            if (tutorial) presentation.gameObject.AddComponent<TutorialCard>();
        }

        private static void CreateLighting(Color ambient, float intensity = 1.05f)
        {
            RenderSettings.ambientLight=ambient;Light sun=new GameObject("Sun",typeof(Light)).GetComponent<Light>();sun.type=LightType.Directional;sun.intensity=intensity;sun.transform.rotation=Quaternion.Euler(50f,-35f,0f);
        }

        private static void CreateGround(Vector3 position, Vector3 scale, Color color)
        {
            GameObject ground=GameObject.CreatePrimitive(PrimitiveType.Cube);ground.name="Ground";ground.transform.position=position;ground.transform.localScale=scale;SetMaterialColor(ground,color);
        }

        private static void CreateRoad(int start, int end)
        {
            for(int z=start;z<=end;z+=3){GameObject road=GameObject.CreatePrimitive(PrimitiveType.Cube);road.name="Broken Road";road.transform.position=new Vector3(0f,0.02f,z);road.transform.localScale=new Vector3(4.5f,0.08f,3.1f);SetMaterialColor(road,new Color(0.48f,0.39f,0.29f));}
        }

        private static void ConfigureAvatars(PlayerAvatarSelector selector, Transform parent)
        {
            string[] names = { "Knight", "Mage", "Ranger", "Rogue" };
            SerializedObject serialized = new SerializedObject(selector);
            SerializedProperty avatars = serialized.FindProperty("avatars"); avatars.arraySize = names.Length;
            for (int i = 0; i < names.Length; i++)
            {
                GameObject model = PlaceModel($"Assets/ThirdParty/KayKit/Adventurers/Characters/{names[i]}.fbx", names[i], Vector3.zero, Quaternion.identity, 1f, false, parent);
                model.SetActive(i == 0);
                SerializedProperty entry = avatars.GetArrayElementAtIndex(i);
                entry.FindPropertyRelative("classId").enumValueIndex = i;
                entry.FindPropertyRelative("model").objectReferenceValue = model;
            }
            serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void CreateSign(Vector3 position)
        {
            GameObject sign = GameObject.CreatePrimitive(PrimitiveType.Cube); sign.name = "Road Sign"; sign.transform.position = position; sign.transform.localScale = new Vector3(1.7f, 1.1f, 0.15f);
            sign.AddComponent<WorldSign>(); SetMaterialColor(sign, new Color(0.45f, 0.28f, 0.13f));
        }

        private static void CreateChest(Vector3 position, string chestId = "village_chest", string itemId = "healing_potion")
        {
            GameObject chest = PlaceModel("Assets/ThirdParty/KayKit/Environment/Dungeon/chest.fbx", "Village Chest", position, Quaternion.identity, 1f, false);
            chest.AddComponent<BoxCollider>(); WorldChest component=chest.AddComponent<WorldChest>();
            SerializedObject serialized=new SerializedObject(component);serialized.FindProperty("chestId").stringValue=chestId;serialized.FindProperty("itemId").stringValue=itemId;serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void CreateCoin(Vector3 position)
        {
            GameObject coin = PlaceModel("Assets/ThirdParty/KayKit/BoardGame/coin_gold.fbx", "Golden Coin", position, Quaternion.Euler(90f, 0f, 0f), 1.5f, false);
            coin.AddComponent<SphereCollider>(); coin.AddComponent<WorldCollectible>();
        }

        private static void CreateGate(Vector3 position)
        {
            GameObject gate = PlaceModel("Assets/ThirdParty/KayKit/Environment/Overworld/buildings/neutral/fence_wood_straight_gate.fbx", "Village Gate", position, Quaternion.identity, 1.4f, false);
            BoxCollider collider = gate.AddComponent<BoxCollider>(); collider.size = new Vector3(3f, 2.5f, 0.5f);
            gate.AddComponent<WorldDoor>();
        }

        private static void CreateCheckpoint(Vector3 position, string checkpointId = "village_gate")
        {
            GameObject checkpoint = new GameObject("Broken Road Checkpoint", typeof(BoxCollider), typeof(WorldCheckpoint));
            checkpoint.transform.position = position;
            BoxCollider collider = checkpoint.GetComponent<BoxCollider>(); collider.isTrigger = true; collider.size = new Vector3(5f, 2.5f, 2f);
            SerializedObject serialized=new SerializedObject(checkpoint.GetComponent<WorldCheckpoint>());serialized.FindProperty("checkpointId").stringValue=checkpointId;serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void CreateHazard(Vector3 position)
        {
            GameObject hazard = GameObject.CreatePrimitive(PrimitiveType.Cube); hazard.name = "Training Hazard";
            hazard.transform.position = position; hazard.transform.localScale = new Vector3(2.5f, 0.3f, 2.5f);
            Collider collider = hazard.GetComponent<Collider>(); collider.isTrigger = true;
            hazard.AddComponent<WorldHazard>(); SetMaterialColor(hazard, new Color(0.68f, 0.20f, 0.16f));
        }

        private static void CreateMathsShrine(Vector3 position)
        {
            GameObject shrine = PlaceModel("Assets/ThirdParty/KayKit/BoardGame/D20_blue.fbx", "Multiplication Shrine", position, Quaternion.Euler(15f, 20f, 10f), 2f, false);
            SphereCollider collider = shrine.AddComponent<SphereCollider>(); collider.radius = 0.8f;
            shrine.AddComponent<MathsShrine>();
        }

        private static void CreateDiceManager()
        {
            DiceManager manager = new GameObject("Dice Manager", typeof(DiceManager)).GetComponent<DiceManager>();
            GameObject model = PlaceModel("Assets/ThirdParty/KayKit/BoardGame/D20_red.fbx", "Animated D20", Vector3.zero, Quaternion.identity, 1f, false, manager.transform);
            model.SetActive(false);
            SerializedObject serialized = new SerializedObject(manager);
            serialized.FindProperty("dieModel").objectReferenceValue = model;
            serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void CreateDiceChallenge(Vector3 position, string challengeId = "village_old_gate", int difficultyClass = 12)
        {
            GameObject barrier = GameObject.CreatePrimitive(PrimitiveType.Cube); barrier.name = "Rusted Road Barrier";
            barrier.transform.position = new Vector3(0f, 1f, 18f); barrier.transform.localScale = new Vector3(4.5f, 2f, 0.45f);
            SetMaterialColor(barrier, new Color(0.35f, 0.28f, 0.22f));
            GameObject marker = PlaceModel("Assets/ThirdParty/KayKit/BoardGame/D20_yellow.fbx", "Old Gate Dice Challenge", position, Quaternion.Euler(10f, 25f, 5f), 1.7f, false);
            marker.AddComponent<SphereCollider>();
            WorldDiceChallenge challenge = marker.AddComponent<WorldDiceChallenge>();
            SerializedObject serialized = new SerializedObject(challenge);
            serialized.FindProperty("successBarrier").objectReferenceValue = barrier;
            serialized.FindProperty("challengeId").stringValue = challengeId;
            serialized.FindProperty("difficultyClass").intValue = difficultyClass;
            serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void CreateCombatEncounter(Vector3 position, string encounterId = "village_skeleton_scout", string enemyName = "Skeleton Scout",
            string modelFile = "Skeleton_Minion.fbx", StatBlock? configuredStats = null, int experience = 25, bool boss = false)
        {
            GameObject skeleton = PlaceModel($"Assets/ThirdParty/KayKit/Skeletons/Characters/{modelFile}", enemyName+" Encounter", position, Quaternion.Euler(0f, -90f, 0f), boss ? 1.55f : 1f, false);
            CapsuleCollider collider = skeleton.AddComponent<CapsuleCollider>(); collider.height = 1.8f; collider.radius = 0.4f; collider.center = new Vector3(0f, 0.9f, 0f);
            WorldCombatEncounter encounter=skeleton.AddComponent<WorldCombatEncounter>();SerializedObject serialized=new SerializedObject(encounter);
            serialized.FindProperty("encounterId").stringValue=encounterId;serialized.FindProperty("enemyName").stringValue=enemyName;
            serialized.FindProperty("enemyStats").boxedValue=configuredStats ?? Stats(48,10,6,3,2,3,7,3);
            serialized.FindProperty("experienceReward").intValue=experience;serialized.FindProperty("boss").boolValue=boss;serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void CreatePortal(Vector3 position, string targetScene, string prompt, string requiredId)
        {
            GameObject portal=GameObject.CreatePrimitive(PrimitiveType.Cylinder);portal.name=prompt;portal.transform.position=position;portal.transform.localScale=new Vector3(1.8f,0.12f,1.8f);SetMaterialColor(portal,new Color(0.18f,0.58f,0.76f));
            WorldScenePortal component=portal.AddComponent<WorldScenePortal>();SerializedObject serialized=new SerializedObject(component);serialized.FindProperty("targetScene").stringValue=targetScene;serialized.FindProperty("prompt").stringValue=prompt;serialized.FindProperty("requiredCompletedId").stringValue=requiredId;serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void CreateCompanion(Vector3 position, CompanionId companion, string modelFile, string dialogue)
        {
            GameObject model=PlaceModel($"Assets/ThirdParty/KayKit/Adventurers/Characters/{modelFile}",companion+" Rescue",position,Quaternion.Euler(0f,180f,0f),1f,false);
            CapsuleCollider collider=model.AddComponent<CapsuleCollider>();collider.height=1.8f;collider.radius=0.4f;collider.center=new Vector3(0f,0.9f,0f);
            CompanionRescue rescue=model.AddComponent<CompanionRescue>();SerializedObject serialized=new SerializedObject(rescue);serialized.FindProperty("companion").enumValueIndex=(int)companion;serialized.FindProperty("rescueDialogue").stringValue=dialogue;serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void CreateChapterExit(Vector3 position, int chapter, CompanionId companion, string targetScene, string requiredDefeatedId = "")
        {
            GameObject exit=GameObject.CreatePrimitive(PrimitiveType.Cylinder);exit.name=$"Chapter {chapter} Exit";exit.transform.position=position;exit.transform.localScale=new Vector3(2f,0.12f,2f);SetMaterialColor(exit,new Color(0.72f,0.58f,0.18f));
            ChapterExit component=exit.AddComponent<ChapterExit>();SerializedObject serialized=new SerializedObject(component);serialized.FindProperty("completedChapter").intValue=chapter;serialized.FindProperty("requiredCompanion").enumValueIndex=(int)companion;serialized.FindProperty("targetScene").stringValue=targetScene;serialized.FindProperty("requiredDefeatedId").stringValue=requiredDefeatedId;serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        private static StatBlock Stats(int hp,int focus,int strength,int defence,int magic,int intelligence,int agility,int luck)
        {
            return new StatBlock{maxHealth=hp,maxFocus=focus,strength=strength,defence=defence,magic=magic,intelligence=intelligence,agility=agility,luck=luck};
        }

        private static void CreateInventoryMenu()
        {
            InventoryMenu menu = new GameObject("Inventory and Progression Menu", typeof(InventoryMenu)).GetComponent<InventoryMenu>();
            string[] guids = AssetDatabase.FindAssets("t:ItemDefinition", new[] { "Assets/Game/Data/Items" });
            SerializedObject serialized = new SerializedObject(menu);
            SerializedProperty definitions = serialized.FindProperty("itemDefinitions"); definitions.arraySize = guids.Length;
            for (int i = 0; i < guids.Length; i++)
                definitions.GetArrayElementAtIndex(i).objectReferenceValue =
                    AssetDatabase.LoadAssetAtPath<ItemDefinition>(AssetDatabase.GUIDToAssetPath(guids[i]));
            serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        private static GameObject PlaceModel(string assetPath, string name, Vector3 position, Quaternion rotation, float scale, bool addCollider, Transform parent = null)
        {
            GameObject asset = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
            GameObject value = asset != null ? (GameObject)PrefabUtility.InstantiatePrefab(asset) : GameObject.CreatePrimitive(PrimitiveType.Cube);
            value.name = name; value.transform.SetParent(parent, false);
            if (parent == null) { value.transform.position = position; value.transform.rotation = rotation; }
            else { value.transform.localPosition = position; value.transform.localRotation = rotation; }
            value.transform.localScale = Vector3.one * scale;
            if (addCollider && value.GetComponent<Collider>() == null) value.AddComponent<BoxCollider>();
            return value;
        }

        private static void SetMaterialColor(GameObject target, Color color)
        {
            Renderer renderer = target.GetComponent<Renderer>();
            if (renderer == null) return;
            Material material = new Material(Shader.Find("Standard")); material.color = color; renderer.sharedMaterial = material;
        }
    }
}
