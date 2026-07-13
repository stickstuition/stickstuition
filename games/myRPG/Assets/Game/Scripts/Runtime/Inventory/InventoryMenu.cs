using System;
using System.Collections.Generic;
using MyRPG.Core;
using MyRPG.Data;
using MyRPG.Player;
using MyRPG.Saving;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace MyRPG.Inventory
{
    public sealed class InventoryMenu : MonoBehaviour
    {
        public static InventoryMenu Instance { get; private set; }
        [SerializeField] private ItemDefinition[] itemDefinitions;
        private GameObject _panel;
        private RectTransform _content;
        private Text _title;
        private Text _details;
        private Button _action;
        private bool _open;
        private SaveData Save => GameBootstrap.Instance?.Session?.Save;

        private void Awake() { Instance = this; BuildUI(); }

        private void Update()
        {
            if (_open && Input.GetKeyDown(KeyCode.Escape)) { Close(); return; }
            if (_open || GameBootstrap.Instance == null || GameBootstrap.Instance.State != GameState.Exploring) return;
            if (Input.GetKeyDown(KeyCode.I)) OpenInventory();
            else if (Input.GetKeyDown(KeyCode.C)) OpenCharacter();
            else if (Input.GetKeyDown(KeyCode.K)) OpenKnowledge();
        }

        public void OpenInventory()
        {
            if (!Open("Inventory")) return;
            _details.text = "Select an item to view its effects.";
            _action.gameObject.SetActive(false);
            Button sort = AddRow("Sort A–Z", 0, () => { Save.inventory.Sort((a, b) => string.Compare(a.itemId, b.itemId, StringComparison.Ordinal)); OpenInventory(); });
            sort.GetComponent<Image>().color = new Color(0.30f, 0.56f, 0.35f);
            int row = 1;
            foreach (InventoryEntry entry in Save.inventory)
            {
                ItemDefinition definition = Find(entry.itemId);
                if (definition == null) continue;
                ItemDefinition captured = definition;
                AddItemRow(definition, entry.quantity, row++, () => SelectItem(captured));
            }
            if (row == 1) AddNote("Your pack is empty.");
        }

        public void OpenCharacter()
        {
            if (!Open("Character")) return;
            StatBlock stats = EquipmentOperations.EffectiveStats(Save);
            _details.text =
                $"{Save.adventurerName} — Level {Save.level} {Save.characterClass}\nXP: {Save.experience}/{ProgressionRules.ExperienceForLevel(Save.level)}\n\n" +
                $"Health {Save.currentHealth}/{stats.maxHealth}    Focus {Save.currentFocus}/{stats.maxFocus}\n" +
                $"Strength {stats.strength}    Defence {stats.defence}\nMagic {stats.magic}    Intelligence {stats.intelligence}\n" +
                $"Agility {stats.agility}    Luck {stats.luck}\n\nParty members rescued: {Save.unlockedCompanions.Count}/3";
            _action.gameObject.SetActive(false);
            int row = 0;
            foreach (ItemCategory category in new[] { ItemCategory.Weapon, ItemCategory.Armour, ItemCategory.Helmet, ItemCategory.Charm, ItemCategory.DiceRelic })
            {
                EquipmentEntry equipped = Save.equipment.Find(x => x.slot == category);
                AddRow($"{category}: {(equipped == null ? "None" : Find(equipped.itemId)?.DisplayName ?? equipped.itemId)}", row++, null);
            }
        }

        public void OpenKnowledge()
        {
            if (!Open($"Knowledge — {Save.knowledgePoints} points")) return;
            _details.text = "Spend Knowledge Points earned through maths and exploration. Upgrades persist in this save.";
            _action.gameObject.SetActive(false);
            int row = 0;
            foreach (UpgradeDefinition definition in UpgradeRules.Definitions)
            {
                UpgradeDefinition captured = definition;
                int rank = UpgradeRules.Rank(Save, definition.Id);
                int cost = UpgradeRules.NextCost(Save, definition);
                string label = $"{definition.Name}  {rank}/{definition.MaximumRank}  •  {(rank >= definition.MaximumRank ? "Complete" : cost + " KP")}";
                AddRow(label, row++, () =>
                {
                    if (UpgradeRules.Purchase(Save, captured.Id)) { GameBootstrap.Instance.Session.SaveNow(); OpenKnowledge(); }
                    else _details.text = $"Not enough Knowledge Points, or this upgrade is complete.\n\n{captured.Description}";
                });
            }
        }

        private void SelectItem(ItemDefinition definition)
        {
            StatBlock modifier = EquipmentOperations.ModifiersFor(definition.Id);
            string equipped = Save.equipment.Exists(x => x.itemId == definition.Id) ? "\nCurrently equipped." : string.Empty;
            bool equipment = EquipmentOperations.IsEquipment(definition.Category);
            EquipmentEntry current = equipment ? Save.equipment.Find(x => x.slot == definition.Category) : null;
            string comparison = current != null && current.itemId != definition.Id
                ? $"\n\nCompared with {Find(current.itemId)?.DisplayName ?? current.itemId}:\n{ModifierText(modifier + Negate(EquipmentOperations.ModifiersFor(current.itemId)))}"
                : string.Empty;
            _details.text = $"{definition.DisplayName}\n{definition.Description}\n\n{ModifierText(modifier)}{comparison}{equipped}";
            bool usable = definition.Category == ItemCategory.Consumable &&
                          (definition.Id == "healing_potion" || definition.Id == "focus_potion");
            _action.gameObject.SetActive(equipment || usable);
            _action.GetComponentInChildren<Text>().text = equipment ? "Equip" : "Use";
            _action.onClick.RemoveAllListeners();
            _action.onClick.AddListener(() =>
            {
                if (equipment) EquipmentOperations.Equip(Save, definition.Id, definition.Category);
                else EquipmentOperations.UseConsumable(Save, definition.Id);
                StatBlock effective = EquipmentOperations.EffectiveStats(Save);
                Save.currentHealth = Mathf.Min(Save.currentHealth, effective.maxHealth);
                Save.currentFocus = Mathf.Min(Save.currentFocus, effective.maxFocus);
                GameBootstrap.Instance.Session.SaveNow();
                OpenInventory();
            });
        }

        private bool Open(string title)
        {
            if (Save == null) return false;
            _open = true; Time.timeScale = 0f; GameBootstrap.Instance.ChangeState(GameState.Paused);
            _panel.SetActive(true); _title.text = title; ClearContent(); return true;
        }

        public void Close()
        {
            _open = false; _panel.SetActive(false); Time.timeScale = 1f;
            if (GameBootstrap.Instance != null && GameBootstrap.Instance.State == GameState.Paused)
                GameBootstrap.Instance.ChangeState(GameState.Exploring);
        }

        private void ClearContent() { for (int i = _content.childCount - 1; i >= 0; i--) Destroy(_content.GetChild(i).gameObject); }

        private Button AddRow(string label, int row, UnityEngine.Events.UnityAction action)
        {
            float top = 0.98f - row * 0.105f;
            Button button = Button(_content, label, new Vector2(0.02f, top - 0.085f), new Vector2(0.98f, top));
            button.interactable = action != null;
            if (action != null) button.onClick.AddListener(action);
            return button;
        }

        private void AddItemRow(ItemDefinition definition, int quantity, int row, UnityEngine.Events.UnityAction action)
        {
            Button button = AddRow($"{definition.DisplayName}  ×{quantity}", row, action);
            Text label = button.GetComponentInChildren<Text>();
            label.rectTransform.anchorMin = new Vector2(0.16f, 0f);
            if (definition.Icon == null) return;
            Image icon = Image(button.transform, "Item Icon", new Vector2(0.025f, 0.12f), new Vector2(0.14f, 0.88f), Color.white);
            icon.sprite = definition.Icon; icon.preserveAspect = true; icon.raycastTarget = false;
        }

        private void AddNote(string value) { Text text = Text(_content, "Note", 21, TextAnchor.MiddleCenter, new Vector2(0.05f, 0.40f), new Vector2(0.95f, 0.60f)); text.text = value; }
        private ItemDefinition Find(string id) => Array.Find(itemDefinitions, x => x != null && x.Id == id);

        private void BuildUI()
        {
            if (FindFirstObjectByType<EventSystem>() == null) new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            Canvas canvas = new GameObject("Inventory Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster)).GetComponent<Canvas>();
            canvas.transform.SetParent(transform, false); canvas.renderMode = RenderMode.ScreenSpaceOverlay; canvas.sortingOrder = 12;
            CanvasScaler scaler = canvas.GetComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1280f, 720f); scaler.matchWidthOrHeight = 0.5f;
            Image shade = Image(canvas.transform, "Menu Shade", Vector2.zero, Vector2.one, new Color(0.02f, 0.04f, 0.06f, 0.78f));
            Image card = Image(shade.transform, "Inventory Card", new Vector2(0.08f, 0.07f), new Vector2(0.92f, 0.94f), new Color(0.92f, 0.86f, 0.70f));
            _title = Text(card.transform, "Title", 40, TextAnchor.MiddleCenter, new Vector2(0.04f, 0.88f), new Vector2(0.96f, 0.98f));
            _content = Rect(card.transform, "List", new Vector2(0.05f, 0.16f), new Vector2(0.55f, 0.86f));
            _details = Text(card.transform, "Details", 20, TextAnchor.UpperLeft, new Vector2(0.59f, 0.29f), new Vector2(0.95f, 0.84f));
            _action = Button(card.transform, "Action", new Vector2(0.64f, 0.18f), new Vector2(0.90f, 0.27f));
            Button inventory = Button(card.transform, "Inventory [I]", new Vector2(0.05f, 0.05f), new Vector2(0.25f, 0.13f)); inventory.onClick.AddListener(OpenInventory);
            Button character = Button(card.transform, "Character [C]", new Vector2(0.27f, 0.05f), new Vector2(0.47f, 0.13f)); character.onClick.AddListener(OpenCharacter);
            Button knowledge = Button(card.transform, "Knowledge [K]", new Vector2(0.49f, 0.05f), new Vector2(0.69f, 0.13f)); knowledge.onClick.AddListener(OpenKnowledge);
            Button close = Button(card.transform, "Close", new Vector2(0.75f, 0.05f), new Vector2(0.95f, 0.13f)); close.onClick.AddListener(Close);
            _panel = shade.gameObject; _panel.SetActive(false);
        }

        private static string ModifierText(StatBlock s)
        {
            List<string> values = new List<string>();
            if (s.maxHealth != 0) values.Add($"Health {Signed(s.maxHealth)}");
            if (s.maxFocus != 0) values.Add($"Focus {Signed(s.maxFocus)}");
            if (s.strength != 0) values.Add($"Strength {Signed(s.strength)}");
            if (s.defence != 0) values.Add($"Defence {Signed(s.defence)}");
            if (s.magic != 0) values.Add($"Magic {Signed(s.magic)}");
            if (s.intelligence != 0) values.Add($"Intelligence {Signed(s.intelligence)}");
            if (s.agility != 0) values.Add($"Agility {Signed(s.agility)}");
            if (s.luck != 0) values.Add($"Luck {Signed(s.luck)}");
            return values.Count == 0 ? "No direct stat modifier." : string.Join("\n", values);
        }
        private static string Signed(int value) => value >= 0 ? $"+{value}" : value.ToString();
        private static StatBlock Negate(StatBlock value) => new StatBlock
        {
            maxHealth = -value.maxHealth, maxFocus = -value.maxFocus, strength = -value.strength,
            defence = -value.defence, magic = -value.magic, intelligence = -value.intelligence,
            agility = -value.agility, luck = -value.luck
        };
        private static Image Image(Transform parent, string name, Vector2 min, Vector2 max, Color color)
        { Image image = new GameObject(name, typeof(RectTransform), typeof(Image)).GetComponent<Image>(); image.transform.SetParent(parent, false); RectTransform r = image.rectTransform; r.anchorMin = min; r.anchorMax = max; r.offsetMin = Vector2.zero; r.offsetMax = Vector2.zero; image.color = color; return image; }
        private static Text Text(Transform parent, string name, int size, TextAnchor alignment, Vector2 min, Vector2 max)
        { Text text = new GameObject(name, typeof(RectTransform), typeof(Text)).GetComponent<Text>(); text.transform.SetParent(parent, false); RectTransform r = text.rectTransform; r.anchorMin = min; r.anchorMax = max; r.offsetMin = Vector2.zero; r.offsetMax = Vector2.zero; text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); text.fontSize = size; text.alignment = alignment; text.color = new Color(0.14f, 0.11f, 0.09f); return text; }
        private static Button Button(Transform parent, string label, Vector2 min, Vector2 max)
        { Image image = Image(parent, label, min, max, new Color(0.22f, 0.48f, 0.68f)); Button button = image.gameObject.AddComponent<Button>(); Text text = Text(image.transform, "Label", 18, TextAnchor.MiddleCenter, Vector2.zero, Vector2.one); text.text = label; text.color = Color.white; return button; }
        private static RectTransform Rect(Transform parent, string name, Vector2 min, Vector2 max)
        { RectTransform r = new GameObject(name, typeof(RectTransform)).GetComponent<RectTransform>(); r.SetParent(parent, false); r.anchorMin = min; r.anchorMax = max; r.offsetMin = Vector2.zero; r.offsetMax = Vector2.zero; return r; }
    }
}
