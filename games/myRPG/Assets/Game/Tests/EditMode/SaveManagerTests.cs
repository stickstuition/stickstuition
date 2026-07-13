using System.IO;
using MyRPG.Data;
using MyRPG.Saving;
using NUnit.Framework;

namespace MyRPG.Tests
{
    public sealed class SaveManagerTests
    {
        private string _folder;
        private SaveManager _manager;

        [SetUp]
        public void SetUp()
        {
            _folder = Path.Combine(Path.GetTempPath(), "MyRPGTests", System.Guid.NewGuid().ToString("N"));
            _manager = new SaveManager(_folder);
        }

        [TearDown]
        public void TearDown()
        {
            if (Directory.Exists(_folder)) Directory.Delete(_folder, true);
        }

        [Test]
        public void NewSaveRoundTripsAllCoreIdentity()
        {
            SaveData created = SaveData.CreateNew("Robin", CharacterClassId.Ranger, Stats());
            _manager.Save(0, created);
            Assert.That(_manager.TryLoad(0, out SaveData loaded), Is.EqualTo(SaveLoadStatus.Success));
            Assert.That(loaded.adventurerName, Is.EqualTo("Robin"));
            Assert.That(loaded.displayTitle, Is.EqualTo("Robin’s Great Adventure"));
            Assert.That(loaded.characterClass, Is.EqualTo(CharacterClassId.Ranger));
            Assert.That(loaded.currentHealth, Is.EqualTo(100));
        }

        [Test]
        public void ThreeSlotsRemainIndependent()
        {
            for (int slot = 0; slot < SaveManager.SlotCount; slot++)
                _manager.Save(slot, SaveData.CreateNew($"Hero {slot}", CharacterClassId.Knight, Stats()));
            for (int slot = 0; slot < SaveManager.SlotCount; slot++)
            {
                _manager.TryLoad(slot, out SaveData loaded);
                Assert.That(loaded.adventurerName, Is.EqualTo($"Hero {slot}"));
            }
        }

        [Test]
        public void CorruptPrimaryRecoversPreviousBackup()
        {
            SaveData data = SaveData.CreateNew("Ada", CharacterClassId.Mage, Stats());
            _manager.Save(0, data);
            data.level = 2;
            _manager.Save(0, data);
            File.WriteAllText(Path.Combine(_folder, "slot-1.json"), "{broken");
            Assert.That(_manager.TryLoad(0, out SaveData recovered), Is.EqualTo(SaveLoadStatus.Success));
            Assert.That(recovered.level, Is.EqualTo(1));
        }

        [Test]
        public void ChapterCompanionsAndBossStateRoundTrip()
        {
            SaveData data = SaveData.CreateNew("Party", CharacterClassId.Rogue, Stats());
            data.currentChapter = 3;
            data.unlockedCompanions.Add(CompanionId.Bramble);
            data.unlockedCompanions.Add(CompanionId.Lyra);
            data.defeatedEnemyIds.Add("bone_king");
            _manager.Save(1, data);
            Assert.That(_manager.TryLoad(1, out SaveData loaded), Is.EqualTo(SaveLoadStatus.Success));
            Assert.That(loaded.currentChapter, Is.EqualTo(3));
            Assert.That(loaded.unlockedCompanions, Is.EquivalentTo(new[] { CompanionId.Bramble, CompanionId.Lyra }));
            Assert.That(loaded.defeatedEnemyIds, Does.Contain("bone_king"));
        }

        [Test]
        public void InvalidAndEmptySlotsAreReported()
        {
            Assert.That(_manager.TryLoad(-1, out _), Is.EqualTo(SaveLoadStatus.InvalidSlot));
            Assert.That(_manager.TryLoad(0, out _), Is.EqualTo(SaveLoadStatus.Empty));
        }

        [Test]
        public void AdventureSetupValidatesNameAndAddsStarterKit()
        {
            AdventureSetupService setup = new AdventureSetupService(_manager);
            Assert.That(setup.Create(0, "   ", CharacterClassId.Knight, Stats(), out _), Is.EqualTo(AdventureCreationStatus.NameRequired));
            Assert.That(setup.Create(0, new string('x', 19), CharacterClassId.Knight, Stats(), out _), Is.EqualTo(AdventureCreationStatus.NameTooLong));
            Assert.That(setup.Create(0, "Pip", CharacterClassId.Knight, Stats(), out SaveData save), Is.EqualTo(AdventureCreationStatus.Success));
            Assert.That(save.inventory.Count, Is.EqualTo(4));
            Assert.That(save.version, Is.EqualTo(SaveData.CurrentVersion));
            Assert.That(save.unlockedAbilityIds, Does.Contain("shield_wall"));
            Assert.That(_manager.HasSave(0), Is.True);
        }

        private static StatBlock Stats() => new StatBlock { maxHealth = 100, maxFocus = 20, strength = 5, defence = 5, magic = 5, intelligence = 5, agility = 5, luck = 5 };
    }
}
