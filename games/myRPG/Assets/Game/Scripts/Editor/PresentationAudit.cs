using System.Linq;
using UnityEditor;
using UnityEngine;

namespace MyRPG.Editor
{
    public static class PresentationAudit
    {
        public static void Run()
        {
            string[] animationGuids = AssetDatabase.FindAssets("t:AnimationClip", new[] { "Assets/ThirdParty/KayKit/Adventurers/Animations", "Assets/ThirdParty/KayKit/Skeletons/Animations" });
            string[] clips = animationGuids.SelectMany(g => AssetDatabase.LoadAllAssetsAtPath(AssetDatabase.GUIDToAssetPath(g)))
                .OfType<AnimationClip>().Where(x => !x.name.StartsWith("__preview__")).Select(x => x.name).Distinct().OrderBy(x => x).ToArray();
            Debug.Log("MYRPG_ANIMATION_CLIPS=" + string.Join("|", clips));
            string[] particles = AssetDatabase.FindAssets("t:Prefab", new[] { "Assets/Kenney/Particle samples/Prefabs" })
                .Select(AssetDatabase.GUIDToAssetPath).OrderBy(x => x).ToArray();
            Debug.Log("MYRPG_PARTICLE_PREFABS=" + string.Join("|", particles));
            string[] audio = AssetDatabase.FindAssets("t:AudioClip", new[] { "Assets/ThirdParty/Audio" })
                .Select(AssetDatabase.GUIDToAssetPath).Where(x => x.Contains("BGS Loops")).OrderBy(x => x).ToArray();
            Debug.Log("MYRPG_AMBIENCE=" + string.Join("|", audio));
        }
    }
}
