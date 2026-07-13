using MyRPG.Core;
using UnityEngine;

namespace MyRPG.World
{
    public sealed class WorldHazard : MonoBehaviour
    {
        [SerializeField, Min(1)] private int damage = 15;
        [SerializeField] private Vector3 fallbackSpawn = new Vector3(0f, 0.1f, -7f);
        private float _lastTriggerTime = -10f;

        private void OnTriggerEnter(Collider other)
        {
            if (Time.unscaledTime - _lastTriggerTime < 1f || !other.TryGetComponent(out PlayerController player)) return;
            _lastTriggerTime = Time.unscaledTime;
            GameSession session = GameBootstrap.Instance?.Session;
            Vector3 respawn = fallbackSpawn;
            if (session != null && session.HasActiveSave)
            {
                session.Save.currentHealth = Mathf.Max(1, session.Save.currentHealth - damage);
                var p = session.Save.playerPosition;
                if (p.x != 0f || p.y != 0f || p.z != 0f) respawn = new Vector3(p.x, p.y, p.z);
                session.SaveNow();
            }
            player.Warp(respawn);
            WorldUI.Instance?.ShowNotice($"Watch your step!  −{damage} health");
        }
    }
}
