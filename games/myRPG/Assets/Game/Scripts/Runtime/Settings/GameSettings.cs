using System;
using UnityEngine;

namespace MyRPG.Settings
{
    [Serializable]
    public sealed class GameSettings
    {
        [Range(0f, 1f)] public float masterVolume = 1f;
        [Range(0f, 1f)] public float musicVolume = 0.75f;
        [Range(0f, 1f)] public float soundEffectsVolume = 0.85f;
        public bool fullscreen = true;
        public int resolutionWidth = 1280;
        public int resolutionHeight = 720;
        public int qualityLevel = 2;
        [Range(0.25f, 3f)] public float cameraSensitivity = 1f;
        [Range(0.25f, 3f)] public float textSpeed = 1f;
        public bool mathsTimerEnabled = true;
        [Range(0.5f, 3f)] public float questionTimeMultiplier = 1f;
        public bool screenShake = true;
        public bool damageNumbers = true;
        public bool tutorials = true;
        public bool largeText;
        public bool highContrast;
        public bool reducedMotion;
        public bool subtitles = true;

        public void Normalize()
        {
            masterVolume = Mathf.Clamp01(masterVolume);
            musicVolume = Mathf.Clamp01(musicVolume);
            soundEffectsVolume = Mathf.Clamp01(soundEffectsVolume);
            resolutionWidth = Mathf.Max(640, resolutionWidth);
            resolutionHeight = Mathf.Max(360, resolutionHeight);
            qualityLevel = Mathf.Max(0, qualityLevel);
            cameraSensitivity = Mathf.Clamp(cameraSensitivity, 0.25f, 3f);
            textSpeed = Mathf.Clamp(textSpeed, 0.25f, 3f);
            questionTimeMultiplier = Mathf.Clamp(questionTimeMultiplier, 0.5f, 3f);
        }
    }

    public static class SettingsManager
    {
        private const string PlayerPrefsKey = "myrpg.settings.v1";

        public static GameSettings Load()
        {
            string json = PlayerPrefs.GetString(PlayerPrefsKey, string.Empty);
            GameSettings settings = string.IsNullOrWhiteSpace(json) ? new GameSettings() : JsonUtility.FromJson<GameSettings>(json);
            settings ??= new GameSettings();
            settings.Normalize();
            return settings;
        }

        public static void Save(GameSettings settings)
        {
            if (settings == null) throw new ArgumentNullException(nameof(settings));
            settings.Normalize();
            PlayerPrefs.SetString(PlayerPrefsKey, JsonUtility.ToJson(settings));
            PlayerPrefs.Save();
            Apply(settings);
        }

        public static void Apply(GameSettings settings)
        {
            if (settings == null) return;
            settings.Normalize();
            AudioListener.volume = settings.masterVolume;
            if (QualitySettings.names.Length > 0)
                QualitySettings.SetQualityLevel(Mathf.Clamp(settings.qualityLevel, 0, QualitySettings.names.Length - 1), true);
#if !UNITY_WEBGL
            Screen.fullScreen = settings.fullscreen;
            Screen.SetResolution(settings.resolutionWidth, settings.resolutionHeight, settings.fullscreen);
#endif
        }

        public static void Reset() { PlayerPrefs.DeleteKey(PlayerPrefsKey); PlayerPrefs.Save(); }
    }
}
