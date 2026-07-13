using MyRPG.Core;
using MyRPG.Inventory;
using UnityEngine;

namespace MyRPG.World
{
    public sealed class WorldCollectible : MonoBehaviour, IInteractable
    {
        [SerializeField] private string collectibleId = "village_coin";
        [SerializeField] private string itemId = "coin";
        [SerializeField] private int quantity = 1;
        public string InteractionPrompt => $"Collect {itemId.Replace('_', ' ')}";
        public bool CanInteract => gameObject.activeSelf;

        private void Start()
        {
            if (GameBootstrap.Instance?.Session?.Save?.openedChestIds.Contains(collectibleId) == true) gameObject.SetActive(false);
        }

        public void Interact(PlayerController player)
        {
            var session = GameBootstrap.Instance?.Session;
            if (session != null && session.HasActiveSave)
            {
                InventoryOperations.Add(session.Save.inventory, itemId, quantity, 99);
                session.Save.openedChestIds.Add(collectibleId);
                WorldSaveUtility.SaveAt(player.transform);
            }
            WorldUI.Instance?.ShowNotice($"Collected {itemId.Replace('_', ' ')}");
            gameObject.SetActive(false);
        }
    }
}
