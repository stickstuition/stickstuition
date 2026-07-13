using UnityEngine;
namespace MyRPG.Data
{
    [CreateAssetMenu(menuName = "MyRPG/Data/Enemy")]
    public sealed class EnemyDefinition : IdentifiedDefinition
    {
        [SerializeField] private StatBlock stats;
        [Min(0), SerializeField] private int experienceReward;
        [SerializeField] private bool boss;
        [SerializeField] private GameObject prefab;
        [SerializeField] private AbilityDefinition[] abilities;
        public StatBlock Stats => stats;
        public int ExperienceReward => experienceReward;
        public bool IsBoss => boss;
        public GameObject Prefab => prefab;
        public AbilityDefinition[] Abilities => abilities;
    }
}
