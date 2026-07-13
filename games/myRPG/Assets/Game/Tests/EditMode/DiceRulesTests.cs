using System.Collections.Generic;
using MyRPG.Data;
using MyRPG.Dice;
using NUnit.Framework;

namespace MyRPG.Tests
{
    public sealed class DiceRulesTests
    {
        [Test]
        public void D20ResultsAndDifficultyStayInBounds()
        {
            SystemDiceRandom random = new SystemDiceRandom(123);
            for (int i = 0; i < 1000; i++)
            {
                DiceCheckRequest request = new DiceCheckRequest { difficultyClass = 99, relevantStat = DiceStat.Luck };
                DiceCheckResult result = DiceRules.Resolve(request, Stats(), random);
                Assert.That(result.UsedRoll, Is.InRange(1, 20));
                Assert.That(request.difficultyClass, Is.EqualTo(30));
            }
        }

        [Test]
        public void AdvantageUsesHigherControlledRoll()
        {
            DiceCheckRequest request = new DiceCheckRequest { difficultyClass = 15, advantage = true, relevantStat = DiceStat.Intelligence };
            DiceCheckResult result = DiceRules.Resolve(request, Stats(), new FixedRandom(4, 17));
            Assert.That(result.FirstRoll, Is.EqualTo(4));
            Assert.That(result.SecondRoll, Is.EqualTo(17));
            Assert.That(result.UsedRoll, Is.EqualTo(17));
        }

        [Test]
        public void BonusesAreIncludedExactlyOnce()
        {
            DiceCheckRequest request = new DiceCheckRequest { difficultyClass = 16, relevantStat = DiceStat.Intelligence, equipmentBonus = 1, temporaryBonus = 2 };
            DiceCheckResult result = DiceRules.Resolve(request, Stats(), new FixedRandom(10));
            Assert.That(result.StatBonus, Is.EqualTo(2));
            Assert.That(result.FinalTotal, Is.EqualTo(15));
            Assert.That(result.Success, Is.False);
        }

        [Test]
        public void NaturalTwentySucceedsAndNaturalOneFails()
        {
            DiceCheckResult twenty = DiceRules.Resolve(new DiceCheckRequest { difficultyClass = 30 }, Stats(), new FixedRandom(20));
            DiceCheckResult one = DiceRules.Resolve(new DiceCheckRequest { difficultyClass = 2, equipmentBonus = 50 }, Stats(), new FixedRandom(1));
            Assert.That(twenty.CriticalSuccess, Is.True); Assert.That(twenty.Success, Is.True);
            Assert.That(one.CriticalFailure, Is.True); Assert.That(one.Success, Is.False);
        }

        private static StatBlock Stats() => new StatBlock { strength = 5, defence = 5, magic = 5, intelligence = 9, agility = 5, luck = 5 };

        private sealed class FixedRandom : IDiceRandom
        {
            private readonly Queue<int> _values;
            public FixedRandom(params int[] values) { _values = new Queue<int>(values); }
            public int RollD20() => _values.Dequeue();
        }
    }
}
