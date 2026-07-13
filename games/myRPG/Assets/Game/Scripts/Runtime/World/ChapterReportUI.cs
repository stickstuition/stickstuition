using MyRPG.Core;
using MyRPG.Saving;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace MyRPG.World
{
    public sealed class ChapterReportUI : MonoBehaviour
    {
        public static ChapterReportUI Instance { get; private set; }
        private GameObject _panel;
        private Text _report;
        private Button _continue;

        private void Awake() { Instance = this; BuildUI(); }

        public void Show(int completedChapter, string targetScene)
        {
            SaveData save = GameBootstrap.Instance?.Session?.Save;
            if (save == null) return;
            GameBootstrap.Instance.ChangeState(GameState.Transition);
            EducationalPerformance p = save.performance;
            _report.text =
                $"Chapter {completedChapter} Complete!\n\nGrade: {p.ChapterGrade()}\n" +
                $"Questions answered: {p.totalAnswered}\nAccuracy: {p.Accuracy * 100f:0}%\n" +
                $"Best streak: {p.bestStreak}\nKnowledge Points: {save.knowledgePoints}\n\n" +
                Encouragement(p.Accuracy);
            _continue.onClick.RemoveAllListeners();
            _continue.onClick.AddListener(() =>
            {
                save.currentChapter = completedChapter + 1; save.checkpointId = $"chapter_{completedChapter + 1}_start"; save.playerPosition = default;
                GameBootstrap.Instance.Session.SaveNow(); _panel.SetActive(false); GameBootstrap.Instance.LoadGameplayScene(targetScene);
            });
            _panel.SetActive(true); _continue.Select();
        }

        private static string Encouragement(float accuracy)
        {
            if (accuracy >= 0.9f) return "Excellent mathematical adventuring!";
            if (accuracy >= 0.7f) return "Strong work — your maths power is growing.";
            if (accuracy >= 0.5f) return "Good persistence. Every question builds your power.";
            return "You kept the adventure moving. Keep practising!";
        }

        private void BuildUI()
        {
            if (FindFirstObjectByType<EventSystem>() == null) new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            Canvas canvas = new GameObject("Chapter Report Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster)).GetComponent<Canvas>();
            canvas.transform.SetParent(transform, false); canvas.renderMode = RenderMode.ScreenSpaceOverlay; canvas.sortingOrder = 30;
            CanvasScaler scaler = canvas.GetComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1280f, 720f);
            Image shade = Image(canvas.transform, Vector2.zero, Vector2.one, new Color(0.02f, 0.04f, 0.06f, 0.85f));
            Image card = Image(shade.transform, new Vector2(0.26f, 0.12f), new Vector2(0.74f, 0.88f), new Color(0.92f, 0.86f, 0.70f));
            _report = Text(card.transform, 27, TextAnchor.MiddleCenter, new Vector2(0.08f, 0.20f), new Vector2(0.92f, 0.94f));
            Image buttonImage = Image(card.transform, new Vector2(0.30f, 0.06f), new Vector2(0.70f, 0.17f), new Color(0.22f, 0.48f, 0.68f));
            _continue = buttonImage.gameObject.AddComponent<Button>(); Text label = Text(buttonImage.transform, 22, TextAnchor.MiddleCenter, Vector2.zero, Vector2.one); label.text = "Continue"; label.color = Color.white;
            _panel = shade.gameObject; _panel.SetActive(false);
        }
        private static Image Image(Transform p, Vector2 min, Vector2 max, Color c) { Image i = new GameObject("Panel", typeof(RectTransform), typeof(Image)).GetComponent<Image>(); i.transform.SetParent(p, false); RectTransform r = i.rectTransform; r.anchorMin=min;r.anchorMax=max;r.offsetMin=Vector2.zero;r.offsetMax=Vector2.zero;i.color=c;return i; }
        private static Text Text(Transform p, int size, TextAnchor a, Vector2 min, Vector2 max) { Text t=new GameObject("Text",typeof(RectTransform),typeof(Text)).GetComponent<Text>();t.transform.SetParent(p,false);RectTransform r=t.rectTransform;r.anchorMin=min;r.anchorMax=max;r.offsetMin=Vector2.zero;r.offsetMax=Vector2.zero;t.font=Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");t.fontSize=size;t.alignment=a;t.color=new Color(0.14f,0.11f,0.09f);return t; }
    }
}
