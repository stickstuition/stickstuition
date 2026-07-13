using System;
using MyRPG.Data;
using MyRPG.Inventory;

namespace MyRPG.Saving
{
    public enum AdventureCreationStatus { Success, InvalidSlot, NameRequired, NameTooLong }

    public sealed class AdventureSetupService
    {
        public const int MaximumNameLength = 18;
        private readonly SaveManager _saveManager;

        public AdventureSetupService(SaveManager saveManager)
        {
            _saveManager = saveManager ?? throw new ArgumentNullException(nameof(saveManager));
        }

        public AdventureCreationStatus Create(int slot, string adventurerName, CharacterClassId classId, StatBlock stats, out SaveData save)
        {
            save = null;
            if (slot < 0 || slot >= SaveManager.SlotCount) return AdventureCreationStatus.InvalidSlot;
            string cleanName = adventurerName?.Trim();
            if (string.IsNullOrWhiteSpace(cleanName)) return AdventureCreationStatus.NameRequired;
            if (cleanName.Length > MaximumNameLength) return AdventureCreationStatus.NameTooLong;

            save = SaveData.CreateNew(cleanName, classId, stats);
            InventoryOperations.Add(save.inventory, "healing_potion", 2, 9);
            InventoryOperations.Add(save.inventory, "focus_potion", 1, 9);
            InventoryOperations.Add(save.inventory, "second_chance_scroll", 1, 3);
            string starterEquipment = classId switch
            {
                CharacterClassId.Knight => "iron_sword",
                CharacterClassId.Mage => "scholar_staff",
                CharacterClassId.Ranger => "scout_helmet",
                CharacterClassId.Rogue => "leather_armour",
                _ => "iron_sword"
            };
            InventoryOperations.Add(save.inventory, starterEquipment, 1, 1);
            save.unlockedAbilityIds.Add(ClassAbilityId(classId));
            _saveManager.Save(slot, save);
            return AdventureCreationStatus.Success;
        }

        private static string ClassAbilityId(CharacterClassId classId)
        {
            return classId switch
            {
                CharacterClassId.Knight => "shield_wall",
                CharacterClassId.Mage => "number_flame",
                CharacterClassId.Ranger => "quick_volley",
                CharacterClassId.Rogue => "lucky_trick",
                _ => throw new ArgumentOutOfRangeException(nameof(classId))
            };
        }
    }

    public readonly struct SaveSlotSummary
    {
        public readonly int Slot;
        public readonly bool Occupied;
        public readonly string Title;
        public readonly string Detail;

        public SaveSlotSummary(int slot, SaveLoadStatus status, SaveData save)
        {
            Slot = slot;
            Occupied = status == SaveLoadStatus.Success && save != null;
            Title = Occupied ? save.displayTitle : $"Save Slot {slot + 1} — Empty";
            Detail = Occupied
                ? $"Level {save.level} {save.characterClass}  •  Chapter {save.currentChapter}"
                : "Begin a new adventure";
        }
    }
}
