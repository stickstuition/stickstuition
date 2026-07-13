using UnityEngine;
namespace MyRPG.Data
{
    [CreateAssetMenu(menuName = "MyRPG/Data/Character Class")]
    public sealed class CharacterClassDefinition : IdentifiedDefinition
    {
        [SerializeField] private CharacterClassId classId;
        [SerializeField] private StatBlock startingStats;
        [SerializeField] private AbilityDefinition specialAbility;
        [SerializeField] private GameObject characterModel;
        public CharacterClassId ClassId => classId;
        public StatBlock StartingStats => startingStats;
        public AbilityDefinition SpecialAbility => specialAbility;
        public GameObject CharacterModel => characterModel;
    }
}
