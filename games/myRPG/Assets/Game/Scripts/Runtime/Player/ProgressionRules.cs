using System;

namespace MyRPG.Player
{
    public static class ProgressionRules
    {
        public static int ExperienceForLevel(int level)
        {
            level = Math.Max(1, level);
            return 100 * level * level;
        }

        public static int ResolveLevel(int currentLevel, int totalExperience)
        {
            int level = Math.Max(1, currentLevel);
            totalExperience = Math.Max(0, totalExperience);
            while (level < 50 && totalExperience >= ExperienceForLevel(level)) level++;
            return level;
        }
    }
}
