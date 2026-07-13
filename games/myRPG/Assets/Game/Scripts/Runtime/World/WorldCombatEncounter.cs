using MyRPG.Combat;
using MyRPG.Core;
using MyRPG.Data;
using UnityEngine;

namespace MyRPG.World
{
    public sealed class WorldCombatEncounter : MonoBehaviour, IInteractable
    {
        [SerializeField] private string encounterId = "village_skeleton_scout";
        [SerializeField] private string enemyName = "Skeleton Scout";
        [SerializeField] private StatBlock enemyStats = new StatBlock { maxHealth = 48, maxFocus = 10, strength = 6, defence = 3, magic = 2, intelligence = 3, agility = 7, luck = 3 };
        [SerializeField] private int experienceReward = 25;
        [SerializeField] private bool boss;
        [SerializeField] private GameObject enemyModel;
        private bool _defeated;

        public string EncounterId => encounterId;
        public string EnemyName => enemyName;
        public StatBlock EnemyStats => enemyStats;
        public int ExperienceReward => experienceReward;
        public bool IsBoss => boss;
        public GameObject EnemyModel => enemyModel != null ? enemyModel : gameObject;
        public string InteractionPrompt => $"Battle {enemyName}";
        public bool CanInteract => !_defeated && CombatManager.Instance != null;

        private void Start()
        {
            _defeated = GameBootstrap.Instance?.Session?.Save?.defeatedEnemyIds.Contains(encounterId) == true;
            if (_defeated) gameObject.SetActive(false);
        }

        public void Interact(PlayerController player) => CombatManager.Instance.Begin(this, player);

        public void MarkDefeated()
        {
            _defeated = true;
            gameObject.SetActive(false);
        }
    }
}
