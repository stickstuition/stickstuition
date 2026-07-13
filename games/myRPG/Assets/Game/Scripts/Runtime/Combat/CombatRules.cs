using System;
using System.Collections.Generic;
using MyRPG.Data;
using MyRPG.Dice;

namespace MyRPG.Combat
{
    public enum CombatPhase { None, Starting, PlayerTurn, ResolvingPlayerAction, EnemyTurn, Victory, Defeat, Ending }
    public enum CombatActionType { Attack, Ability, Item, Defend, MathsPower, Flee }
    public enum StatusEffectType { Defending, Stunned, Weakened, Burning }

    [Serializable]
    public sealed class StatusEffectState
    {
        public StatusEffectType type;
        public int remainingTurns;
        public int potency;
    }

    [Serializable]
    public sealed class CombatantState
    {
        public string id;
        public string displayName;
        public StatBlock stats;
        public int health;
        public int focus;
        public bool enemy;
        public List<StatusEffectState> statuses = new List<StatusEffectState>();
        public bool IsAlive => health > 0;
        public bool IsDefending => statuses.Exists(x => x.type == StatusEffectType.Defending && x.remainingTurns > 0);
        public bool IsStunned => statuses.Exists(x => x.type == StatusEffectType.Stunned && x.remainingTurns > 0);
    }

    public readonly struct DamageResult
    {
        public readonly int Amount;
        public readonly bool Critical;
        public readonly bool Missed;
        public DamageResult(int amount, bool critical, bool missed) { Amount = amount; Critical = critical; Missed = missed; }
    }

    public static class CombatRules
    {
        public static DamageResult PhysicalAttack(CombatantState attacker, CombatantState defender, int d20)
        {
            d20 = Math.Max(1, Math.Min(20, d20));
            int hitTarget = 5 + Math.Max(0, defender.stats.agility / 3);
            if (d20 != 20 && d20 + Math.Max(0, attacker.stats.agility / 3) < hitTarget)
                return new DamageResult(0, false, true);
            bool critical = d20 == 20 || d20 >= Math.Max(18, 20 - attacker.stats.luck / 4);
            int raw = Math.Max(1, attacker.stats.strength * 2 + d20 / 4 - defender.stats.defence);
            if (critical) raw = (int)Math.Ceiling(raw * 1.5f);
            if (defender.IsDefending) raw = Math.Max(1, (int)Math.Ceiling(raw * 0.5f));
            defender.health = Math.Max(0, defender.health - raw);
            return new DamageResult(raw, critical, false);
        }

        public static int MagicalAttack(CombatantState attacker, CombatantState defender, int basePower)
        {
            int weakened = attacker.statuses.Exists(x => x.type == StatusEffectType.Weakened) ? 2 : 0;
            int damage = Math.Max(1, basePower + attacker.stats.magic + attacker.stats.intelligence / 2 - defender.stats.defence / 2 - weakened);
            if (defender.IsDefending) damage = Math.Max(1, (int)Math.Ceiling(damage * 0.5f));
            defender.health = Math.Max(0, defender.health - damage);
            return damage;
        }

        public static int Heal(CombatantState target, int amount)
        {
            int before = target.health;
            target.health = Math.Min(target.stats.maxHealth, target.health + Math.Max(0, amount));
            return target.health - before;
        }

        public static void AddStatus(CombatantState target, StatusEffectType type, int turns, int potency = 0)
        {
            StatusEffectState existing = target.statuses.Find(x => x.type == type);
            if (existing == null) target.statuses.Add(new StatusEffectState { type = type, remainingTurns = Math.Max(1, turns), potency = potency });
            else { existing.remainingTurns = Math.Max(existing.remainingTurns, turns); existing.potency = Math.Max(existing.potency, potency); }
        }

        public static int BeginTurn(CombatantState target)
        {
            int damage = 0;
            foreach (StatusEffectState status in target.statuses)
                if (status.type == StatusEffectType.Burning && status.remainingTurns > 0)
                {
                    int tick = Math.Max(1, status.potency); target.health = Math.Max(0, target.health - tick); damage += tick;
                }
            return damage;
        }

        public static void EndTurn(CombatantState target)
        {
            foreach (StatusEffectState status in target.statuses) status.remainingTurns--;
            target.statuses.RemoveAll(x => x.remainingTurns <= 0);
        }

        public static CombatantState First(CombatantState player, CombatantState enemy)
        {
            if (player.stats.agility == enemy.stats.agility) return player.stats.luck >= enemy.stats.luck ? player : enemy;
            return player.stats.agility > enemy.stats.agility ? player : enemy;
        }
    }

    public enum EnemyAction { Attack, HeavyAttack, Defend, Weaken }

    public static class EnemyAI
    {
        public static EnemyAction Choose(CombatantState self, CombatantState player, IDiceRandom random)
        {
            if (self.health <= self.stats.maxHealth / 3 && !self.IsDefending) return EnemyAction.Defend;
            int roll = random.RollD20();
            if (roll >= 17 && self.focus >= 4) return EnemyAction.Weaken;
            if (roll >= 12) return EnemyAction.HeavyAttack;
            return EnemyAction.Attack;
        }
    }
}
