using UnityEngine;
namespace MyRPG.Data
{
    [CreateAssetMenu(menuName = "MyRPG/Data/Item")]
    public sealed class ItemDefinition : IdentifiedDefinition
    {
        [SerializeField] private ItemCategory category;
        [SerializeField] private bool stackable;
        [Min(1), SerializeField] private int maximumStack = 1;
        [SerializeField] private StatBlock statModifiers;
        [SerializeField] private Sprite icon;
        public ItemCategory Category => category;
        public bool Stackable => stackable;
        public int MaximumStack => stackable ? maximumStack : 1;
        public StatBlock StatModifiers => statModifiers;
        public Sprite Icon => icon;
    }
}
