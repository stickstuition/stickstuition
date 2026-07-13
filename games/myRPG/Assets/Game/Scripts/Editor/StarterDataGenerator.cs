using System.IO;
using MyRPG.Data;
using UnityEditor;
using UnityEngine;

namespace MyRPG.Editor
{
    public static class StarterDataGenerator
    {
        private const string Root = "Assets/Game/Data";

        [MenuItem("MyRPG/Create Starter Data")]
        public static void Run()
        {
            string[] folders = { "Abilities", "Classes", "Companions", "Enemies", "Items", "Maths" };
            foreach (string folder in folders) Directory.CreateDirectory($"{Root}/{folder}");

            AbilityDefinition guard = Ability("shield_wall", "Shield Wall", 4, 8, AbilityTarget.AllAllies, false);
            AbilityDefinition flame = Ability("number_flame", "Number Flame", 5, 12, AbilityTarget.SingleEnemy, true);
            AbilityDefinition volley = Ability("quick_volley", "Quick Volley", 4, 10, AbilityTarget.SingleEnemy, false);
            AbilityDefinition luck = Ability("lucky_trick", "Lucky Trick", 3, 0, AbilityTarget.Self, false);

            Class(CharacterClassId.Knight, Stats(120, 20, 8, 9, 2, 5, 4, 4), guard);
            Class(CharacterClassId.Mage, Stats(80, 40, 3, 3, 10, 9, 5, 5), flame);
            Class(CharacterClassId.Ranger, Stats(95, 28, 6, 5, 3, 6, 9, 6), volley);
            Class(CharacterClassId.Rogue, Stats(90, 30, 5, 4, 3, 7, 10, 9), luck);

            Companion(CompanionId.Bramble, 1, Stats(105, 18, 8, 7, 1, 4, 4, 5), guard);
            Companion(CompanionId.Lyra, 2, Stats(78, 38, 3, 3, 9, 9, 6, 5), flame);
            Companion(CompanionId.Flint, 3, Stats(92, 26, 6, 5, 2, 6, 9, 7), volley);

            Enemy("skeleton_scout", "Skeleton Scout", 45, 18, false);
            Enemy("skeleton_warrior", "Skeleton Warrior", 75, 30, false);
            Enemy("skeleton_mage", "Skeleton Mage", 60, 35, false);
            Enemy("bone_captain", "Bone Captain", 130, 75, false);
            Enemy("bone_king", "The Bone King", 300, 250, true);

            Item("healing_potion", "Healing Potion", ItemCategory.Consumable, true, 9);
            Item("focus_potion", "Focus Potion", ItemCategory.Consumable, true, 9);
            Item("second_chance_scroll", "Second Chance Scroll", ItemCategory.Consumable, true, 3);
            Item("lucky_dice", "Lucky Dice", ItemCategory.DiceRelic, false, 1);
            Item("iron_sword", "Iron Sword", ItemCategory.Weapon, false, 1);
            Item("scholar_staff", "Scholar’s Staff", ItemCategory.Weapon, false, 1);
            Item("leather_armour", "Leather Armour", ItemCategory.Armour, false, 1);
            Item("scout_helmet", "Scout Helmet", ItemCategory.Helmet, false, 1);
            Item("fraction_charm", "Number Charm", ItemCategory.Charm, false, 1);

            ArithmeticTopicDefinition topic = Asset<ArithmeticTopicDefinition>("Maths/Arithmetic", "arithmetic", "Arithmetic");
            Set(topic, "defaultTimeLimitSeconds", 20);
            SerializedObject serialized = new SerializedObject(topic);
            SerializedProperty list = serialized.FindProperty("subtopics");
            list.arraySize = 7;
            for (int i = 0; i < 7; i++) list.GetArrayElementAtIndex(i).enumValueIndex = i;
            serialized.ApplyModifiedPropertiesWithoutUndo();

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("MyRPG starter data created.");
        }

        private static AbilityDefinition Ability(string id, string name, int cost, int power, AbilityTarget target, bool maths)
        {
            AbilityDefinition value = Asset<AbilityDefinition>($"Abilities/{id}", id, name);
            Set(value, "focusCost", cost); Set(value, "basePower", power); Set(value, "target", (int)target); Set(value, "requiresMaths", maths);
            return value;
        }

        private static void Class(CharacterClassId id, StatBlock stats, AbilityDefinition ability)
        {
            CharacterClassDefinition value = Asset<CharacterClassDefinition>($"Classes/{id}", id.ToString().ToLowerInvariant(), id.ToString());
            Set(value, "classId", (int)id); Set(value, "startingStats", stats); Set(value, "specialAbility", ability);
        }

        private static void Companion(CompanionId id, int chapter, StatBlock stats, AbilityDefinition ability)
        {
            CompanionDefinition value = Asset<CompanionDefinition>($"Companions/{id}", id.ToString().ToLowerInvariant(), id.ToString());
            Set(value, "companionId", (int)id); Set(value, "unlockChapter", chapter); Set(value, "baseStats", stats); Set(value, "signatureAbility", ability);
        }

        private static void Enemy(string id, string name, int health, int reward, bool boss)
        {
            EnemyDefinition value = Asset<EnemyDefinition>($"Enemies/{id}", id, name);
            Set(value, "stats", Stats(health, 10, 6, 4, 3, 3, 5, 3)); Set(value, "experienceReward", reward); Set(value, "boss", boss);
        }

        private static void Item(string id, string name, ItemCategory category, bool stackable, int maximum)
        {
            ItemDefinition value = Asset<ItemDefinition>($"Items/{id}", id, name);
            Set(value, "category", (int)category); Set(value, "stackable", stackable); Set(value, "maximumStack", maximum);
            string iconName = id == "healing_potion" ? "IconHeart" : id == "focus_potion" ? "IconSettings" :
                id.Contains("dice") ? "IconNext" : id.Contains("scroll") ? "IconCheckmark" : "IconCoin";
            Sprite icon = AssetDatabase.LoadAssetAtPath<Sprite>($"Assets/ThirdParty/UI/Icons/GameIcons/{iconName}.png");
            Set(value, "icon", icon);
        }

        private static T Asset<T>(string relative, string id, string name) where T : IdentifiedDefinition
        {
            string path = $"{Root}/{relative}.asset";
            T value = AssetDatabase.LoadAssetAtPath<T>(path);
            if (value == null) { value = ScriptableObject.CreateInstance<T>(); AssetDatabase.CreateAsset(value, path); }
            Set(value, "id", id); Set(value, "displayName", name); Set(value, "description", $"{name} definition.");
            return value;
        }

        private static void Set(Object target, string name, object value)
        {
            SerializedObject serialized = new SerializedObject(target);
            SerializedProperty property = serialized.FindProperty(name);
            switch (value)
            {
                case int number when property.propertyType == SerializedPropertyType.Enum: property.enumValueIndex = number; break;
                case int number: property.intValue = number; break;
                case bool flag: property.boolValue = flag; break;
                case string text: property.stringValue = text; break;
                case Object reference: property.objectReferenceValue = reference; break;
                default: property.boxedValue = value; break;
            }
            serialized.ApplyModifiedPropertiesWithoutUndo();
            EditorUtility.SetDirty(target);
        }

        private static StatBlock Stats(int hp, int focus, int str, int def, int magic, int intel, int agility, int luck)
        {
            return new StatBlock { maxHealth = hp, maxFocus = focus, strength = str, defence = def, magic = magic, intelligence = intel, agility = agility, luck = luck };
        }
    }
}
