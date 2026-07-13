using System;
using MyRPG.Saving;

namespace MyRPG.Core
{
    /// <summary>Owns the active save while the persistent bootstrap is alive.</summary>
    public sealed class GameSession
    {
        private readonly SaveManager _saves;
        public int ActiveSlot { get; private set; } = -1;
        public SaveData Save { get; private set; }
        public bool HasActiveSave => ActiveSlot >= 0 && Save != null;

        public GameSession(SaveManager saves) { _saves = saves ?? throw new ArgumentNullException(nameof(saves)); }

        public bool Load(int slot)
        {
            if (_saves.TryLoad(slot, out SaveData save) != SaveLoadStatus.Success) return false;
            ActiveSlot = slot;
            Save = save;
            return true;
        }

        public void UseNew(int slot, SaveData save)
        {
            if (slot < 0 || slot >= SaveManager.SlotCount) throw new ArgumentOutOfRangeException(nameof(slot));
            ActiveSlot = slot;
            Save = save ?? throw new ArgumentNullException(nameof(save));
        }

        public bool SaveNow()
        {
            if (!HasActiveSave) return false;
            _saves.Save(ActiveSlot, Save);
            return true;
        }

        public void Clear() { ActiveSlot = -1; Save = null; }
    }
}
