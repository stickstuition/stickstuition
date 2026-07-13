using System;
using System.Collections.Generic;
using MyRPG.Data;
using MyRPG.Saving;

namespace MyRPG.Inventory
{
    public static class EquipmentOperations
    {
        public static bool IsEquipment(ItemCategory category)
        {
            return category == ItemCategory.Weapon || category == ItemCategory.Armour ||
                   category == ItemCategory.Helmet || category == ItemCategory.Charm ||
                   category == ItemCategory.DiceRelic;
        }

        public static string Equip(SaveData save, string itemId, ItemCategory category)
        {
            if (save == null) throw new ArgumentNullException(nameof(save));
            if (!IsEquipment(category) || !save.inventory.Exists(x => x.itemId == itemId && x.quantity > 0)) return null;
            EquipmentEntry existing = save.equipment.Find(x => x.slot == category);
            string replaced = existing?.itemId;
            if (existing == null) save.equipment.Add(new EquipmentEntry { slot = category, itemId = itemId });
            else existing.itemId = itemId;
            return replaced;
        }

        public static StatBlock EffectiveStats(SaveData save)
        {
            if (save == null) throw new ArgumentNullException(nameof(save));
            StatBlock result = save.baseStats;
            foreach (EquipmentEntry item in save.equipment) result += ModifiersFor(item.itemId);
            ApplyUpgradeStats(save, ref result);
            result.ClampMinimums();
            return result;
        }

        public static StatBlock ModifiersFor(string itemId)
        {
            return itemId switch
            {
                "iron_sword" => new StatBlock { strength = 2 },
                "scholar_staff" => new StatBlock { magic = 2, intelligence = 2 },
                "leather_armour" => new StatBlock { maxHealth = 10, defence = 2 },
                "scout_helmet" => new StatBlock { defence = 1, agility = 1 },
                "fraction_charm" => new StatBlock { intelligence = 1, maxFocus = 5 },
                "lucky_dice" => new StatBlock { luck = 2 },
                _ => default
            };
        }

        public static int UseConsumable(SaveData save, string itemId)
        {
            if (save == null || !InventoryOperations.Remove(save.inventory, itemId, 1)) return 0;
            StatBlock effective = EffectiveStats(save);
            if (itemId == "healing_potion")
            {
                int rank = UpgradeRules.Rank(save, "improved_healing");
                int amount = 35 + rank * 10;
                int before = save.currentHealth; save.currentHealth = Math.Min(effective.maxHealth, save.currentHealth + amount); return save.currentHealth - before;
            }
            if (itemId == "focus_potion")
            {
                int before = save.currentFocus; save.currentFocus = Math.Min(effective.maxFocus, save.currentFocus + 20); return save.currentFocus - before;
            }
            return 0;
        }

        private static void ApplyUpgradeStats(SaveData save, ref StatBlock stats)
        {
            stats.maxFocus += UpgradeRules.Rank(save, "focus_reserve") * 5;
            stats.luck += UpgradeRules.Rank(save, "critical_training");
        }
    }

    public readonly struct UpgradeDefinition
    {
        public readonly string Id;
        public readonly string Name;
        public readonly string Description;
        public readonly int BaseCost;
        public readonly int MaximumRank;
        public UpgradeDefinition(string id, string name, string description, int cost, int maximumRank)
        { Id = id; Name = name; Description = description; BaseCost = cost; MaximumRank = maximumRank; }
    }

    public static class UpgradeRules
    {
        public static readonly IReadOnlyList<UpgradeDefinition> Definitions = new[]
        {
            new UpgradeDefinition("maths_bonus", "Maths Spark", "Adds power to future maths abilities.", 2, 3),
            new UpgradeDefinition("question_time", "Thinking Time", "Adds 10% question time per rank.", 2, 3),
            new UpgradeDefinition("improved_healing", "Potion Lore", "Healing Potions restore 10 more health.", 2, 3),
            new UpgradeDefinition("critical_training", "Lucky Strikes", "Improves Luck and critical potential.", 3, 2),
            new UpgradeDefinition("dice_training", "Dice Mastery", "Adds +1 to prepared dice checks.", 3, 3),
            new UpgradeDefinition("focus_reserve", "Focus Reserve", "Adds 5 maximum Focus.", 2, 3),
            new UpgradeDefinition("second_chance", "Second Chance", "Unlocks protection from one mistake.", 4, 1)
        };

        public static int Rank(SaveData save, string id) => save?.upgrades?.Find(x => x.upgradeId == id)?.rank ?? 0;
        public static int NextCost(SaveData save, UpgradeDefinition definition) => definition.BaseCost + Rank(save, definition.Id);

        public static bool Purchase(SaveData save, string id)
        {
            if (save == null) return false;
            UpgradeDefinition definition = default;
            bool found = false;
            foreach (UpgradeDefinition candidate in Definitions) if (candidate.Id == id) { definition = candidate; found = true; break; }
            if (!found) return false;
            int rank = Rank(save, id);
            int cost = definition.BaseCost + rank;
            if (rank >= definition.MaximumRank || save.knowledgePoints < cost) return false;
            UpgradeRankEntry entry = save.upgrades.Find(x => x.upgradeId == id);
            if (entry == null) { entry = new UpgradeRankEntry { upgradeId = id }; save.upgrades.Add(entry); }
            save.knowledgePoints -= cost; entry.rank++;
            if (id == "second_chance" && !save.unlockedAbilityIds.Contains("second_chance")) save.unlockedAbilityIds.Add("second_chance");
            return true;
        }
    }
}
