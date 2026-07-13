using System.Collections;
using UnityEngine;

namespace MyRPG.World
{
    public sealed class WorldDoor : MonoBehaviour, IInteractable
    {
        [SerializeField] private Transform hinge;
        [SerializeField] private float openAngle = 95f;
        [SerializeField] private float duration = 0.45f;
        private bool _open;
        private bool _moving;
        public string InteractionPrompt => _open ? "Close gate" : "Open gate";
        public bool CanInteract => !_moving;

        public void Interact(PlayerController player) => StartCoroutine(RotateDoor(!_open));

        private IEnumerator RotateDoor(bool opening)
        {
            _moving = true;
            Transform target = hinge != null ? hinge : transform;
            Quaternion start = target.localRotation;
            Quaternion end = Quaternion.Euler(0f, opening ? openAngle : 0f, 0f);
            for (float elapsed = 0f; elapsed < duration; elapsed += Time.deltaTime)
            {
                target.localRotation = Quaternion.Slerp(start, end, elapsed / duration);
                yield return null;
            }
            target.localRotation = end; _open = opening; _moving = false;
        }
    }
}
