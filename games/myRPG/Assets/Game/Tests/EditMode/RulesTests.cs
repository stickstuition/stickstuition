using System.Collections.Generic;
using MyRPG.Inventory;
using MyRPG.Player;
using MyRPG.Saving;
using MyRPG.Settings;
using MyRPG.Data;
using NUnit.Framework;

namespace MyRPG.Tests
{
    public sealed class RulesTests
    {
        [Test]
        public void InventoryStacksToConfiguredLimit()
        {
            List<InventoryEntry> inventory = new List<InventoryEntry>();
            Assert.That(InventoryOperations.Add(inventory, "potion", 12, 9), Is.EqualTo(3));
            Assert.That(inventory[0].quantity, Is.EqualTo(9));
            Assert.That(InventoryOperations.Remove(inventory, "potion", 4), Is.True);
            Assert.That(inventory[0].quantity, Is.EqualTo(5));
        }

        [TestCase(1, 0, 1)]
        [TestCase(1, 99, 1)]
        [TestCase(1, 100, 2)]
        [TestCase(1, 400, 3)]
        public void ProgressionResolvesExpectedLevel(int current, int xp, int expected)
        {
            Assert.That(ProgressionRules.ResolveLevel(current, xp), Is.EqualTo(expected));
        }

        [Test]
        public void PerformanceTracksStreakAccuracyAndGrade()
        {
            EducationalPerformance performance = new EducationalPerformance();
            for (int i = 0; i < 9; i++) performance.Record("addition", $"a{i}", true, 4f, false);
            performance.Record("addition", "wrong", false, 8f, false);
            Assert.That(performance.Accuracy, Is.EqualTo(0.9f).Within(0.001f));
            Assert.That(performance.bestStreak, Is.EqualTo(9));
            Assert.That(performance.currentStreak, Is.Zero);
            Assert.That(performance.ChapterGrade(), Is.EqualTo("A"));
        }

        [Test]
        public void SettingsNormalizeUnsafeValues()
        {
            GameSettings settings = new GameSettings
            {
                masterVolume = 4f,
                musicVolume = -2f,
                resolutionWidth = 1,
                resolutionHeight = 1,
                questionTimeMultiplier = 20f
            };
            settings.Normalize();
            Assert.That(settings.masterVolume, Is.EqualTo(1f));
            Assert.That(settings.musicVolume, Is.Zero);
            Assert.That(settings.resolutionWidth, Is.EqualTo(640));
            Assert.That(settings.resolutionHeight, Is.EqualTo(360));
            Assert.That(settings.questionTimeMultiplier, Is.EqualTo(3f));
        }

        [Test]
        public void EquipmentChangesEffectiveStatsAndReplacesOnlyItsSlot()
        {
            SaveData save = SaveData.CreateNew("Kit", CharacterClassId.Knight,
                new StatBlock { maxHealth = 100, maxFocus = 20, strength = 5, defence = 5, magic = 2, intelligence = 4, agility = 4, luck = 4 });
            save.inventory.Add(new InventoryEntry { itemId = "iron_sword", quantity = 1 });
            save.inventory.Add(new InventoryEntry { itemId = "scholar_staff", quantity = 1 });
            EquipmentOperations.Equip(save, "iron_sword", ItemCategory.Weapon);
            Assert.That(EquipmentOperations.EffectiveStats(save).strength, Is.EqualTo(7));
            Assert.That(EquipmentOperations.Equip(save, "scholar_staff", ItemCategory.Weapon), Is.EqualTo("iron_sword"));
            Assert.That(save.equipment.Count, Is.EqualTo(1));
            Assert.That(EquipmentOperations.EffectiveStats(save).intelligence, Is.EqualTo(6));
        }

        [Test]
        public void KnowledgePurchasesRespectCostAndMaximumRank()
        {
            SaveData save = SaveData.CreateNew("Sage", CharacterClassId.Mage, new StatBlock { maxHealth = 80, maxFocus = 40 });
            save.knowledgePoints = 20;
            Assert.That(UpgradeRules.Purchase(save, "improved_healing"), Is.True);
            Assert.That(UpgradeRules.Rank(save, "improved_healing"), Is.EqualTo(1));
            Assert.That(save.knowledgePoints, Is.EqualTo(18));
            Assert.That(UpgradeRules.Purchase(save, "improved_healing"), Is.True);
            Assert.That(UpgradeRules.Purchase(save, "improved_healing"), Is.True);
            Assert.That(UpgradeRules.Purchase(save, "improved_healing"), Is.False);
        }

        [Test]
        public void ImprovedHealingConsumesPotionAndRestoresMore()
        {
            SaveData save = SaveData.CreateNew("Healer", CharacterClassId.Mage, new StatBlock { maxHealth = 100, maxFocus = 20 });
            save.currentHealth = 20; save.knowledgePoints = 10;
            save.inventory.Add(new InventoryEntry { itemId = "healing_potion", quantity = 1 });
            UpgradeRules.Purchase(save, "improved_healing");
            Assert.That(EquipmentOperations.UseConsumable(save, "healing_potion"), Is.EqualTo(45));
            Assert.That(save.currentHealth, Is.EqualTo(65));
            Assert.That(save.inventory, Is.Empty);
        }
    }
}
