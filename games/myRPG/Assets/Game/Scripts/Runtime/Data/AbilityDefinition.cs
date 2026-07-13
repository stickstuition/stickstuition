using UnityEngine;
namespace MyRPG.Data
{
    [CreateAssetMenu(menuName = "MyRPG/Data/Ability")]
    public sealed class AbilityDefinition : IdentifiedDefinition
    {
        [Min(0), SerializeField] private int focusCost;
        [Min(0), SerializeField] private int basePower;
        [SerializeField] private AbilityTarget target;
        [SerializeField] private bool requiresMaths;
        public int FocusCost => focusCost;
        public int BasePower => basePower;
        public AbilityTarget Target => target;
        public bool RequiresMaths => requiresMaths;
    }
}
