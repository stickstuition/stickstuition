using MyRPG.Core;
using MyRPG.Saving;
using UnityEngine;

namespace MyRPG.World
{
    public static class WorldSaveUtility
    {
        public static bool SaveAt(Transform player, string checkpointId = null)
        {
            GameSession session = GameBootstrap.Instance?.Session;
            if (session == null || !session.HasActiveSave) return false;
            Vector3 position = player.position;
            session.Save.playerPosition = new SerializableVector3 { x = position.x, y = position.y, z = position.z };
            if (!string.IsNullOrWhiteSpace(checkpointId)) session.Save.checkpointId = checkpointId;
            bool saved = session.SaveNow();
            if (saved) WorldUI.Instance?.ShowAutosave();
            return saved;
        }
    }
}
