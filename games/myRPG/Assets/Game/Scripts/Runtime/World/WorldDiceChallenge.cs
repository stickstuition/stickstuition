using MyRPG.Core;
using MyRPG.Data;
using MyRPG.Dice;
using MyRPG.Education;
using UnityEngine;
using MyRPG.Inventory;

namespace MyRPG.World
{
    public sealed class WorldDiceChallenge : MonoBehaviour, IInteractable
    {
        [SerializeField] private string challengeId = "village_old_gate";
        [SerializeField] private string title = "The Old Road Gate";
        [TextArea, SerializeField] private string description = "Use your wits and preparation to release the rusted lock.";
        [SerializeField] private int difficultyClass = 12;
        [SerializeField] private DiceStat relevantStat = DiceStat.Intelligence;
        [SerializeField] private bool offerMathsAdvantage = true;
        [SerializeField] private ArithmeticSubtopic mathsSubtopic = ArithmeticSubtopic.Addition;
        [SerializeField] private GameObject successBarrier;
        private bool _complete;
        public string InteractionPrompt => _complete ? "Gate unlocked" : "Attempt dice challenge";
        public bool CanInteract => !_complete && DiceManager.Instance != null;

        private void Start()
        {
            _complete = GameBootstrap.Instance?.Session?.Save?.openedChestIds.Contains(challengeId) == true;
            if (_complete && successBarrier != null) successBarrier.SetActive(false);
        }

        public void Interact(PlayerController player)
        {
            if (offerMathsAdvantage && QuestionManager.Instance != null)
                QuestionManager.Instance.Begin(mathsSubtopic, outcome => BeginRoll(player, outcome.Correct));
            else BeginRoll(player, false);
        }

        private void BeginRoll(PlayerController player, bool mathsSucceeded)
        {
            var save = GameBootstrap.Instance?.Session?.Save;
            StatBlock stats = save != null ? EquipmentOperations.EffectiveStats(save) : new StatBlock { intelligence = 5, luck = 5 };
            int equipment = save != null && save.equipment.Exists(x => x.itemId == "lucky_dice") ? 1 : 0;
            if (save != null) equipment += UpgradeRules.Rank(save, "dice_training");
            DiceCheckRequest request = new DiceCheckRequest
            {
                challengeId = challengeId, title = title, description = description,
                difficultyClass = difficultyClass, relevantStat = relevantStat,
                equipmentBonus = equipment, temporaryBonus = mathsSucceeded ? 2 : 0,
                advantage = mathsSucceeded
            };
            DiceManager.Instance.Begin(request, stats, result => Resolve(player, result));
        }

        private void Resolve(PlayerController player, DiceCheckResult result)
        {
            if (!result.Success)
            {
                WorldUI.Instance?.ShowNotice("The lock holds. You can prepare and try again.");
                return;
            }
            _complete = true;
            if (successBarrier != null) successBarrier.SetActive(false);
            var session = GameBootstrap.Instance?.Session;
            if (session != null && session.HasActiveSave && !session.Save.openedChestIds.Contains(challengeId))
            {
                session.Save.openedChestIds.Add(challengeId);
                session.Save.knowledgePoints += 1;
                WorldSaveUtility.SaveAt(player.transform);
            }
            WorldUI.Instance?.ShowNotice("The gate unlocks!  +1 Knowledge");
            WorldUI.Instance?.SetObjective("Follow the road beyond the village");
        }
    }
}
