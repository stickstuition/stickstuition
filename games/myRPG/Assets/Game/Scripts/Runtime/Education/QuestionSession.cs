using System;
using System.Collections.Generic;
using MyRPG.Data;

namespace MyRPG.Education
{
    public readonly struct QuestionOutcome
    {
        public readonly ArithmeticQuestion Question;
        public readonly bool Correct;
        public readonly string SubmittedAnswer;
        public readonly float ResponseSeconds;
        public QuestionOutcome(ArithmeticQuestion question, bool correct, string answer, float seconds)
        {
            Question = question; Correct = correct; SubmittedAnswer = answer; ResponseSeconds = Math.Max(0f, seconds);
        }
    }

    public sealed class QuestionSession
    {
        private const int HistoryLimit = 20;
        private readonly ArithmeticQuestionFactory _factory;
        private readonly Queue<string> _recentPrompts = new Queue<string>();
        private readonly HashSet<string> _recentPromptSet = new HashSet<string>();
        private int _correctRun;
        private int _incorrectRun;

        public int DifficultyBand { get; private set; } = 3;
        public ArithmeticQuestion Current { get; private set; }

        public QuestionSession(int seed) { _factory = new ArithmeticQuestionFactory(seed); }

        public ArithmeticQuestion Next(ArithmeticSubtopic subtopic, QuestionFormat format)
        {
            ArithmeticQuestion candidate = null;
            for (int attempt = 0; attempt < 24; attempt++)
            {
                candidate = _factory.Generate(subtopic, format, DifficultyBand);
                if (!_recentPromptSet.Contains(candidate.prompt)) break;
            }
            Remember(candidate.prompt);
            Current = candidate;
            return candidate;
        }

        public QuestionOutcome Submit(string answer, float responseSeconds)
        {
            if (Current == null) throw new InvalidOperationException("No question is active.");
            bool correct = Current.Accepts(answer);
            if (correct) { _correctRun++; _incorrectRun = 0; }
            else { _incorrectRun++; _correctRun = 0; }
            if (_correctRun >= 3 && DifficultyBand < 5) { DifficultyBand++; _correctRun = 0; }
            if (_incorrectRun >= 2 && DifficultyBand > 1) { DifficultyBand--; _incorrectRun = 0; }
            return new QuestionOutcome(Current, correct, answer, responseSeconds);
        }

        private void Remember(string prompt)
        {
            if (_recentPromptSet.Add(prompt)) _recentPrompts.Enqueue(prompt);
            while (_recentPrompts.Count > HistoryLimit) _recentPromptSet.Remove(_recentPrompts.Dequeue());
        }
    }
}
