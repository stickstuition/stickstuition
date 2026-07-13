using MyRPG.Core;
using MyRPG.Data;
using UnityEngine;

namespace MyRPG.World
{
    public sealed class ChapterExit : MonoBehaviour, IInteractable
    {
        [SerializeField] private int completedChapter = 1;
        [SerializeField] private CompanionId requiredCompanion = CompanionId.Bramble;
        [SerializeField] private string targetScene = SceneNames.Crypt;
        [SerializeField] private string requiredDefeatedId;
        public string InteractionPrompt => $"Complete Chapter {completedChapter}";
        public bool CanInteract => true;

        public void Interact(PlayerController player)
        {
            var save = GameBootstrap.Instance?.Session?.Save;
            if (save == null) return;
            if (requiredCompanion != CompanionId.None && !save.unlockedCompanions.Contains(requiredCompanion))
            {
                WorldUI.Instance?.ShowNotice($"Find and rescue {requiredCompanion} before leaving.");
                return;
            }
            if (!string.IsNullOrWhiteSpace(requiredDefeatedId) && !save.defeatedEnemyIds.Contains(requiredDefeatedId))
            {
                WorldUI.Instance?.ShowNotice("The chapter’s guardian must be defeated first.");
                return;
            }
            ChapterReportUI.Instance?.Show(completedChapter, targetScene);
        }
    }
}
