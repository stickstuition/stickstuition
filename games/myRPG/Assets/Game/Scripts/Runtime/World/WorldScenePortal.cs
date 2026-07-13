using MyRPG.Core;
using UnityEngine;

namespace MyRPG.World
{
    public sealed class WorldScenePortal : MonoBehaviour, IInteractable
    {
        [SerializeField] private string prompt = "Travel onward";
        [SerializeField] private string targetScene = SceneNames.BrokenRoad;
        [SerializeField] private string requiredCompletedId;
        public string InteractionPrompt => prompt;
        public bool CanInteract => true;

        public void Interact(PlayerController player)
        {
            var save = GameBootstrap.Instance?.Session?.Save;
            if (save == null) return;
            if (!string.IsNullOrWhiteSpace(requiredCompletedId) &&
                !save.openedChestIds.Contains(requiredCompletedId) &&
                !save.defeatedEnemyIds.Contains(requiredCompletedId))
            {
                WorldUI.Instance?.ShowNotice("The way is still blocked. Complete the nearby challenge first.");
                return;
            }
            save.playerPosition = default;
            GameBootstrap.Instance.Session.SaveNow();
            GameBootstrap.Instance.LoadGameplayScene(targetScene);
        }
    }
}
