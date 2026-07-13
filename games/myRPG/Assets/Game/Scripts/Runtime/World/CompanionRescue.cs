using MyRPG.Core;
using MyRPG.Data;
using UnityEngine;

namespace MyRPG.World
{
    public sealed class CompanionRescue : MonoBehaviour, IInteractable
    {
        [SerializeField] private CompanionId companion;
        [TextArea, SerializeField] private string rescueDialogue = "Thank you! I’ll join your adventure.";
        private bool _rescued;
        public string InteractionPrompt => _rescued ? $"{companion} has joined" : $"Rescue {companion}";
        public bool CanInteract => !_rescued;

        private void Start()
        {
            _rescued = GameBootstrap.Instance?.Session?.Save?.unlockedCompanions.Contains(companion) == true;
            if (_rescued) gameObject.SetActive(false);
        }

        public void Interact(PlayerController player)
        {
            var session = GameBootstrap.Instance?.Session;
            if (session == null || !session.HasActiveSave) return;
            if (!session.Save.unlockedCompanions.Contains(companion)) session.Save.unlockedCompanions.Add(companion);
            session.Save.knowledgePoints += 2;
            _rescued = true; WorldSaveUtility.SaveAt(player.transform);
            WorldUI.Instance?.ShowNotice($"{rescueDialogue}\n{companion} joined the party!  +2 Knowledge", 5f);
            WorldUI.Instance?.SetObjective("Reach the chapter exit");
            gameObject.SetActive(false);
        }
    }
}
