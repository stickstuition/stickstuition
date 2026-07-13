using UnityEngine;
namespace MyRPG.Data
{
    [CreateAssetMenu(menuName = "MyRPG/Data/Arithmetic Topic")]
    public sealed class ArithmeticTopicDefinition : IdentifiedDefinition
    {
        [SerializeField] private ArithmeticSubtopic[] subtopics;
        [Range(5, 60), SerializeField] private int defaultTimeLimitSeconds = 20;
        public ArithmeticSubtopic[] Subtopics => subtopics;
        public int DefaultTimeLimitSeconds => defaultTimeLimitSeconds;
    }
}
