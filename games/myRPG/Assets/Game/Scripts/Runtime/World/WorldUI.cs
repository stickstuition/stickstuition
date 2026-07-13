using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using MyRPG.Core;

namespace MyRPG.World
{
    public sealed class WorldUI : MonoBehaviour
    {
        [SerializeField] private string initialObjective = "Speak to the village guide";
        public static WorldUI Instance { get; private set; }
        private Text _prompt;
        private Text _notice;
        private Text _objective;
        private Coroutine _noticeRoutine;
        private GameObject _pausePanel;

        private void Awake()
        {
            Instance = this;
            Canvas canvas = new GameObject("World Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster)).GetComponent<Canvas>();
            canvas.transform.SetParent(transform, false);
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            CanvasScaler scaler = canvas.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280f, 720f);
            scaler.matchWidthOrHeight = 0.5f;

            _objective = CreateText(canvas.transform, "Objective", 22, TextAnchor.MiddleLeft, new Vector2(0.025f, 0.90f), new Vector2(0.55f, 0.98f));
            _objective.text = $"Objective: {initialObjective}";
            _prompt = CreateText(canvas.transform, "Interaction Prompt", 24, TextAnchor.MiddleCenter, new Vector2(0.27f, 0.06f), new Vector2(0.73f, 0.14f));
            _notice = CreateText(canvas.transform, "Notice", 22, TextAnchor.MiddleCenter, new Vector2(0.25f, 0.79f), new Vector2(0.75f, 0.88f));
            BuildPausePanel(canvas.transform);
        }

        public void SetPrompt(string value) => _prompt.text = value;
        public void SetObjective(string value) => _objective.text = $"Objective: {value}";

        public void ShowNotice(string value, float seconds = 2.5f)
        {
            if (_noticeRoutine != null) StopCoroutine(_noticeRoutine);
            _notice.text = value;
            if (!string.IsNullOrEmpty(value) && seconds > 0f) _noticeRoutine = StartCoroutine(ClearAfter(seconds));
        }

        public void ShowAutosave() => ShowNotice("Saving…  ✓", 1.5f);
        public void SetPaused(bool paused) => _pausePanel.SetActive(paused);

        private void BuildPausePanel(Transform parent)
        {
            Image panel = new GameObject("Pause Menu", typeof(RectTransform), typeof(Image)).GetComponent<Image>();
            panel.transform.SetParent(parent, false);
            RectTransform rect = panel.rectTransform; rect.anchorMin = new Vector2(0.32f, 0.22f); rect.anchorMax = new Vector2(0.68f, 0.80f); rect.offsetMin = Vector2.zero; rect.offsetMax = Vector2.zero;
            panel.color = new Color(0.10f, 0.14f, 0.17f, 0.96f);
            Text title = CreateText(panel.transform, "Paused", 36, TextAnchor.MiddleCenter, new Vector2(0.08f, 0.76f), new Vector2(0.92f, 0.94f)); title.text = "Paused";
            PauseButton(panel.transform, "Resume", 0.56f, () => Resume());
            PauseButton(panel.transform, "Save Game", 0.37f, () =>
            {
                PlayerController player = FindFirstObjectByType<PlayerController>();
                if (player != null) WorldSaveUtility.SaveAt(player.transform);
            });
            PauseButton(panel.transform, "Main Menu", 0.18f, () =>
            {
                Time.timeScale = 1f;
                GameBootstrap.Instance?.LoadGameplayScene(SceneNames.MainMenu);
            });
            _pausePanel = panel.gameObject; _pausePanel.SetActive(false);
        }

        private void Resume()
        {
            Time.timeScale = 1f;
            GameBootstrap.Instance?.ChangeState(GameState.Exploring);
            SetPaused(false);
        }

        private static void PauseButton(Transform parent, string label, float bottom, UnityEngine.Events.UnityAction action)
        {
            Image image = new GameObject(label, typeof(RectTransform), typeof(Image), typeof(Button)).GetComponent<Image>();
            image.transform.SetParent(parent, false);
            RectTransform rect = image.rectTransform; rect.anchorMin = new Vector2(0.15f, bottom); rect.anchorMax = new Vector2(0.85f, bottom + 0.13f); rect.offsetMin = Vector2.zero; rect.offsetMax = Vector2.zero;
            image.color = new Color(0.25f, 0.49f, 0.68f);
            Text text = CreateText(image.transform, label + " Label", 23, TextAnchor.MiddleCenter, Vector2.zero, Vector2.one); text.text = label;
            image.GetComponent<Button>().onClick.AddListener(action);
        }

        private IEnumerator ClearAfter(float seconds)
        {
            yield return new WaitForSecondsRealtime(seconds);
            _notice.text = string.Empty;
        }

        private static Text CreateText(Transform parent, string name, int size, TextAnchor alignment, Vector2 min, Vector2 max)
        {
            GameObject box = new GameObject(name + " Background", typeof(RectTransform), typeof(Image));
            box.transform.SetParent(parent, false);
            RectTransform rect = box.GetComponent<RectTransform>(); rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = Vector2.zero; rect.offsetMax = Vector2.zero;
            box.GetComponent<Image>().color = new Color(0.06f, 0.09f, 0.12f, 0.78f);
            Text text = new GameObject(name, typeof(RectTransform), typeof(Text)).GetComponent<Text>();
            text.transform.SetParent(box.transform, false);
            RectTransform textRect = text.rectTransform; textRect.anchorMin = Vector2.zero; textRect.anchorMax = Vector2.one; textRect.offsetMin = new Vector2(16f, 4f); textRect.offsetMax = new Vector2(-16f, -4f);
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); text.fontSize = size; text.alignment = alignment; text.color = Color.white;
            return text;
        }
    }
}
