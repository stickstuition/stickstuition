using UnityEngine;
namespace MyRPG.Data
{
    [CreateAssetMenu(menuName = "MyRPG/Data/Companion")]
    public sealed class CompanionDefinition : IdentifiedDefinition
    {
        [SerializeField] private CompanionId companionId;
        [Min(1), SerializeField] private int unlockChapter = 1;
        [SerializeField] private StatBlock baseStats;
        [SerializeField] private AbilityDefinition signatureAbility;
        [SerializeField] private GameObject characterModel;
        public CompanionId CompanionId => companionId;
        public int UnlockChapter => unlockChapter;
        public StatBlock BaseStats => baseStats;
        public AbilityDefinition SignatureAbility => signatureAbility;
        public GameObject CharacterModel => characterModel;
    }
}
