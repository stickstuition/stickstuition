using MyRPG.Combat;
using MyRPG.Data;
using MyRPG.Dice;
using NUnit.Framework;

namespace MyRPG.Tests
{
    public sealed class CombatRulesTests
    {
        [Test]
        public void DefenceAndDefendReduceDamage()
        {
            CombatantState attacker = Fighter("A", 8, 2);
            CombatantState normal = Fighter("B", 4, 4);
            CombatantState guarded = Fighter("C", 4, 4);
            CombatRules.AddStatus(guarded, StatusEffectType.Defending, 1);
            int normalDamage = CombatRules.PhysicalAttack(attacker, normal, 15).Amount;
            int guardedDamage = CombatRules.PhysicalAttack(attacker, guarded, 15).Amount;
            Assert.That(guardedDamage, Is.LessThan(normalDamage));
        }

        [Test]
        public void NaturalTwentyCreatesCriticalDamage()
        {
            DamageResult result = CombatRules.PhysicalAttack(Fighter("A", 7, 3), Fighter("B", 5, 3), 20);
            Assert.That(result.Critical, Is.True);
            Assert.That(result.Missed, Is.False);
            Assert.That(result.Amount, Is.GreaterThan(0));
        }

        [Test]
        public void BurningTicksAndExpires()
        {
            CombatantState target = Fighter("B", 5, 4);
            CombatRules.AddStatus(target, StatusEffectType.Burning, 2, 3);
            Assert.That(CombatRules.BeginTurn(target), Is.EqualTo(3));
            CombatRules.EndTurn(target);
            Assert.That(target.statuses.Count, Is.EqualTo(1));
            CombatRules.EndTurn(target);
            Assert.That(target.statuses, Is.Empty);
        }

        [Test]
        public void AgilityThenLuckDeterminesFirstTurn()
        {
            CombatantState quick = Fighter("Quick", 5, 3); quick.stats.agility = 9;
            CombatantState slow = Fighter("Slow", 5, 3); slow.stats.agility = 4;
            Assert.That(CombatRules.First(quick, slow), Is.SameAs(quick));
            quick.stats.agility = slow.stats.agility = 5; quick.stats.luck = 2; slow.stats.luck = 8;
            Assert.That(CombatRules.First(quick, slow), Is.SameAs(slow));
        }

        [Test]
        public void LowHealthEnemyDefendsDeterministically()
        {
            CombatantState enemy = Fighter("Enemy", 5, 4); enemy.health = 20;
            Assert.That(EnemyAI.Choose(enemy, Fighter("Player", 5, 4), new FixedRandom()), Is.EqualTo(EnemyAction.Defend));
        }

        private static CombatantState Fighter(string name, int strength, int defence)
        {
            return new CombatantState
            {
                displayName = name,
                stats = new StatBlock { maxHealth = 100, maxFocus = 20, strength = strength, defence = defence, magic = 5, intelligence = 5, agility = 5, luck = 5 },
                health = 100, focus = 20
            };
        }

        private sealed class FixedRandom : IDiceRandom { public int RollD20() => 10; }
    }
}
