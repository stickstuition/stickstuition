using System;
using MyRPG.Core;
using MyRPG.Data;
using UnityEngine;

namespace MyRPG.World
{
    public sealed class PlayerAvatarSelector : MonoBehaviour
    {
        [Serializable] public struct ClassAvatar { public CharacterClassId classId; public GameObject model; }
        [SerializeField] private ClassAvatar[] avatars;

        private void Start()
        {
            CharacterClassId selected = GameBootstrap.Instance?.Session?.Save?.characterClass ?? CharacterClassId.Knight;
            foreach (ClassAvatar avatar in avatars)
                if (avatar.model != null) avatar.model.SetActive(avatar.classId == selected);
        }
    }
}
