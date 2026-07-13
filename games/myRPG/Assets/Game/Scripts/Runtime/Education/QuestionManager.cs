using System;
using MyRPG.Core;
using MyRPG.Data;
using MyRPG.Saving;
using MyRPG.Settings;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using MyRPG.Inventory;

namespace MyRPG.Education
{
    public sealed class QuestionManager : MonoBehaviour
    {
        public static QuestionManager Instance { get; private set; }
        private QuestionSession _session;
        private GameObject _panel;
        private Text _topic;
        private Text _prompt;
        private Text _timer;
        private Text _feedback;
        private RectTransform _answerArea;
        private Button _continue;
        private Button _retry;
        private InputField _numberInput;
        private Action<QuestionOutcome> _completed;
        private ArithmeticQuestion _question;
        private float _startedAt;
        private float _remaining;
        private bool _answered;
        private bool _isRetry;
        private bool _permanentSecondChanceUsed;
        private int _questionCount;
        private bool _timerEnabled;

        private void Awake()
        {
            Instance = this;
            _session = new QuestionSession(Environment.TickCount);
            BuildUI();
        }

        private void Update()
        {
            if (_panel == null || !_panel.activeSelf || _answered) return;
            if (!_timerEnabled) { _timer.text = "Take your time"; return; }
            _remaining -= Time.unscaledDeltaTime;
            _timer.text = $"Time: {Mathf.CeilToInt(Mathf.Max(0f, _remaining))}";
            if (_remaining <= 0f) Submit(string.Empty);
        }

        public bool Begin(ArithmeticSubtopic subtopic, Action<QuestionOutcome> completed = null)
        {
            if (_panel.activeSelf) return false;
            _completed = completed;
            QuestionFormat format = (_questionCount++ % 2 == 0) ? QuestionFormat.Numerical : QuestionFormat.MultipleChoice;
            _question = _session.Next(subtopic, format);
            _answered = false;
            _startedAt = Time.unscaledTime;
            GameSettings settings = SettingsManager.Load();
            _timerEnabled = settings.mathsTimerEnabled;
            int timeRank = GameBootstrap.Instance?.Session?.Save != null ? UpgradeRules.Rank(GameBootstrap.Instance.Session.Save, "question_time") : 0;
            _remaining = _question.timeLimitSeconds * settings.questionTimeMultiplier * (1f + timeRank * 0.10f);
            _topic.text = $"{Friendly(subtopic)}  •  Power Level {_question.difficultyBand}";
            _prompt.text = _question.prompt;
            _feedback.text = string.Empty;
            _continue.gameObject.SetActive(false);
            _retry.gameObject.SetActive(false);
            _isRetry = false;
            BuildAnswers();
            _panel.SetActive(true);
            GameBootstrap.Instance?.ChangeState(GameState.Question);
            return true;
        }

        private void Submit(string answer)
        {
            if (_answered) return;
            _answered = true;
            float response = Time.unscaledTime - _startedAt;
            QuestionOutcome outcome = _session.Submit(answer, response);
            SaveData save = GameBootstrap.Instance?.Session?.Save;
            if (save != null)
            {
                save.performance.Record(_question.subtopic.ToString(), _question.id, outcome.Correct, response, _isRetry);
                if (outcome.Correct)
                {
                    save.currentFocus = Mathf.Min(save.baseStats.maxFocus, save.currentFocus + 5);
                    save.knowledgePoints += 1;
                }
                GameBootstrap.Instance.Session.SaveNow();
            }
            _feedback.text = outcome.Correct
                ? $"Correct!  +5 Focus  +1 Knowledge\n{_question.explanation}"
                : $"The answer is {_question.correctAnswer}.\n{_question.explanation}\nNo Focus was awarded this time.";
            _feedback.color = outcome.Correct ? new Color(0.12f, 0.48f, 0.20f) : new Color(0.65f, 0.18f, 0.15f);
            SetAnswerControls(false);
            _continue.gameObject.SetActive(true);
            _continue.onClick.RemoveAllListeners();
            _continue.onClick.AddListener(() => Finish(outcome));
            if (!outcome.Correct && CanRetry(save))
            {
                _retry.gameObject.SetActive(true);
                _retry.onClick.RemoveAllListeners();
                _retry.onClick.AddListener(() => Retry(save));
            }
            _continue.Select();
        }

        private bool CanRetry(SaveData save)
        {
            if (save == null) return false;
            bool hasScroll = save.inventory.Exists(x => x.itemId == "second_chance_scroll" && x.quantity > 0);
            bool permanent = UpgradeRules.Rank(save, "second_chance") > 0 && !_permanentSecondChanceUsed;
            return hasScroll || permanent;
        }

        private void Retry(SaveData save)
        {
            if (save.inventory.Exists(x => x.itemId == "second_chance_scroll" && x.quantity > 0))
                InventoryOperations.Remove(save.inventory, "second_chance_scroll", 1);
            else _permanentSecondChanceUsed = true;
            GameBootstrap.Instance.Session.SaveNow();
            _answered = false; _isRetry = true; _startedAt = Time.unscaledTime;
            GameSettings settings = SettingsManager.Load();
            _remaining = _question.timeLimitSeconds * settings.questionTimeMultiplier;
            _feedback.text = "Second Chance! Try the same question again.";
            _feedback.color = new Color(0.18f, 0.38f, 0.68f);
            _continue.gameObject.SetActive(false); _retry.gameObject.SetActive(false);
            SetAnswerControls(true);
            if (_numberInput != null) { _numberInput.text = string.Empty; _numberInput.ActivateInputField(); }
        }

        private void Finish(QuestionOutcome outcome)
        {
            _panel.SetActive(false);
            GameBootstrap.Instance?.ChangeState(GameState.Exploring);
            Action<QuestionOutcome> callback = _completed; _completed = null;
            callback?.Invoke(outcome);
        }

        private void BuildAnswers()
        {
            for (int i = _answerArea.childCount - 1; i >= 0; i--) Destroy(_answerArea.GetChild(i).gameObject);
            _numberInput = null;
            if (_question.format == QuestionFormat.Numerical)
            {
                _numberInput = CreateInput(_answerArea);
                _numberInput.ActivateInputField();
                Button submit = CreateButton(_answerArea, "Cast Maths Power", new Vector2(0.58f, 0.14f), new Vector2(0.94f, 0.86f));
                submit.onClick.AddListener(() => Submit(_numberInput.text));
            }
            else
            {
                for (int i = 0; i < _question.choices.Length; i++)
                {
                    int answer = _question.choices[i];
                    int column = i % 2, row = i / 2;
                    Button choice = CreateButton(_answerArea, answer.ToString(), new Vector2(0.03f + column * 0.49f, 0.54f - row * 0.48f), new Vector2(0.48f + column * 0.49f, 0.94f - row * 0.48f));
                    choice.onClick.AddListener(() => Submit(answer.ToString()));
                }
            }
        }

        private void SetAnswerControls(bool enabled)
        {
            foreach (Selectable selectable in _answerArea.GetComponentsInChildren<Selectable>()) selectable.interactable = enabled;
        }

        private void BuildUI()
        {
            if (FindFirstObjectByType<EventSystem>() == null) new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            Canvas canvas = new GameObject("Question Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster)).GetComponent<Canvas>();
            canvas.transform.SetParent(transform, false); canvas.renderMode = RenderMode.ScreenSpaceOverlay; canvas.sortingOrder = 20;
            CanvasScaler scaler = canvas.GetComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1280f, 720f); scaler.matchWidthOrHeight = 0.5f;
            Image shade = CreateImage(canvas.transform, "Question Shade", Vector2.zero, Vector2.one, new Color(0.02f, 0.04f, 0.06f, 0.82f));
            Image card = CreateImage(shade.transform, "Question Card", new Vector2(0.18f, 0.10f), new Vector2(0.82f, 0.91f), new Color(0.94f, 0.88f, 0.72f));
            _topic = CreateText(card.transform, "Topic", 21, TextAnchor.MiddleLeft, new Vector2(0.07f, 0.86f), new Vector2(0.73f, 0.95f));
            _timer = CreateText(card.transform, "Timer", 21, TextAnchor.MiddleRight, new Vector2(0.73f, 0.86f), new Vector2(0.93f, 0.95f));
            _prompt = CreateText(card.transform, "Prompt", 42, TextAnchor.MiddleCenter, new Vector2(0.07f, 0.63f), new Vector2(0.93f, 0.84f));
            _answerArea = CreateRect(card.transform, "Answers", new Vector2(0.08f, 0.37f), new Vector2(0.92f, 0.62f));
            _feedback = CreateText(card.transform, "Explanation", 21, TextAnchor.MiddleCenter, new Vector2(0.08f, 0.13f), new Vector2(0.92f, 0.35f));
            _continue = CreateButton(card.transform, "Continue", new Vector2(0.34f, 0.035f), new Vector2(0.66f, 0.12f));
            _retry = CreateButton(card.transform, "Use Second Chance", new Vector2(0.67f, 0.035f), new Vector2(0.95f, 0.12f));
            _retry.gameObject.SetActive(false);
            _panel = shade.gameObject; _panel.SetActive(false);
        }

        private static InputField CreateInput(Transform parent)
        {
            Image image = CreateImage(parent, "Number Answer", new Vector2(0.05f, 0.14f), new Vector2(0.54f, 0.86f), Color.white);
            InputField input = image.gameObject.AddComponent<InputField>();
            Text text = CreateText(image.transform, "Answer Text", 32, TextAnchor.MiddleCenter, new Vector2(0.04f, 0f), new Vector2(0.96f, 1f));
            Text placeholder = CreateText(image.transform, "Placeholder", 25, TextAnchor.MiddleCenter, new Vector2(0.04f, 0f), new Vector2(0.96f, 1f));
            placeholder.text = "Type your answer"; placeholder.color = new Color(0.2f, 0.2f, 0.2f, 0.45f);
            input.textComponent = text; input.placeholder = placeholder; input.contentType = InputField.ContentType.IntegerNumber; input.characterLimit = 8;
            return input;
        }

        private static Button CreateButton(Transform parent, string label, Vector2 min, Vector2 max)
        {
            Image image = CreateImage(parent, label, min, max, new Color(0.22f, 0.48f, 0.68f));
            Button button = image.gameObject.AddComponent<Button>();
            Text text = CreateText(image.transform, "Label", 23, TextAnchor.MiddleCenter, Vector2.zero, Vector2.one); text.text = label; text.color = Color.white;
            return button;
        }

        private static Image CreateImage(Transform parent, string name, Vector2 min, Vector2 max, Color color)
        {
            Image image = new GameObject(name, typeof(RectTransform), typeof(Image)).GetComponent<Image>(); image.transform.SetParent(parent, false);
            RectTransform rect = image.rectTransform; rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = Vector2.zero; rect.offsetMax = Vector2.zero; image.color = color;
            return image;
        }

        private static Text CreateText(Transform parent, string name, int size, TextAnchor alignment, Vector2 min, Vector2 max)
        {
            Text text = new GameObject(name, typeof(RectTransform), typeof(Text)).GetComponent<Text>(); text.transform.SetParent(parent, false);
            RectTransform rect = text.rectTransform; rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = Vector2.zero; rect.offsetMax = Vector2.zero;
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); text.fontSize = size; text.alignment = alignment; text.color = new Color(0.14f, 0.11f, 0.09f); text.supportRichText = true;
            return text;
        }

        private static RectTransform CreateRect(Transform parent, string name, Vector2 min, Vector2 max)
        {
            RectTransform rect = new GameObject(name, typeof(RectTransform)).GetComponent<RectTransform>(); rect.SetParent(parent, false);
            rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = Vector2.zero; rect.offsetMax = Vector2.zero; return rect;
        }

        private static string Friendly(ArithmeticSubtopic value) => value.ToString().Replace("And", " & ");
    }
}
