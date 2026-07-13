using System;
using System.Collections.Generic;

namespace MyRPG.Saving
{
    [Serializable]
    public sealed class EducationalPerformance
    {
        public int totalAnswered;
        public int correctAnswers;
        public int incorrectAnswers;
        public int currentStreak;
        public int bestStreak;
        public int retriesUsed;
        public float totalResponseSeconds;
        public List<SubtopicPerformance> subtopics = new List<SubtopicPerformance>();
        public List<string> recentQuestionIds = new List<string>();

        public float Accuracy => totalAnswered == 0 ? 0f : (float)correctAnswers / totalAnswered;
        public float AverageResponseSeconds => totalAnswered == 0 ? 0f : totalResponseSeconds / totalAnswered;

        public void Record(string subtopicId, string questionId, bool correct, float responseSeconds, bool retried)
        {
            totalAnswered++;
            totalResponseSeconds += Math.Max(0f, responseSeconds);
            if (correct)
            {
                correctAnswers++;
                currentStreak++;
                bestStreak = Math.Max(bestStreak, currentStreak);
            }
            else
            {
                incorrectAnswers++;
                currentStreak = 0;
            }

            if (retried) retriesUsed++;
            SubtopicPerformance topic = subtopics.Find(x => x.subtopicId == subtopicId);
            if (topic == null)
            {
                topic = new SubtopicPerformance { subtopicId = subtopicId };
                subtopics.Add(topic);
            }
            topic.answered++;
            if (correct) topic.correct++;

            if (!string.IsNullOrWhiteSpace(questionId))
            {
                recentQuestionIds.Remove(questionId);
                recentQuestionIds.Add(questionId);
                while (recentQuestionIds.Count > 30) recentQuestionIds.RemoveAt(0);
            }
        }

        public void Normalize()
        {
            totalAnswered = Math.Max(0, totalAnswered);
            correctAnswers = Math.Max(0, Math.Min(correctAnswers, totalAnswered));
            incorrectAnswers = Math.Max(0, totalAnswered - correctAnswers);
            currentStreak = Math.Max(0, currentStreak);
            bestStreak = Math.Max(currentStreak, bestStreak);
            retriesUsed = Math.Max(0, retriesUsed);
            totalResponseSeconds = Math.Max(0f, totalResponseSeconds);
            subtopics ??= new List<SubtopicPerformance>();
            recentQuestionIds ??= new List<string>();
        }

        public string ChapterGrade()
        {
            float score = Accuracy;
            if (score >= 0.9f) return "A";
            if (score >= 0.8f) return "B";
            if (score >= 0.7f) return "C";
            if (score >= 0.6f) return "D";
            if (score >= 0.5f) return "E";
            return "F";
        }
    }

    [Serializable]
    public sealed class SubtopicPerformance
    {
        public string subtopicId;
        public int answered;
        public int correct;
        public float Accuracy => answered == 0 ? 0f : (float)correct / answered;
    }
}
