using System;
using System.Collections.Generic;
using MyRPG.Core;
using MyRPG.Data;
using MyRPG.Saving;
using MyRPG.Settings;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace MyRPG.UI
{
    /// <summary>Responsive main-menu flow for local saves, adventure setup, settings and credits.</summary>
    public sealed class MainMenuController : MonoBehaviour
    {
        [Header("Theme")]
        [SerializeField] private Font displayFont;
        [SerializeField] private Sprite panelSprite;
        [SerializeField] private Sprite buttonSprite;
        [SerializeField] private Sprite buttonPressedSprite;
        [SerializeField] private CharacterClassDefinition[] classes;

        private readonly Color _ink = new Color(0.15f, 0.12f, 0.10f);
        private readonly Color _blue = new Color(0.20f, 0.45f, 0.67f);
        private readonly Color _green = new Color(0.24f, 0.58f, 0.34f);
        private readonly Color _red = new Color(0.70f, 0.28f, 0.24f);
        private Canvas _canvas;
        private RectTransform _screen;
        private GameObject _currentPanel;
        private SaveManager _saves;
        private AdventureSetupService _setup;
        private int _selectedSlot;
        private CharacterClassDefinition _selectedClass;
        private InputField _nameInput;
        private Text _setupFeedback;
        private Text _classDetail;

        private void Awake()
        {
            _saves = new SaveManager();
            _setup = new AdventureSetupService(_saves);
            BuildCanvas();
            ShowMain();
        }

        private void Start() => GameBootstrap.Instance?.ChangeState(GameState.MainMenu);

        private void BuildCanvas()
        {
            if (FindFirstObjectByType<EventSystem>() == null)
                new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));

            GameObject canvasObject = new GameObject("Menu Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasObject.transform.SetParent(transform, false);
            _canvas = canvasObject.GetComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            CanvasScaler scaler = canvasObject.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280f, 720f);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;

            Image background = Element<Image>("Background", canvasObject.transform);
            Stretch(background.rectTransform);
            background.color = new Color(0.08f, 0.16f, 0.22f);
            _screen = background.rectTransform;

            Text footer = Label("Footer", _screen, "A Sticks Tuition adventure  •  Maths is your greatest power", 18, TextAnchor.MiddleCenter);
            SetRect(footer.rectTransform, new Vector2(0.1f, 0.015f), new Vector2(0.9f, 0.075f));
            footer.color = new Color(0.85f, 0.90f, 0.92f);
        }

        private void ShowMain()
        {
            GameObject panel = ScreenPanel("Main Menu", new Vector2(0.25f, 0.14f), new Vector2(0.75f, 0.91f));
            Label("Title", panel.transform, "MyRPG", 66, TextAnchor.MiddleCenter, 0.80f, 0.94f);
            Label("Subtitle", panel.transform, "Create your hero. Rescue your friends.\nPower up with arithmetic!", 23, TextAnchor.MiddleCenter, 0.67f, 0.80f);
            MenuButton(panel.transform, "New Adventure", 0.52f, _green, () => ShowSlots(true));
            Button continueButton = MenuButton(panel.transform, "Continue", 0.40f, _blue, () => ShowSlots(false));
            continueButton.interactable = AnySave();
            MenuButton(panel.transform, "Settings", 0.28f, _blue, ShowSettings);
            MenuButton(panel.transform, "Credits", 0.16f, _blue, ShowCredits);
            MenuButton(panel.transform, "Quit", 0.04f, _red, Application.Quit);
        }

        private void ShowSlots(bool creating)
        {
            GameObject panel = ScreenPanel("Save Selection", new Vector2(0.19f, 0.13f), new Vector2(0.81f, 0.91f));
            Label("Title", panel.transform, creating ? "Choose a Save Slot" : "Continue Adventure", 44, TextAnchor.MiddleCenter, 0.83f, 0.96f);
            for (int slot = 0; slot < SaveManager.SlotCount; slot++)
            {
                SaveLoadStatus status = _saves.TryLoad(slot, out SaveData save);
                SaveSlotSummary summary = new SaveSlotSummary(slot, status, save);
                int capturedSlot = slot;
                float top = 0.76f - slot * 0.21f;
                Button button = ButtonElement($"Slot {slot + 1}", panel.transform, $"{summary.Title}\n<size=17>{summary.Detail}</size>", _blue,
                    () => SelectSlot(capturedSlot, creating));
                SetRect(button.GetComponent<RectTransform>(), new Vector2(0.10f, top - 0.13f), new Vector2(0.90f, top));
                button.interactable = creating || summary.Occupied;
            }
            FooterButton(panel.transform, "Back", 0.08f, ShowMain);
        }

        private void SelectSlot(int slot, bool creating)
        {
            _selectedSlot = slot;
            if (!creating)
            {
                if (_saves.TryLoad(slot, out SaveData save) == SaveLoadStatus.Success)
                {
                    GameBootstrap.Instance?.Session.Load(slot);
                    ShowAdventureReady(save);
                }
                return;
            }
            if (_saves.HasSave(slot)) ShowOverwriteConfirmation();
            else ShowAdventureSetup();
        }

        private void ShowOverwriteConfirmation()
        {
            GameObject panel = ScreenPanel("Confirm Overwrite", new Vector2(0.30f, 0.27f), new Vector2(0.70f, 0.76f));
            Label("Title", panel.transform, "Replace this adventure?", 38, TextAnchor.MiddleCenter, 0.70f, 0.90f);
            Label("Warning", panel.transform, "The existing save will be permanently replaced.", 22, TextAnchor.MiddleCenter, 0.45f, 0.68f);
            MenuButton(panel.transform, "Replace Save", 0.24f, _red, ShowAdventureSetup);
            MenuButton(panel.transform, "Cancel", 0.08f, _blue, () => ShowSlots(true));
        }

        private void ShowAdventureSetup()
        {
            GameObject panel = ScreenPanel("Adventure Setup", new Vector2(0.10f, 0.08f), new Vector2(0.90f, 0.95f));
            Label("Title", panel.transform, "Create Your Adventurer", 43, TextAnchor.MiddleCenter, 0.86f, 0.98f);
            Label("NamePrompt", panel.transform, "Adventurer name", 21, TextAnchor.MiddleLeft, 0.76f, 0.83f, 0.08f, 0.46f);
            _nameInput = Input(panel.transform, "Enter a name…");
            SetRect(_nameInput.GetComponent<RectTransform>(), new Vector2(0.08f, 0.67f), new Vector2(0.46f, 0.76f));
            _nameInput.characterLimit = AdventureSetupService.MaximumNameLength;

            Label("ClassPrompt", panel.transform, "Choose a class", 25, TextAnchor.MiddleLeft, 0.57f, 0.65f, 0.08f, 0.46f);
            for (int i = 0; i < classes.Length; i++)
            {
                CharacterClassDefinition definition = classes[i];
                int row = i;
                Button classButton = ButtonElement(definition.name, panel.transform, definition.DisplayName, _blue, () => SelectClass(definition));
                float top = 0.54f - row * 0.105f;
                SetRect(classButton.GetComponent<RectTransform>(), new Vector2(0.08f, top - 0.08f), new Vector2(0.43f, top));
            }
            _classDetail = Label("Class Detail", panel.transform, "Select a class to see its strengths.", 20, TextAnchor.UpperLeft, 0.29f, 0.76f, 0.50f, 0.92f);
            _setupFeedback = Label("Feedback", panel.transform, string.Empty, 18, TextAnchor.MiddleCenter, 0.08f, 0.17f);
            _setupFeedback.color = _red;
            Button create = ButtonElement("Begin", panel.transform, "Begin Adventure", _green, CreateAdventure);
            SetRect(create.GetComponent<RectTransform>(), new Vector2(0.54f, 0.15f), new Vector2(0.88f, 0.25f));
            FooterButton(panel.transform, "Back", 0.08f, () => ShowSlots(true));
            if (classes.Length > 0) SelectClass(classes[0]);
        }

        private void SelectClass(CharacterClassDefinition definition)
        {
            _selectedClass = definition;
            StatBlock s = definition.StartingStats;
            _classDetail.text = $"<b>{definition.DisplayName}</b>\n\nHealth  {s.maxHealth}    Focus  {s.maxFocus}\nStrength  {s.strength}    Defence  {s.defence}\nMagic  {s.magic}    Intelligence  {s.intelligence}\nAgility  {s.agility}    Luck  {s.luck}\n\nSpecial: {definition.SpecialAbility.DisplayName}\n{definition.SpecialAbility.Description}";
        }

        private void CreateAdventure()
        {
            if (_selectedClass == null) { _setupFeedback.text = "Choose a class first."; return; }
            AdventureCreationStatus status = _setup.Create(_selectedSlot, _nameInput.text, _selectedClass.ClassId, _selectedClass.StartingStats, out SaveData save);
            if (status == AdventureCreationStatus.Success)
            {
                GameBootstrap.Instance?.Session.UseNew(_selectedSlot, save);
                ShowAdventureReady(save);
                return;
            }
            _setupFeedback.text = status == AdventureCreationStatus.NameTooLong
                ? $"Use {AdventureSetupService.MaximumNameLength} characters or fewer."
                : "Enter your adventurer’s name.";
        }

        private void ShowAdventureReady(SaveData save)
        {
            GameObject panel = ScreenPanel("Adventure Ready", new Vector2(0.20f, 0.17f), new Vector2(0.80f, 0.88f));
            Label("Ready", panel.transform, save.displayTitle, 43, TextAnchor.MiddleCenter, 0.74f, 0.93f);
            Label("Details", panel.transform,
                $"Level {save.level} {save.characterClass}\nChapter {save.currentChapter}: The Broken Road\n\nYour progress is safely stored in Save Slot {_selectedSlot + 1}.",
                24, TextAnchor.MiddleCenter, 0.38f, 0.72f);
            MenuButton(panel.transform, "Enter the Village", 0.19f, _green,
                () => GameBootstrap.Instance?.LoadGameplayScene(SceneNames.Village));
            Label("PhaseNote", panel.transform, "Chapter 1: The Broken Road", 16, TextAnchor.MiddleCenter, 0.11f, 0.18f);
            FooterButton(panel.transform, "Main Menu", 0.05f, ShowMain);
        }

        private void ShowSettings()
        {
            GameSettings settings = SettingsManager.Load();
            GameObject panel = ScreenPanel("Settings", new Vector2(0.18f, 0.08f), new Vector2(0.82f, 0.94f));
            Label("Title", panel.transform, "Settings", 44, TextAnchor.MiddleCenter, 0.88f, 0.98f);
            AddSlider(panel.transform, "Master Volume", 0.77f, settings.masterVolume, value => settings.masterVolume = value);
            AddSlider(panel.transform, "Music / Ambience", 0.65f, settings.musicVolume, value => settings.musicVolume = value);
            AddSlider(panel.transform, "Sound Effects", 0.53f, settings.soundEffectsVolume, value => settings.soundEffectsVolume = value);
            AddToggle(panel.transform, "Timed maths questions", 0.42f, settings.mathsTimerEnabled, value => settings.mathsTimerEnabled = value);
            AddToggle(panel.transform, "Screen shake", 0.34f, settings.screenShake, value => settings.screenShake = value);
            AddToggle(panel.transform, "Large text", 0.26f, settings.largeText, value => settings.largeText = value);
            AddToggle(panel.transform, "High-contrast UI", 0.18f, settings.highContrast, value => settings.highContrast = value);
            Button save = FooterButton(panel.transform, "Save & Back", 0.06f, () => { SettingsManager.Save(settings); ShowMain(); });
            Button more = ButtonElement("More Settings", panel.transform, "Gameplay & Access", _blue, () => { SettingsManager.Save(settings); ShowGameplaySettings(); });
            SetRect(more.GetComponent<RectTransform>(), new Vector2(0.60f, 0.06f), new Vector2(0.94f, 0.14f));
            save.Select();
        }

        private void ShowGameplaySettings()
        {
            GameSettings settings = SettingsManager.Load();
            GameObject panel = ScreenPanel("Gameplay Settings", new Vector2(0.18f, 0.06f), new Vector2(0.82f, 0.96f));
            Label("Title", panel.transform, "Gameplay & Accessibility", 38, TextAnchor.MiddleCenter, 0.90f, 0.99f);
            AddSlider(panel.transform, "Camera sensitivity", 0.79f, (settings.cameraSensitivity - 0.25f) / 2.75f,
                value => settings.cameraSensitivity = 0.25f + value * 2.75f);
            AddSlider(panel.transform, "Text speed", 0.68f, (settings.textSpeed - 0.25f) / 2.75f,
                value => settings.textSpeed = 0.25f + value * 2.75f);
            AddSlider(panel.transform, "Question time allowance", 0.57f, (settings.questionTimeMultiplier - 0.5f) / 2.5f,
                value => settings.questionTimeMultiplier = 0.5f + value * 2.5f);
            AddToggle(panel.transform, "Damage numbers", 0.48f, settings.damageNumbers, value => settings.damageNumbers = value);
            AddToggle(panel.transform, "Tutorial prompts", 0.41f, settings.tutorials, value => settings.tutorials = value);
            AddToggle(panel.transform, "Reduced motion", 0.34f, settings.reducedMotion, value => settings.reducedMotion = value);
            AddToggle(panel.transform, "Subtitles", 0.27f, settings.subtitles, value => settings.subtitles = value);
            AddToggle(panel.transform, "Full screen", 0.20f, settings.fullscreen, value => settings.fullscreen = value);
            Button quality = ButtonElement("Quality", panel.transform, $"Graphics quality: {settings.qualityLevel + 1}", _blue,
                () => { settings.qualityLevel = (settings.qualityLevel + 1) % Math.Max(1, QualitySettings.names.Length); ShowGameplaySettingsWith(settings); });
            SetRect(quality.GetComponent<RectTransform>(), new Vector2(0.36f, 0.12f), new Vector2(0.90f, 0.19f));
            FooterButton(panel.transform, "Save & Back", 0.04f, () => { SettingsManager.Save(settings); ShowSettings(); });
        }

        private void ShowGameplaySettingsWith(GameSettings settings)
        {
            SettingsManager.Save(settings);
            ShowGameplaySettings();
        }

        private void ShowCredits()
        {
            GameObject panel = ScreenPanel("Credits", new Vector2(0.20f, 0.13f), new Vector2(0.80f, 0.90f));
            Label("Title", panel.transform, "Credits", 44, TextAnchor.MiddleCenter, 0.84f, 0.97f);
            Label("Copy", panel.transform,
                "MyRPG\nCreated for Sticks Tuition\n\n3D art and animation\nKay Lousberg / KayKit\n\nFantasy audio\nTomMusic\n\nAdditional UI, icons, font and particles\nUsed with permission\n\nMade with Unity",
                21, TextAnchor.MiddleCenter, 0.18f, 0.82f);
            FooterButton(panel.transform, "Back", 0.06f, ShowMain);
        }

        private bool AnySave()
        {
            for (int i = 0; i < SaveManager.SlotCount; i++) if (_saves.HasSave(i)) return true;
            return false;
        }

        private GameObject ScreenPanel(string name, Vector2 min, Vector2 max)
        {
            if (_currentPanel != null) Destroy(_currentPanel);
            Image image = Element<Image>(name, _screen);
            SetRect(image.rectTransform, min, max);
            image.sprite = panelSprite;
            image.type = panelSprite == null ? Image.Type.Simple : Image.Type.Sliced;
            image.color = panelSprite == null ? new Color(0.93f, 0.87f, 0.72f, 0.98f) : Color.white;
            _currentPanel = image.gameObject;
            return _currentPanel;
        }

        private Button MenuButton(Transform parent, string label, float bottom, Color color, Action action)
        {
            Button button = ButtonElement(label, parent, label, color, action);
            SetRect(button.GetComponent<RectTransform>(), new Vector2(0.20f, bottom), new Vector2(0.80f, bottom + 0.09f));
            return button;
        }

        private Button FooterButton(Transform parent, string label, float bottom, Action action)
        {
            Button button = ButtonElement(label, parent, label, _blue, action);
            SetRect(button.GetComponent<RectTransform>(), new Vector2(0.06f, bottom), new Vector2(0.34f, bottom + 0.08f));
            return button;
        }

        private Button ButtonElement(string name, Transform parent, string text, Color color, Action action)
        {
            Image image = Element<Image>(name, parent);
            image.sprite = buttonSprite;
            image.type = buttonSprite == null ? Image.Type.Simple : Image.Type.Sliced;
            image.color = buttonSprite == null ? color : Color.white;
            Button button = image.gameObject.AddComponent<Button>();
            SpriteState state = button.spriteState;
            state.pressedSprite = buttonPressedSprite;
            state.selectedSprite = buttonPressedSprite;
            button.spriteState = state;
            button.transition = buttonPressedSprite == null ? Selectable.Transition.ColorTint : Selectable.Transition.SpriteSwap;
            button.onClick.AddListener(() => action());
            Text label = Label("Label", image.transform, text, 22, TextAnchor.MiddleCenter);
            Stretch(label.rectTransform);
            label.color = _ink;
            label.supportRichText = true;
            return button;
        }

        private InputField Input(Transform parent, string placeholderText)
        {
            Image image = Element<Image>("Name Input", parent);
            image.color = new Color(1f, 1f, 1f, 0.88f);
            InputField input = image.gameObject.AddComponent<InputField>();
            Text text = Label("Text", image.transform, string.Empty, 23, TextAnchor.MiddleLeft);
            SetRect(text.rectTransform, new Vector2(0.04f, 0f), new Vector2(0.96f, 1f));
            Text placeholder = Label("Placeholder", image.transform, placeholderText, 22, TextAnchor.MiddleLeft);
            SetRect(placeholder.rectTransform, new Vector2(0.04f, 0f), new Vector2(0.96f, 1f));
            placeholder.color = new Color(_ink.r, _ink.g, _ink.b, 0.5f);
            input.textComponent = text;
            input.placeholder = placeholder;
            return input;
        }

        private void AddSlider(Transform parent, string label, float top, float value, Action<float> changed)
        {
            Label(label, parent, label, 20, TextAnchor.MiddleLeft, top, top + 0.06f, 0.08f, 0.45f);
            Slider slider = Element<Slider>(label + " Slider", parent);
            SetRect(slider.GetComponent<RectTransform>(), new Vector2(0.48f, top + 0.01f), new Vector2(0.90f, top + 0.055f));
            Image background = Element<Image>("Background", slider.transform); Stretch(background.rectTransform); background.color = new Color(0.25f, 0.22f, 0.18f, 0.35f);
            RectTransform fillArea = Rect("Fill Area", slider.transform); Stretch(fillArea);
            Image fill = Element<Image>("Fill", fillArea); Stretch(fill.rectTransform); fill.color = _green;
            RectTransform handleArea = Rect("Handle Area", slider.transform); Stretch(handleArea);
            Image handle = Element<Image>("Handle", handleArea); handle.rectTransform.sizeDelta = new Vector2(24f, 40f); handle.color = Color.white;
            slider.fillRect = fill.rectTransform; slider.handleRect = handle.rectTransform; slider.targetGraphic = handle; slider.value = value;
            slider.onValueChanged.AddListener(v => changed(v));
        }

        private void AddToggle(Transform parent, string label, float bottom, bool value, Action<bool> changed)
        {
            Toggle toggle = Element<Toggle>(label, parent);
            SetRect(toggle.GetComponent<RectTransform>(), new Vector2(0.10f, bottom), new Vector2(0.90f, bottom + 0.065f));
            Image box = Element<Image>("Box", toggle.transform); SetRect(box.rectTransform, new Vector2(0f, 0.08f), new Vector2(0.07f, 0.92f)); box.color = Color.white;
            Image check = Element<Image>("Check", box.transform); Stretch(check.rectTransform); check.color = _green;
            Text text = Label("Label", toggle.transform, label, 20, TextAnchor.MiddleLeft); SetRect(text.rectTransform, new Vector2(0.10f, 0f), Vector2.one);
            toggle.targetGraphic = box; toggle.graphic = check; toggle.isOn = value; toggle.onValueChanged.AddListener(v => changed(v));
        }

        private Text Label(string name, Transform parent, string text, int size, TextAnchor anchor, float minY = 0f, float maxY = 1f, float minX = 0f, float maxX = 1f)
        {
            Text label = Element<Text>(name, parent);
            label.font = displayFont != null ? displayFont : Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            label.text = text; label.fontSize = size; label.alignment = anchor; label.color = _ink;
            label.horizontalOverflow = HorizontalWrapMode.Wrap; label.verticalOverflow = VerticalWrapMode.Truncate;
            SetRect(label.rectTransform, new Vector2(minX, minY), new Vector2(maxX, maxY));
            return label;
        }

        private static T Element<T>(string name, Transform parent) where T : Component
        {
            GameObject value = new GameObject(name, typeof(RectTransform), typeof(T));
            value.transform.SetParent(parent, false);
            return value.GetComponent<T>();
        }

        private static RectTransform Rect(string name, Transform parent)
        {
            GameObject value = new GameObject(name, typeof(RectTransform));
            value.transform.SetParent(parent, false);
            return value.GetComponent<RectTransform>();
        }

        private static void Stretch(RectTransform rect) => SetRect(rect, Vector2.zero, Vector2.one);
        private static void SetRect(RectTransform rect, Vector2 min, Vector2 max)
        {
            rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = Vector2.zero; rect.offsetMax = Vector2.zero;
        }
    }
}
