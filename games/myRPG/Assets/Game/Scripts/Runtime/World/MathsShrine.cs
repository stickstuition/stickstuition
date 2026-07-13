using MyRPG.Data;
using MyRPG.Education;
using UnityEngine;

namespace MyRPG.World
{
    public sealed class MathsShrine : MonoBehaviour, IInteractable
    {
        [SerializeField] private ArithmeticSubtopic subtopic = ArithmeticSubtopic.Multiplication;
        public string InteractionPrompt => $"Use {subtopic} shrine";
        public bool CanInteract => QuestionManager.Instance != null;

        public void Interact(PlayerController player)
        {
            QuestionManager.Instance.Begin(subtopic, outcome =>
                WorldUI.Instance?.ShowNotice(outcome.Correct ? "The shrine glows with maths power!" : "The shrine is ready when you want more practice."));
        }
    }
}
