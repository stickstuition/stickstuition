using UnityEngine;

namespace MyRPG.World
{
    public sealed class WorldSign : MonoBehaviour, IInteractable
    {
        [SerializeField] private string prompt = "Read sign";
        [TextArea, SerializeField] private string message = "The Broken Road lies beyond the village gate.";
        public string InteractionPrompt => prompt;
        public bool CanInteract => true;
        public void Interact(PlayerController player) => WorldUI.Instance?.ShowNotice(message, 4f);
    }
}
