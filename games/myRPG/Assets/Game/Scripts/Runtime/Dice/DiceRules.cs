using System;
using MyRPG.Data;

namespace MyRPG.Dice
{
    public enum DiceStat { Strength, Defence, Magic, Intelligence, Agility, Luck }

    [Serializable]
    public sealed class DiceCheckRequest
    {
        public string challengeId;
        public string title;
        public string description;
        public int difficultyClass = 10;
        public DiceStat relevantStat = DiceStat.Luck;
        public int equipmentBonus;
        public int temporaryBonus;
        public bool advantage;
    }

    public readonly struct DiceCheckResult
    {
        public readonly DiceCheckRequest Request;
        public readonly int FirstRoll;
        public readonly int SecondRoll;
        public readonly int UsedRoll;
        public readonly int StatBonus;
        public readonly int FinalTotal;
        public readonly bool Success;
        public readonly bool CriticalSuccess;
        public readonly bool CriticalFailure;

        public DiceCheckResult(DiceCheckRequest request, int first, int second, int used, int statBonus, int finalTotal, bool success)
        {
            Request = request; FirstRoll = first; SecondRoll = second; UsedRoll = used; StatBonus = statBonus; FinalTotal = finalTotal;
            CriticalSuccess = used == 20; CriticalFailure = used == 1; Success = success;
        }
    }

    public interface IDiceRandom { int RollD20(); }

    public sealed class SystemDiceRandom : IDiceRandom
    {
        private readonly Random _random;
        public SystemDiceRandom(int seed) { _random = new Random(seed); }
        public int RollD20() => _random.Next(1, 21);
    }

    public static class DiceRules
    {
        public static DiceCheckResult Resolve(DiceCheckRequest request, StatBlock stats, IDiceRandom random)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (random == null) throw new ArgumentNullException(nameof(random));
            request.difficultyClass = Math.Max(2, Math.Min(30, request.difficultyClass));
            int first = ClampRoll(random.RollD20());
            int second = request.advantage ? ClampRoll(random.RollD20()) : 0;
            int used = request.advantage ? Math.Max(first, second) : first;
            int statBonus = StatBonus(StatValue(stats, request.relevantStat));
            int total = used + statBonus + request.equipmentBonus + request.temporaryBonus;
            bool success = used == 20 || (used != 1 && total >= request.difficultyClass);
            return new DiceCheckResult(request, first, second, used, statBonus, total, success);
        }

        public static int StatBonus(int statValue) => (int)Math.Floor((Math.Max(0, statValue) - 5) / 2f);

        public static int StatValue(StatBlock stats, DiceStat stat)
        {
            return stat switch
            {
                DiceStat.Strength => stats.strength,
                DiceStat.Defence => stats.defence,
                DiceStat.Magic => stats.magic,
                DiceStat.Intelligence => stats.intelligence,
                DiceStat.Agility => stats.agility,
                DiceStat.Luck => stats.luck,
                _ => throw new ArgumentOutOfRangeException(nameof(stat))
            };
        }

        private static int ClampRoll(int value) => Math.Max(1, Math.Min(20, value));
    }
}
