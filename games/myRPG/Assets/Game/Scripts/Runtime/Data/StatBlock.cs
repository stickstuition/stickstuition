using System;

namespace MyRPG.Data
{
    [Serializable]
    public struct StatBlock
    {
        public int maxHealth;
        public int maxFocus;
        public int strength;
        public int defence;
        public int magic;
        public int intelligence;
        public int agility;
        public int luck;

        public static StatBlock operator +(StatBlock left, StatBlock right)
        {
            return new StatBlock
            {
                maxHealth = left.maxHealth + right.maxHealth,
                maxFocus = left.maxFocus + right.maxFocus,
                strength = left.strength + right.strength,
                defence = left.defence + right.defence,
                magic = left.magic + right.magic,
                intelligence = left.intelligence + right.intelligence,
                agility = left.agility + right.agility,
                luck = left.luck + right.luck
            };
        }

        public void ClampMinimums()
        {
            maxHealth = Math.Max(1, maxHealth);
            maxFocus = Math.Max(0, maxFocus);
            strength = Math.Max(0, strength);
            defence = Math.Max(0, defence);
            magic = Math.Max(0, magic);
            intelligence = Math.Max(0, intelligence);
            agility = Math.Max(0, agility);
            luck = Math.Max(0, luck);
        }
    }
}
