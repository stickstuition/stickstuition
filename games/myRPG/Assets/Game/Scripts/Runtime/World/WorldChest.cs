using System.Collections;
using MyRPG.Core;
using MyRPG.Inventory;
using UnityEngine;

namespace MyRPG.World
{
    public sealed class WorldChest : MonoBehaviour, IInteractable
    {
        [SerializeField] private string chestId = "village_chest";
        [SerializeField] private string itemId = "healing_potion";
        [SerializeField, Min(1)] private int quantity = 1;
        [SerializeField] private Transform lid;
        private bool _opened;
        public string InteractionPrompt => "Open chest";
        public bool CanInteract => !_opened;

        private void Start()
        {
            var save = GameBootstrap.Instance?.Session?.Save;
            _opened = save != null && save.openedChestIds.Contains(chestId);
            if (_opened && lid != null) lid.localRotation = Quaternion.Euler(-105f, 0f, 0f);
        }

        public void Interact(PlayerController player)
        {
            if (_opened) return;
            _opened = true;
            var session = GameBootstrap.Instance?.Session;
            if (session != null && session.HasActiveSave)
            {
                InventoryOperations.Add(session.Save.inventory, itemId, quantity, 9);
                session.Save.openedChestIds.Add(chestId);
                WorldSaveUtility.SaveAt(player.transform);
            }
            WorldUI.Instance?.ShowNotice($"Found {quantity} × {itemId.Replace('_', ' ')}!");
            if (lid != null) StartCoroutine(OpenLid());
        }

        private IEnumerator OpenLid()
        {
            Quaternion start = lid.localRotation, end = Quaternion.Euler(-105f, 0f, 0f);
            for (float elapsed = 0f; elapsed < 0.5f; elapsed += Time.deltaTime) { lid.localRotation = Quaternion.Slerp(start, end, elapsed / 0.5f); yield return null; }
            lid.localRotation = end;
        }
    }
}
