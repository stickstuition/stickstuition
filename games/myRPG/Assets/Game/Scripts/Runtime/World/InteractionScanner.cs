using MyRPG.Core;
using UnityEngine;

namespace MyRPG.World
{
    public sealed class InteractionScanner : MonoBehaviour
    {
        [SerializeField, Min(0.5f)] private float radius = 2.2f;
        private readonly Collider[] _hits = new Collider[24];
        private IInteractable _current;
        private PlayerController _player;

        private void Awake() => _player = GetComponent<PlayerController>();

        private void Update()
        {
            _current = FindNearest();
            WorldUI.Instance?.SetPrompt(_current != null ? $"[F]  {_current.InteractionPrompt}" : string.Empty);
            if (_current != null && Input.GetKeyDown(KeyCode.F) &&
                (GameBootstrap.Instance == null || GameBootstrap.Instance.State == GameState.Exploring))
                _current.Interact(_player);
        }

        private IInteractable FindNearest()
        {
            int count = Physics.OverlapSphereNonAlloc(transform.position, radius, _hits, ~0, QueryTriggerInteraction.Collide);
            IInteractable nearest = null;
            float nearestDistance = float.MaxValue;
            for (int i = 0; i < count; i++)
            {
                IInteractable candidate = _hits[i].GetComponentInParent<IInteractable>();
                if (candidate == null || !candidate.CanInteract) continue;
                float distance = (_hits[i].transform.position - transform.position).sqrMagnitude;
                if (distance < nearestDistance) { nearest = candidate; nearestDistance = distance; }
            }
            return nearest;
        }
    }
}
