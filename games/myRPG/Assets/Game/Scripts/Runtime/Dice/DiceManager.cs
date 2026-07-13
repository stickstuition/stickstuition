using System;
using System.Collections;
using MyRPG.Core;
using MyRPG.Data;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace MyRPG.Dice
{
    public sealed class DiceManager : MonoBehaviour
    {
        public static DiceManager Instance { get; private set; }
        [SerializeField] private GameObject dieModel;
        private GameObject _panel;
        private Text _title;
        private Text _description;
        private Text _calculation;
        private Text _outcome;
        private Button _continue;
        private Action<DiceCheckResult> _completed;
        private DiceCheckResult _result;
        private bool _rolling;

        private void Awake()
        {
            Instance = this;
            if (dieModel != null) dieModel.SetActive(false);
            BuildUI();
        }

        public bool Begin(DiceCheckRequest request, StatBlock stats, Action<DiceCheckResult> completed = null, IDiceRandom random = null)
        {
            if (_rolling || _panel.activeSelf) return false;
            _completed = completed;
            _result = DiceRules.Resolve(request, stats, random ?? new SystemDiceRandom(Environment.TickCount));
            _title.text = request.title;
            _description.text = request.description;
            _calculation.text = request.advantage ? "Rolling twice with maths advantage…" : "Rolling the D20…";
            _outcome.text = string.Empty;
            _continue.gameObject.SetActive(false);
            _panel.SetActive(true);
            GameBootstrap.Instance?.ChangeState(GameState.DiceChallenge);
            StartCoroutine(AnimateRoll());
            return true;
        }

        private IEnumerator AnimateRoll()
        {
            _rolling = true;
            Transform die = dieModel != null ? dieModel.transform : null;
            if (die != null)
            {
                dieModel.SetActive(true);
                Camera camera = Camera.main;
                die.SetParent(camera != null ? camera.transform : transform, false);
                die.localPosition = new Vector3(0f, -0.15f, 4.2f);
                die.localScale = Vector3.one * 0.75f;
            }
            float duration = MyRPG.Settings.SettingsManager.Load().reducedMotion ? 0.35f : 1.35f;
            for (float elapsed = 0f; elapsed < duration; elapsed += Time.unscaledDeltaTime)
            {
                if (die != null) die.Rotate(new Vector3(430f, 610f, 350f) * Time.unscaledDeltaTime, Space.Self);
                yield return null;
            }
            if (die != null) die.localRotation = ResultRotation(_result.UsedRoll);
            ShowResult();
            _rolling = false;
        }

        private void ShowResult()
        {
            DiceCheckRequest r = _result.Request;
            string rolls = r.advantage ? $"Rolls: {_result.FirstRoll} and {_result.SecondRoll} → {_result.UsedRoll}" : $"Roll: {_result.UsedRoll}";
            _calculation.text =
                $"{rolls}\n{r.relevantStat} bonus: {Signed(_result.StatBonus)}    Equipment: {Signed(r.equipmentBonus)}    Maths: {Signed(r.temporaryBonus)}\n" +
                $"Final result: {_result.UsedRoll} {Signed(_result.StatBonus)} {Signed(r.equipmentBonus)} {Signed(r.temporaryBonus)} = {_result.FinalTotal}\nDifficulty Class: {r.difficultyClass}";
            _outcome.text = _result.CriticalSuccess ? "Natural 20 — brilliant success!"
                : _result.CriticalFailure ? "Natural 1 — unlucky this time!"
                : _result.Success ? "Success!" : "Not quite — try another approach.";
            _outcome.color = _result.Success ? new Color(0.15f, 0.62f, 0.25f) : new Color(0.78f, 0.25f, 0.18f);
            _continue.gameObject.SetActive(true);
            _continue.onClick.RemoveAllListeners();
            _continue.onClick.AddListener(Finish);
            _continue.Select();
        }

        private void Finish()
        {
            if (dieModel != null) dieModel.SetActive(false);
            _panel.SetActive(false);
            GameBootstrap.Instance?.ChangeState(GameState.Exploring);
            Action<DiceCheckResult> callback = _completed; _completed = null; callback?.Invoke(_result);
        }

        private void BuildUI()
        {
            if (FindFirstObjectByType<EventSystem>() == null) new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            Canvas canvas = new GameObject("Dice Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster)).GetComponent<Canvas>();
            canvas.transform.SetParent(transform, false); canvas.renderMode = RenderMode.ScreenSpaceOverlay; canvas.sortingOrder = 18;
            CanvasScaler scaler = canvas.GetComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1280f, 720f); scaler.matchWidthOrHeight = 0.5f;
            Image shade = Image(canvas.transform, "Dice Shade", Vector2.zero, Vector2.one, new Color(0.02f, 0.04f, 0.07f, 0.74f));
            Image card = Image(shade.transform, "Dice Card", new Vector2(0.17f, 0.12f), new Vector2(0.83f, 0.88f), new Color(0.92f, 0.86f, 0.69f));
            _title = Text(card.transform, "Title", 40, TextAnchor.MiddleCenter, new Vector2(0.06f, 0.82f), new Vector2(0.94f, 0.96f));
            _description = Text(card.transform, "Description", 21, TextAnchor.MiddleCenter, new Vector2(0.08f, 0.65f), new Vector2(0.92f, 0.81f));
            _calculation = Text(card.transform, "Calculation", 22, TextAnchor.MiddleCenter, new Vector2(0.08f, 0.31f), new Vector2(0.92f, 0.63f));
            _outcome = Text(card.transform, "Outcome", 30, TextAnchor.MiddleCenter, new Vector2(0.08f, 0.17f), new Vector2(0.92f, 0.30f));
            Image buttonImage = Image(card.transform, "Continue", new Vector2(0.34f, 0.05f), new Vector2(0.66f, 0.15f), new Color(0.22f, 0.48f, 0.68f));
            _continue = buttonImage.gameObject.AddComponent<Button>();
            UnityEngine.UI.Text label = Text(buttonImage.transform, "Label", 23, TextAnchor.MiddleCenter, Vector2.zero, Vector2.one); label.text = "Continue"; label.color = Color.white;
            _panel = shade.gameObject; _panel.SetActive(false);
        }

        private static Image Image(Transform parent, string name, Vector2 min, Vector2 max, Color color)
        {
            Image image = new GameObject(name, typeof(RectTransform), typeof(Image)).GetComponent<Image>(); image.transform.SetParent(parent, false);
            RectTransform rect = image.rectTransform; rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = Vector2.zero; rect.offsetMax = Vector2.zero; image.color = color; return image;
        }

        private static UnityEngine.UI.Text Text(Transform parent, string name, int size, TextAnchor alignment, Vector2 min, Vector2 max)
        {
            UnityEngine.UI.Text text = new GameObject(name, typeof(RectTransform), typeof(UnityEngine.UI.Text)).GetComponent<UnityEngine.UI.Text>(); text.transform.SetParent(parent, false);
            RectTransform rect = text.rectTransform; rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = Vector2.zero; rect.offsetMax = Vector2.zero;
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); text.fontSize = size; text.alignment = alignment; text.color = new Color(0.14f, 0.11f, 0.09f); return text;
        }

        private static Quaternion ResultRotation(int result) => Quaternion.Euler((result * 47) % 360, (result * 83) % 360, (result * 29) % 360);
        private static string Signed(int value) => value >= 0 ? $"+{value}" : value.ToString();
    }
}
