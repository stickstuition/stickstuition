using UnityEngine;

namespace MyRPG.World
{
    public sealed class WorldCheckpoint : MonoBehaviour
    {
        [SerializeField] private string checkpointId = "village_gate";
        private bool _activated;
        private void OnTriggerEnter(Collider other)
        {
            if (_activated || !other.TryGetComponent(out PlayerController player)) return;
            _activated = true;
            WorldSaveUtility.SaveAt(player.transform, checkpointId);
            WorldUI.Instance?.SetObjective("Travel along the Broken Road");
            WorldUI.Instance?.ShowNotice("Checkpoint reached!");
        }
    }
}
