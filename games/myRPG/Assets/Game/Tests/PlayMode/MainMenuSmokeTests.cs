using System.Collections;
using MyRPG.Core;
using MyRPG.UI;
using MyRPG.Data;
using MyRPG.Saving;
using MyRPG.Education;
using MyRPG.Dice;
using MyRPG.Combat;
using MyRPG.Inventory;
using MyRPG.World;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using UnityEngine.UI;

namespace MyRPG.Tests
{
    public sealed class MainMenuSmokeTests
    {
        [UnityTest]
        public IEnumerator BootLoadsInteractiveMainMenu()
        {
            if (GameBootstrap.Instance != null) { UnityEngine.Object.Destroy(GameBootstrap.Instance.gameObject); yield return null; }
            yield return SceneManager.LoadSceneAsync(SceneNames.Boot);
            for (int frame = 0; frame < 120 && SceneManager.GetActiveScene().name != SceneNames.MainMenu; frame++)
                yield return null;
            Assert.That(SceneManager.GetActiveScene().name, Is.EqualTo(SceneNames.MainMenu));
            Assert.That(UnityEngine.Object.FindFirstObjectByType<MainMenuController>(), Is.Not.Null);
            Button[] buttons = UnityEngine.Object.FindObjectsByType<Button>(FindObjectsSortMode.None);
            Assert.That(buttons.Length, Is.GreaterThanOrEqualTo(5));
            Assert.That(UnityEngine.Object.FindFirstObjectByType<CanvasScaler>(), Is.Not.Null);
        }

        [UnityTest]
        public IEnumerator ActiveSaveLoadsPlayableVillage()
        {
            if (GameBootstrap.Instance != null) { UnityEngine.Object.Destroy(GameBootstrap.Instance.gameObject); yield return null; }
            yield return SceneManager.LoadSceneAsync(SceneNames.Boot);
            for (int frame = 0; frame < 120 && SceneManager.GetActiveScene().name != SceneNames.MainMenu; frame++) yield return null;
            GameBootstrap bootstrap = GameBootstrap.Instance;
            StatBlock stats = new StatBlock { maxHealth = 100, maxFocus = 20, strength = 5, defence = 5, magic = 5, intelligence = 5, agility = 5, luck = 5 };
            bootstrap.Session.UseNew(0, SaveData.CreateNew("Test Hero", CharacterClassId.Rogue, stats));
            bootstrap.LoadGameplayScene(SceneNames.Village);
            for (int frame = 0; frame < 120 && SceneManager.GetActiveScene().name != SceneNames.Village; frame++) yield return null;
            yield return null;
            Assert.That(SceneManager.GetActiveScene().name, Is.EqualTo(SceneNames.Village));
            Assert.That(UnityEngine.Object.FindFirstObjectByType<PlayerController>(), Is.Not.Null);
            Assert.That(UnityEngine.Object.FindFirstObjectByType<IsometricCamera>(), Is.Not.Null);
            Assert.That(UnityEngine.Object.FindFirstObjectByType<InteractionScanner>(), Is.Not.Null);
            Assert.That(UnityEngine.Object.FindFirstObjectByType<WorldUI>(), Is.Not.Null);
            Assert.That(UnityEngine.Object.FindObjectsByType<WorldChest>(FindObjectsSortMode.None).Length, Is.GreaterThan(0));
            Assert.That(UnityEngine.Object.FindFirstObjectByType<QuestionManager>(), Is.Not.Null);
            Assert.That(UnityEngine.Object.FindFirstObjectByType<DiceManager>(), Is.Not.Null);
            Assert.That(UnityEngine.Object.FindFirstObjectByType<WorldDiceChallenge>(), Is.Not.Null);
            InventoryMenu inventory = UnityEngine.Object.FindFirstObjectByType<InventoryMenu>();
            Assert.That(inventory, Is.Not.Null);
            MathsShrine shrine = UnityEngine.Object.FindFirstObjectByType<MathsShrine>();
            Assert.That(shrine, Is.Not.Null);
            Assert.That(bootstrap.State, Is.EqualTo(GameState.Exploring));
            inventory.OpenInventory();
            Assert.That(bootstrap.State, Is.EqualTo(GameState.Paused));
            Assert.That(UnityEngine.Object.FindFirstObjectByType<PlayerController>().CanMove, Is.False);
            inventory.Close();
            Assert.That(bootstrap.State, Is.EqualTo(GameState.Exploring));
            bootstrap.ChangeState(GameState.Paused);
            Assert.That(UnityEngine.Object.FindFirstObjectByType<PlayerController>().CanMove, Is.False);
            bootstrap.ChangeState(GameState.Exploring);
            DiceManager dice = UnityEngine.Object.FindFirstObjectByType<DiceManager>();
            dice.Begin(new DiceCheckRequest { title = "Test Roll", description = "Controlled roll", difficultyClass = 10, relevantStat = DiceStat.Luck },
                stats, null, new FourteenRandom());
            Assert.That(bootstrap.State, Is.EqualTo(GameState.DiceChallenge));
            yield return new WaitForSecondsRealtime(1.6f);
            Assert.That(GameObject.Find("Animated D20"), Is.Not.Null);
            foreach (Button button in UnityEngine.Object.FindObjectsByType<Button>(FindObjectsSortMode.None))
                if (button.name == "Continue" && button.gameObject.activeInHierarchy) { button.onClick.Invoke(); break; }
            Assert.That(bootstrap.State, Is.EqualTo(GameState.Exploring));
            shrine.Interact(UnityEngine.Object.FindFirstObjectByType<PlayerController>());
            Assert.That(bootstrap.State, Is.EqualTo(GameState.Question));
            Assert.That(UnityEngine.Object.FindFirstObjectByType<PlayerController>().CanMove, Is.False);
            bootstrap.Session.Clear();
        }

        private sealed class FourteenRandom : IDiceRandom
        {
            public int RollD20() => 14;
        }

        [UnityTest]
        public IEnumerator SkeletonEncounterCompletesATurnCycle()
        {
            if (GameBootstrap.Instance != null) { UnityEngine.Object.Destroy(GameBootstrap.Instance.gameObject); yield return null; }
            yield return SceneManager.LoadSceneAsync(SceneNames.Boot);
            for (int frame = 0; frame < 120 && SceneManager.GetActiveScene().name != SceneNames.MainMenu; frame++) yield return null;
            GameBootstrap bootstrap = GameBootstrap.Instance;
            StatBlock stats = new StatBlock { maxHealth = 100, maxFocus = 25, strength = 8, defence = 7, magic = 4, intelligence = 6, agility = 10, luck = 6 };
            bootstrap.Session.UseNew(0, SaveData.CreateNew("Battle Hero", CharacterClassId.Ranger, stats));
            bootstrap.LoadGameplayScene(SceneNames.Village);
            for (int frame = 0; frame < 120 && SceneManager.GetActiveScene().name != SceneNames.Village; frame++) yield return null;
            yield return null;
            WorldCombatEncounter encounter = UnityEngine.Object.FindFirstObjectByType<WorldCombatEncounter>();
            PlayerController player = UnityEngine.Object.FindFirstObjectByType<PlayerController>();
            encounter.Interact(player);
            Assert.That(bootstrap.State, Is.EqualTo(GameState.Combat));
            Assert.That(CombatManager.Instance.Phase, Is.EqualTo(CombatPhase.PlayerTurn));
            Assert.That(player.CanMove, Is.False);
            CombatManager.Instance.Attack();
            yield return new WaitForSeconds(1.4f);
            Assert.That(CombatManager.Instance.Phase, Is.EqualTo(CombatPhase.PlayerTurn).Or.EqualTo(CombatPhase.Victory));
            bootstrap.Session.Clear();
        }

        [UnityTest]
        public IEnumerator AllThreeChapterScenesContainRequiredProgressionContent()
        {
            if (GameBootstrap.Instance != null) { UnityEngine.Object.Destroy(GameBootstrap.Instance.gameObject); yield return null; }
            yield return SceneManager.LoadSceneAsync(SceneNames.Boot);
            for (int frame = 0; frame < 120 && SceneManager.GetActiveScene().name != SceneNames.MainMenu; frame++) yield return null;
            GameBootstrap bootstrap = GameBootstrap.Instance;
            StatBlock stats = new StatBlock { maxHealth = 110, maxFocus = 30, strength = 7, defence = 7, magic = 5, intelligence = 7, agility = 7, luck = 6 };
            bootstrap.Session.UseNew(0, SaveData.CreateNew("Chapter Hero", CharacterClassId.Knight, stats));

            bootstrap.LoadGameplayScene(SceneNames.BrokenRoad);
            for (int frame = 0; frame < 120 && SceneManager.GetActiveScene().name != SceneNames.BrokenRoad; frame++) yield return null;
            yield return null;
            Assert.That(UnityEngine.Object.FindObjectsByType<WorldCombatEncounter>(FindObjectsSortMode.None).Length, Is.GreaterThanOrEqualTo(2));
            Assert.That(UnityEngine.Object.FindFirstObjectByType<CompanionRescue>(), Is.Not.Null);
            Assert.That(UnityEngine.Object.FindFirstObjectByType<ChapterExit>(), Is.Not.Null);

            bootstrap.LoadGameplayScene(SceneNames.Crypt);
            for (int frame = 0; frame < 120 && SceneManager.GetActiveScene().name != SceneNames.Crypt; frame++) yield return null;
            yield return null;
            Assert.That(UnityEngine.Object.FindObjectsByType<WorldCombatEncounter>(FindObjectsSortMode.None).Length, Is.GreaterThanOrEqualTo(2));
            Assert.That(UnityEngine.Object.FindFirstObjectByType<WorldDiceChallenge>(), Is.Not.Null);
            Assert.That(UnityEngine.Object.FindFirstObjectByType<MathsShrine>(), Is.Not.Null);

            bootstrap.LoadGameplayScene(SceneNames.BoneKingKeep);
            for (int frame = 0; frame < 120 && SceneManager.GetActiveScene().name != SceneNames.BoneKingKeep; frame++) yield return null;
            yield return null;
            WorldCombatEncounter[] keepEncounters = UnityEngine.Object.FindObjectsByType<WorldCombatEncounter>(FindObjectsSortMode.None);
            Assert.That(keepEncounters.Length, Is.GreaterThanOrEqualTo(2));
            Assert.That(System.Array.Exists(keepEncounters, x => x.IsBoss && x.EncounterId == "bone_king"), Is.True);

            bootstrap.Session.Save.unlockedCompanions.Add(CompanionId.Bramble);
            bootstrap.Session.Save.unlockedCompanions.Add(CompanionId.Lyra);
            bootstrap.Session.Save.unlockedCompanions.Add(CompanionId.Flint);
            bootstrap.LoadGameplayScene(SceneNames.Ending);
            for (int frame = 0; frame < 120 && SceneManager.GetActiveScene().name != SceneNames.Ending; frame++) yield return null;
            yield return null;
            Assert.That(UnityEngine.Object.FindFirstObjectByType<EndingController>(), Is.Not.Null);
            bootstrap.Session.Clear();
        }
    }
}
