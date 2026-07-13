using System.Collections;
using MyRPG.Core;
using MyRPG.Data;
using MyRPG.Dice;
using MyRPG.Education;
using MyRPG.Inventory;
using MyRPG.Player;
using MyRPG.Saving;
using MyRPG.World;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using MyRPG.Presentation;

namespace MyRPG.Combat
{
    public sealed class CombatManager : MonoBehaviour
    {
        public static CombatManager Instance { get; private set; }
        public CombatPhase Phase { get; private set; }
        [SerializeField] private Vector3 playerBattlePosition = new Vector3(-2.5f, 0.1f, 10f);
        [SerializeField] private Vector3 enemyBattlePosition = new Vector3(2.5f, 0f, 10f);
        private readonly IDiceRandom _random = new SystemDiceRandom(System.Environment.TickCount);
        private CombatantState _player;
        private CombatantState _enemy;
        private WorldCombatEncounter _encounter;
        private PlayerController _worldPlayer;
        private Vector3 _playerReturnPosition;
        private Vector3 _enemyReturnPosition;
        private GameObject _panel;
        private Text _turnLabel;
        private Text _playerLabel;
        private Text _enemyLabel;
        private Text _log;
        private Text _status;
        private Slider _playerHealth;
        private Slider _playerFocus;
        private Slider _enemyHealth;
        private GameObject _commands;
        private GameObject _resultPanel;
        private Text _resultText;
        private int _bossPhase;
        private bool _bossChallengeTriggered;

        private void Awake()
        {
            Instance = this;
            BuildUI();
        }

        public bool Begin(WorldCombatEncounter encounter, PlayerController player)
        {
            if (Phase != CombatPhase.None || encounter == null || player == null) return false;
            SaveData save = GameBootstrap.Instance?.Session?.Save;
            if (save == null) return false;
            _encounter = encounter; _worldPlayer = player; _playerReturnPosition = player.transform.position; _enemyReturnPosition = encounter.EnemyModel.transform.position;
            _bossPhase = 1; _bossChallengeTriggered = false;
            StatBlock effectiveStats = EquipmentOperations.EffectiveStats(save);
            _player = new CombatantState { id = "player", displayName = save.adventurerName, stats = effectiveStats, health = Mathf.Clamp(save.currentHealth, 1, effectiveStats.maxHealth), focus = Mathf.Clamp(save.currentFocus, 0, effectiveStats.maxFocus) };
            StatBlock enemyStats = encounter.EnemyStats; enemyStats.ClampMinimums();
            _enemy = new CombatantState { id = encounter.EncounterId, displayName = encounter.EnemyName, stats = enemyStats, health = enemyStats.maxHealth, focus = enemyStats.maxFocus, enemy = true };
            player.Warp(playerBattlePosition); encounter.EnemyModel.transform.position = enemyBattlePosition;
            _panel.SetActive(true); _resultPanel.SetActive(false); _log.text = "Battle begins!"; Phase = CombatPhase.Starting;
            GameBootstrap.Instance.ChangeState(GameState.Combat);
            Refresh();
            CombatantState first = CombatRules.First(_player, _enemy);
            if (first == _player) StartPlayerTurn(); else StartCoroutine(EnemyTurn());
            return true;
        }

        private void StartPlayerTurn()
        {
            if (CheckEnd()) return;
            Phase = CombatPhase.PlayerTurn;
            int burn = CombatRules.BeginTurn(_player);
            if (burn > 0) Log($"{_player.displayName} takes {burn} burning damage.");
            if (CheckEnd()) return;
            if (_player.IsStunned)
            {
                Log($"{_player.displayName} is stunned and misses the turn.");
                CombatRules.EndTurn(_player); StartCoroutine(EnemyTurn()); return;
            }
            _turnLabel.text = "Your turn";
            _commands.SetActive(true);
            Refresh();
        }

        public void Attack()
        {
            if (!TakeCommand()) return;
            DamageResult result = CombatRules.PhysicalAttack(_player, _enemy, _random.RollD20());
            ScenePresentation.Instance?.Attack(_encounter.EnemyModel.transform.position);
            if (!result.Missed) ScenePresentation.Instance?.Impact(_encounter.EnemyModel.transform.position);
            Log(result.Missed ? "Your attack misses." : result.Critical ? $"Critical hit! {result.Amount} damage." : $"You deal {result.Amount} damage.");
            FinishPlayerAction();
        }

        public void Defend()
        {
            if (!TakeCommand()) return;
            CombatRules.AddStatus(_player, StatusEffectType.Defending, 2);
            Log("You brace for the next attack.");
            FinishPlayerAction();
        }

        public void Ability()
        {
            if (!TakeCommand()) return;
            CharacterClassId classId = GameBootstrap.Instance.Session.Save.characterClass;
            int cost = classId == CharacterClassId.Mage ? 5 : 4;
            if (_player.focus < cost) { Log("Not enough Focus."); Phase = CombatPhase.PlayerTurn; _commands.SetActive(true); return; }
            _player.focus -= cost;
            switch (classId)
            {
                case CharacterClassId.Knight:
                    CombatRules.AddStatus(_player, StatusEffectType.Defending, 3); Log("Shield Wall greatly strengthens your guard."); break;
                case CharacterClassId.Mage:
                    ScenePresentation.Instance?.Attack(_encounter.EnemyModel.transform.position, true);
                    Log($"Number Flame deals {CombatRules.MagicalAttack(_player, _enemy, 12)} magical damage."); CombatRules.AddStatus(_enemy, StatusEffectType.Burning, 2, 3); break;
                case CharacterClassId.Ranger:
                    DamageResult volley = CombatRules.PhysicalAttack(_player, _enemy, 16); int second = CombatRules.PhysicalAttack(_player, _enemy, 12).Amount;
                    Log($"Quick Volley deals {volley.Amount + second} damage."); break;
                case CharacterClassId.Rogue:
                    DamageResult trick = CombatRules.PhysicalAttack(_player, _enemy, 20); Log($"Lucky Trick lands for {trick.Amount} damage!"); break;
            }
            FinishPlayerAction();
        }

        public void UseItem()
        {
            if (!TakeCommand()) return;
            SaveData save = GameBootstrap.Instance.Session.Save;
            if (!InventoryOperations.Remove(save.inventory, "healing_potion", 1))
            {
                Log("You have no Healing Potions."); Phase = CombatPhase.PlayerTurn; _commands.SetActive(true); return;
            }
            int healed = CombatRules.Heal(_player, 35);
            Log($"Healing Potion restores {healed} health.");
            FinishPlayerAction();
        }

        public void MathsPower()
        {
            if (!TakeCommand()) return;
            Phase = CombatPhase.ResolvingPlayerAction;
            QuestionManager.Instance.Begin(ArithmeticSubtopic.Multiplication, outcome =>
            {
                GameBootstrap.Instance.ChangeState(GameState.Combat);
                if (outcome.Correct)
                {
                    int mathsRank = UpgradeRules.Rank(GameBootstrap.Instance.Session.Save, "maths_bonus");
                    int damage = CombatRules.MagicalAttack(_player, _enemy, 14 + mathsRank * 2);
                    ScenePresentation.Instance?.Attack(_encounter.EnemyModel.transform.position, true);
                    CombatRules.AddStatus(_enemy, StatusEffectType.Stunned, 1);
                    Log($"Maths Power deals {damage} damage and stuns {_enemy.displayName}!");
                }
                else
                {
                    DamageResult normal = CombatRules.PhysicalAttack(_player, _enemy, 10);
                    Log($"No maths bonus, but your normal action deals {normal.Amount} damage.");
                }
                FinishPlayerAction();
            });
        }

        public void Flee()
        {
            if (!TakeCommand()) return;
            if (_encounter.IsBoss) { Log("You cannot flee from this battle."); Phase = CombatPhase.PlayerTurn; _commands.SetActive(true); return; }
            int chance = 8 + _player.stats.agility / 2 + _player.stats.luck / 3;
            if (_random.RollD20() <= chance) { Log("You escape safely."); StartCoroutine(EndCombat(false, true)); }
            else { Log("You could not escape!"); FinishPlayerAction(); }
        }

        private bool TakeCommand()
        {
            if (Phase != CombatPhase.PlayerTurn) return false;
            Phase = CombatPhase.ResolvingPlayerAction; _commands.SetActive(false); return true;
        }

        private void FinishPlayerAction()
        {
            CombatRules.EndTurn(_player); Refresh();
            UpdateBossPhase();
            if (!CheckEnd()) StartCoroutine(CompanionTurnsThenEnemy());
        }

        private IEnumerator CompanionTurnsThenEnemy()
        {
            var companions = GameBootstrap.Instance.Session.Save.unlockedCompanions;
            for (int i = 0; i < companions.Count && _enemy.IsAlive; i++)
            {
                yield return new WaitForSeconds(0.22f);
                int damage = 4 + GameBootstrap.Instance.Session.Save.level + i * 2;
                _enemy.health = Mathf.Max(0, _enemy.health - damage);
                Log($"{companions[i]} assists for {damage} damage.");
            }
            UpdateBossPhase();
            if (!CheckEnd()) StartCoroutine(EnemyTurn());
        }

        private IEnumerator EnemyTurn()
        {
            Phase = CombatPhase.EnemyTurn; _commands.SetActive(false); _turnLabel.text = $"{_enemy.displayName}’s turn"; Refresh();
            yield return new WaitForSeconds(0.65f);
            int burn = CombatRules.BeginTurn(_enemy);
            if (burn > 0) Log($"{_enemy.displayName} takes {burn} burning damage.");
            if (CheckEnd()) yield break;
            if (_enemy.IsStunned) Log($"{_enemy.displayName} is stunned!");
            else
            {
                if (_encounter.IsBoss && _bossPhase >= 3 && !_bossChallengeTriggered)
                {
                    _bossChallengeTriggered = true;
                    bool answered = false, correct = false;
                    QuestionManager.Instance.Begin(ArithmeticSubtopic.OrderOfOperations, outcome => { correct = outcome.Correct; answered = true; GameBootstrap.Instance.ChangeState(GameState.Combat); });
                    yield return new WaitUntil(() => answered);
                    if (correct) Log("Your maths power interrupts the Bone King’s Royal Ruin!");
                    else Log($"Royal Ruin strikes for {CombatRules.MagicalAttack(_enemy, _player, 20)} damage.");
                }
                else
                {
                EnemyAction action = EnemyAI.Choose(_enemy, _player, _random);
                switch (action)
                {
                    case EnemyAction.Defend: CombatRules.AddStatus(_enemy, StatusEffectType.Defending, 2); Log($"{_enemy.displayName} raises its guard."); break;
                    case EnemyAction.Weaken:
                        _enemy.focus = Mathf.Max(0, _enemy.focus - 4); CombatRules.AddStatus(_player, StatusEffectType.Weakened, 2, 2); Log($"{_enemy.displayName} weakens your magic."); break;
                    case EnemyAction.HeavyAttack:
                        int heavy = CombatRules.MagicalAttack(_enemy, _player, 8); Log($"{_enemy.displayName} uses Bone Smash for {heavy} damage."); break;
                    default:
                        DamageResult hit = CombatRules.PhysicalAttack(_enemy, _player, _random.RollD20()); Log(hit.Missed ? $"{_enemy.displayName} misses." : $"{_enemy.displayName} deals {hit.Amount} damage."); break;
                }
                }
            }
            CombatRules.EndTurn(_enemy); Refresh();
            yield return new WaitForSeconds(0.45f);
            if (!CheckEnd()) StartPlayerTurn();
        }

        private bool CheckEnd()
        {
            if (Phase == CombatPhase.Victory || Phase == CombatPhase.Defeat) return true;
            if (!_enemy.IsAlive) { Phase = CombatPhase.Victory; StartCoroutine(Victory()); return true; }
            if (!_player.IsAlive) { Phase = CombatPhase.Defeat; ShowDefeat(); return true; }
            return false;
        }

        private void UpdateBossPhase()
        {
            if (!_encounter.IsBoss || !_enemy.IsAlive) return;
            float ratio = (float)_enemy.health / _enemy.stats.maxHealth;
            if (_bossPhase == 1 && ratio <= 0.66f)
            {
                _bossPhase = 2; _enemy.stats.strength += 2; _enemy.stats.magic += 2;
                CombatRules.AddStatus(_enemy, StatusEffectType.Defending, 2);
                Log("Phase 2: The Bone King summons a bone shield and grows stronger!");
            }
            if (_bossPhase == 2 && ratio <= 0.33f)
            {
                _bossPhase = 3; _enemy.stats.strength += 2; _enemy.stats.agility += 2;
                Log("Phase 3: The crown blazes — prepare to interrupt Royal Ruin!");
            }
        }

        private IEnumerator Victory()
        {
            _commands.SetActive(false); _turnLabel.text = "Victory!";
            yield return new WaitForSeconds(0.5f);
            SaveData save = GameBootstrap.Instance.Session.Save;
            save.currentHealth = _player.health; save.currentFocus = _player.focus;
            save.experience += _encounter.ExperienceReward;
            int previousLevel = save.level; save.level = ProgressionRules.ResolveLevel(save.level, save.experience);
            if (!save.defeatedEnemyIds.Contains(_encounter.EncounterId)) save.defeatedEnemyIds.Add(_encounter.EncounterId);
            InventoryOperations.Add(save.inventory, "healing_potion", 1, 9);
            GameBootstrap.Instance.Session.SaveNow();
            _resultText.text = $"Victory!\n+{_encounter.ExperienceReward} XP\nHealing Potion found" + (save.level > previousLevel ? $"\nLevel up! You are now level {save.level}." : string.Empty);
            _resultPanel.SetActive(true);
        }

        private void ShowDefeat()
        {
            _commands.SetActive(false);
            _resultText.text = "Defeated\nYour last save is safe. Retry the battle or return to the menu.";
            _resultPanel.SetActive(true);
        }

        public void ResultContinue()
        {
            if (Phase == CombatPhase.Victory) StartCoroutine(EndCombat(true, false));
            else Retry();
        }

        public void Retry()
        {
            if (Phase != CombatPhase.Defeat) return;
            SaveData save = GameBootstrap.Instance.Session.Save;
            _player.health = Mathf.Max(1, save.currentHealth); _player.focus = save.currentFocus;
            _enemy.health = _enemy.stats.maxHealth; _enemy.focus = _enemy.stats.maxFocus;
            _player.statuses.Clear(); _enemy.statuses.Clear(); _resultPanel.SetActive(false); Log("The battle begins again."); StartPlayerTurn();
        }

        public void ReturnToMenu()
        {
            Time.timeScale = 1f;
            GameBootstrap.Instance.LoadGameplayScene(SceneNames.MainMenu);
        }

        private IEnumerator EndCombat(bool defeatedEnemy, bool fled)
        {
            Phase = CombatPhase.Ending; yield return new WaitForSeconds(0.25f);
            _worldPlayer.Warp(_playerReturnPosition);
            if (_encounter != null && _encounter.EnemyModel != null) _encounter.EnemyModel.transform.position = _enemyReturnPosition;
            if (defeatedEnemy) _encounter.MarkDefeated();
            _panel.SetActive(false); _resultPanel.SetActive(false); Phase = CombatPhase.None;
            GameBootstrap.Instance.ChangeState(GameState.Exploring);
            if (fled) WorldUI.Instance?.ShowNotice("You escaped the battle.");
        }

        private void Refresh()
        {
            _playerHealth.maxValue = _player.stats.maxHealth; _playerHealth.value = _player.health;
            _playerFocus.maxValue = Mathf.Max(1, _player.stats.maxFocus); _playerFocus.value = _player.focus;
            _enemyHealth.maxValue = _enemy.stats.maxHealth; _enemyHealth.value = _enemy.health;
            _playerLabel.text = $"{_player.displayName}  HP {_player.health}/{_player.stats.maxHealth}  Focus {_player.focus}/{_player.stats.maxFocus}";
            _enemyLabel.text = $"{_enemy.displayName}  HP {_enemy.health}/{_enemy.stats.maxHealth}";
            _status.text = $"You: {StatusText(_player)}    Enemy: {StatusText(_enemy)}";
        }

        private void Log(string message) { _log.text = message + "\n" + _log.text; if (_log.text.Length > 420) _log.text = _log.text.Substring(0, 420); Refresh(); }
        private static string StatusText(CombatantState value) => value.statuses.Count == 0 ? "Ready" : string.Join(", ", value.statuses.ConvertAll(x => x.type.ToString()));

        private void BuildUI()
        {
            if (FindFirstObjectByType<EventSystem>() == null) new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            Canvas canvas = new GameObject("Combat Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster)).GetComponent<Canvas>();
            canvas.transform.SetParent(transform, false); canvas.renderMode = RenderMode.ScreenSpaceOverlay; canvas.sortingOrder = 15;
            CanvasScaler scaler = canvas.GetComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1280f, 720f); scaler.matchWidthOrHeight = 0.5f;
            Image root = Image(canvas.transform, "Battle HUD", Vector2.zero, Vector2.one, new Color(0.02f, 0.04f, 0.06f, 0.42f));
            _turnLabel = Text(root.transform, "Turn", 34, TextAnchor.MiddleCenter, new Vector2(0.34f, 0.88f), new Vector2(0.66f, 0.97f));
            _playerLabel = Text(root.transform, "Player", 20, TextAnchor.MiddleLeft, new Vector2(0.03f, 0.78f), new Vector2(0.47f, 0.86f));
            _enemyLabel = Text(root.transform, "Enemy", 20, TextAnchor.MiddleRight, new Vector2(0.53f, 0.78f), new Vector2(0.97f, 0.86f));
            _playerHealth = Slider(root.transform, "Player Health", new Vector2(0.03f, 0.73f), new Vector2(0.40f, 0.77f), new Color(0.72f, 0.18f, 0.16f));
            _playerFocus = Slider(root.transform, "Player Focus", new Vector2(0.03f, 0.68f), new Vector2(0.40f, 0.72f), new Color(0.20f, 0.48f, 0.83f));
            _enemyHealth = Slider(root.transform, "Enemy Health", new Vector2(0.60f, 0.73f), new Vector2(0.97f, 0.77f), new Color(0.72f, 0.18f, 0.16f));
            _status = Text(root.transform, "Statuses", 17, TextAnchor.MiddleCenter, new Vector2(0.12f, 0.61f), new Vector2(0.88f, 0.67f));
            _log = Text(root.transform, "Combat Log", 18, TextAnchor.UpperLeft, new Vector2(0.60f, 0.08f), new Vector2(0.97f, 0.34f));
            _commands = new GameObject("Commands", typeof(RectTransform)); _commands.transform.SetParent(root.transform, false);
            RectTransform commandsRect = _commands.GetComponent<RectTransform>(); commandsRect.anchorMin = new Vector2(0.03f, 0.05f); commandsRect.anchorMax = new Vector2(0.55f, 0.34f); commandsRect.offsetMin = Vector2.zero; commandsRect.offsetMax = Vector2.zero;
            Command("Attack", 0, Attack); Command("Ability", 1, Ability); Command("Item", 2, UseItem); Command("Defend", 3, Defend); Command("Maths Power", 4, MathsPower); Command("Flee", 5, Flee);
            _resultPanel = Image(root.transform, "Battle Result", new Vector2(0.25f, 0.24f), new Vector2(0.75f, 0.76f), new Color(0.10f, 0.14f, 0.17f, 0.98f)).gameObject;
            _resultText = Text(_resultPanel.transform, "Result", 28, TextAnchor.MiddleCenter, new Vector2(0.08f, 0.30f), new Vector2(0.92f, 0.92f));
            Button continueButton = Button(_resultPanel.transform, "Continue / Retry", new Vector2(0.12f, 0.09f), new Vector2(0.48f, 0.25f)); continueButton.onClick.AddListener(ResultContinue);
            Button menuButton = Button(_resultPanel.transform, "Main Menu", new Vector2(0.52f, 0.09f), new Vector2(0.88f, 0.25f)); menuButton.onClick.AddListener(ReturnToMenu);
            _panel = root.gameObject; _panel.SetActive(false); _resultPanel.SetActive(false);
        }

        private void Command(string label, int index, UnityEngine.Events.UnityAction action)
        {
            int column = index % 3, row = index / 3;
            Button button = Button(_commands.transform, label, new Vector2(column * 0.335f, 0.53f - row * 0.5f), new Vector2(column * 0.335f + 0.31f, 0.93f - row * 0.5f));
            button.onClick.AddListener(action);
        }

        private static Image Image(Transform parent, string name, Vector2 min, Vector2 max, Color color)
        {
            Image image = new GameObject(name, typeof(RectTransform), typeof(Image)).GetComponent<Image>(); image.transform.SetParent(parent, false);
            RectTransform rect = image.rectTransform; rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = Vector2.zero; rect.offsetMax = Vector2.zero; image.color = color; return image;
        }
        private static Text Text(Transform parent, string name, int size, TextAnchor alignment, Vector2 min, Vector2 max)
        {
            Text text = new GameObject(name, typeof(RectTransform), typeof(Text)).GetComponent<Text>(); text.transform.SetParent(parent, false);
            RectTransform rect = text.rectTransform; rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = Vector2.zero; rect.offsetMax = Vector2.zero;
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); text.fontSize = size; text.alignment = alignment; text.color = Color.white; return text;
        }
        private static Slider Slider(Transform parent, string name, Vector2 min, Vector2 max, Color color)
        {
            Image background = Image(parent, name, min, max, new Color(0.05f, 0.05f, 0.05f, 0.85f));
            Slider slider = background.gameObject.AddComponent<Slider>();
            Image fill = Image(background.transform, "Fill", Vector2.zero, Vector2.one, color); slider.fillRect = fill.rectTransform; slider.targetGraphic = fill; slider.interactable = false; return slider;
        }
        private static Button Button(Transform parent, string label, Vector2 min, Vector2 max)
        {
            Image image = Image(parent, label, min, max, new Color(0.22f, 0.48f, 0.68f)); Button button = image.gameObject.AddComponent<Button>();
            Text text = Text(image.transform, "Label", 20, TextAnchor.MiddleCenter, Vector2.zero, Vector2.one); text.text = label; return button;
        }
    }
}
