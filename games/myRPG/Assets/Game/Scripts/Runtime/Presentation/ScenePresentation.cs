using System.Collections;
using MyRPG.Settings;
using UnityEngine;
using UnityEngine.UI;

namespace MyRPG.Presentation
{
    /// <summary>Scene-local ambience and reusable, settings-aware feedback.</summary>
    public sealed class ScenePresentation : MonoBehaviour
    {
        public static ScenePresentation Instance { get; private set; }
        [SerializeField] private AudioClip ambience;
        [SerializeField] private AudioClip attackSound;
        [SerializeField] private AudioClip impactSound;
        [SerializeField] private GameObject hitParticles;
        [SerializeField] private GameObject magicParticles;
        private AudioSource _ambienceSource;
        private AudioSource _effectsSource;

        private void Awake()
        {
            Instance = this;
            GameSettings settings = SettingsManager.Load();
            _ambienceSource = gameObject.AddComponent<AudioSource>();
            _ambienceSource.loop = true; _ambienceSource.playOnAwake = false;
            _ambienceSource.clip = ambience; _ambienceSource.volume = settings.musicVolume * 0.55f;
            _effectsSource = gameObject.AddComponent<AudioSource>();
            _effectsSource.playOnAwake = false; _effectsSource.volume = settings.soundEffectsVolume;
            if (ambience != null) _ambienceSource.Play();
        }

        public void Attack(Vector3 position, bool magical = false)
        {
            Play(attackSound);
            GameObject prefab = magical ? magicParticles : hitParticles;
            if (prefab != null) Destroy(Instantiate(prefab, position + Vector3.up, Quaternion.identity), 3f);
        }

        public void Impact(Vector3 position) { Play(impactSound); IsometricCameraShake(position); }

        private void Play(AudioClip clip) { if (clip != null) _effectsSource.PlayOneShot(clip); }

        private static void IsometricCameraShake(Vector3 ignored)
        {
            if (!SettingsManager.Load().screenShake || SettingsManager.Load().reducedMotion) return;
            Camera.main?.GetComponent<MyRPG.World.IsometricCamera>()?.Shake(0.12f, 0.12f);
        }
    }

    /// <summary>Small first-run controls card; never blocks movement or combat.</summary>
    public sealed class TutorialCard : MonoBehaviour
    {
        private const string SeenKey = "myrpg.tutorial.controls.v1";
        private IEnumerator Start()
        {
            if (!SettingsManager.Load().tutorials || PlayerPrefs.GetInt(SeenKey, 0) != 0) yield break;
            yield return null;
            Canvas canvas = new GameObject("Tutorial Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster)).GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay; canvas.sortingOrder = 150;
            Image background = new GameObject("Card", typeof(Image)).GetComponent<Image>();
            background.transform.SetParent(canvas.transform, false); background.color = SettingsManager.Load().highContrast ? new Color(0,0,0,.96f) : new Color(.05f,.12f,.2f,.9f); background.raycastTarget=false;
            RectTransform cardRect = background.rectTransform; cardRect.anchorMin = new Vector2(.18f,.68f); cardRect.anchorMax = new Vector2(.82f,.95f); cardRect.offsetMin=cardRect.offsetMax=Vector2.zero;
            Text label = new GameObject("Controls", typeof(Text), typeof(Outline)).GetComponent<Text>();
            label.transform.SetParent(background.transform, false); label.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            label.text = "YOUR ADVENTURE BEGINS!\nWASD / ARROWS  Move     Q / E  Turn camera\nF  Interact     I  Backpack     ESC  Pause\n\nPress any movement key to continue";
            label.alignment = TextAnchor.MiddleCenter; label.fontSize = SettingsManager.Load().largeText ? 27 : 22; label.color = Color.white;
            RectTransform rect = label.rectTransform; rect.anchorMin = Vector2.zero; rect.anchorMax = Vector2.one; rect.offsetMin=rect.offsetMax=Vector2.zero;
            while (!Input.GetKeyDown(KeyCode.W) && !Input.GetKeyDown(KeyCode.A) && !Input.GetKeyDown(KeyCode.S) && !Input.GetKeyDown(KeyCode.D) && !Input.GetKeyDown(KeyCode.UpArrow) && !Input.GetKeyDown(KeyCode.DownArrow) && !Input.GetKeyDown(KeyCode.LeftArrow) && !Input.GetKeyDown(KeyCode.RightArrow)) yield return null;
            PlayerPrefs.SetInt(SeenKey, 1); PlayerPrefs.Save(); Destroy(canvas.gameObject);
        }
    }
}
