namespace MyRPG.World
{
    public interface IInteractable
    {
        string InteractionPrompt { get; }
        bool CanInteract { get; }
        void Interact(PlayerController player);
    }
}
