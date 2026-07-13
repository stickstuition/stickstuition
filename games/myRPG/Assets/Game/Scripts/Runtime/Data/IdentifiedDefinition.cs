using UnityEngine;

namespace MyRPG.Data
{
    public abstract class IdentifiedDefinition : ScriptableObject
    {
        [SerializeField] private string id;
        [SerializeField] private string displayName;
        [TextArea, SerializeField] private string description;

        public string Id => id;
        public string DisplayName => displayName;
        public string Description => description;
    }

}
