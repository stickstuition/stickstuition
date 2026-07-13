using System;
using System.Collections.Generic;
using MyRPG.Data;

namespace MyRPG.Saving
{
    [Serializable]
    public sealed class SaveData
    {
        public const int CurrentVersion = 2;

        public int version = CurrentVersion;
        public string saveId;
        public string adventurerName;
        public string displayTitle;
        public CharacterClassId characterClass;
        public int currentChapter = 1;
        public string checkpointId = "village_start";
        public SerializableVector3 playerPosition;
        public int level = 1;
        public int experience;
        public StatBlock baseStats;
        public int currentHealth;
        public int currentFocus;
        public int knowledgePoints;
        public long totalPlaytimeSeconds;
        public string createdUtc;
        public string lastPlayedUtc;
        public List<InventoryEntry> inventory = new List<InventoryEntry>();
        public List<EquipmentEntry> equipment = new List<EquipmentEntry>();
        public List<string> unlockedAbilityIds = new List<string>();
        public List<CompanionId> unlockedCompanions = new List<CompanionId>();
        public List<UpgradeRankEntry> upgrades = new List<UpgradeRankEntry>();
        public List<string> defeatedEnemyIds = new List<string>();
        public List<string> openedChestIds = new List<string>();
        public List<QuestState> quests = new List<QuestState>();
        public EducationalPerformance performance = new EducationalPerformance();

        public static SaveData CreateNew(string name, CharacterClassId classId, StatBlock stats)
        {
            string cleanName = string.IsNullOrWhiteSpace(name) ? "Adventurer" : name.Trim();
            stats.ClampMinimums();
            string now = DateTime.UtcNow.ToString("O");
            return new SaveData
            {
                saveId = Guid.NewGuid().ToString("N"),
                adventurerName = cleanName,
                displayTitle = $"{cleanName}’s Great Adventure",
                characterClass = classId,
                baseStats = stats,
                currentHealth = stats.maxHealth,
                currentFocus = stats.maxFocus,
                createdUtc = now,
                lastPlayedUtc = now
            };
        }

        public void Normalize()
        {
            version = CurrentVersion;
            baseStats.ClampMinimums();
            currentChapter = Math.Max(1, currentChapter);
            level = Math.Max(1, level);
            experience = Math.Max(0, experience);
            knowledgePoints = Math.Max(0, knowledgePoints);
            currentHealth = Math.Max(0, Math.Min(currentHealth, baseStats.maxHealth));
            currentFocus = Math.Max(0, Math.Min(currentFocus, baseStats.maxFocus));
            inventory ??= new List<InventoryEntry>();
            equipment ??= new List<EquipmentEntry>();
            unlockedAbilityIds ??= new List<string>();
            unlockedCompanions ??= new List<CompanionId>();
            upgrades ??= new List<UpgradeRankEntry>();
            defeatedEnemyIds ??= new List<string>();
            openedChestIds ??= new List<string>();
            quests ??= new List<QuestState>();
            performance ??= new EducationalPerformance();
            performance.Normalize();
        }
    }

    [Serializable] public struct SerializableVector3 { public float x; public float y; public float z; }
    [Serializable] public sealed class InventoryEntry { public string itemId; public int quantity = 1; }
    [Serializable] public sealed class EquipmentEntry { public ItemCategory slot; public string itemId; }
    [Serializable] public sealed class QuestState { public string questId; public int stage; public bool complete; }
    [Serializable] public sealed class UpgradeRankEntry { public string upgradeId; public int rank; }
}
