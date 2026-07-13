using System.Linq;
using System.Collections.Generic;
using MyRPG.Data;
using MyRPG.Education;
using NUnit.Framework;

namespace MyRPG.Tests
{
    public sealed class ArithmeticQuestionTests
    {
        [Test]
        public void EverySubtopicProducesValidQuestions()
        {
            ArithmeticQuestionFactory factory = new ArithmeticQuestionFactory(12345);
            foreach (ArithmeticSubtopic subtopic in System.Enum.GetValues(typeof(ArithmeticSubtopic)))
            {
                for (int i = 0; i < 200; i++)
                {
                    ArithmeticQuestion question = factory.Generate(subtopic);
                    Assert.That(question.id, Is.Not.Empty);
                    Assert.That(question.prompt, Is.Not.Empty);
                    Assert.That(question.explanation, Is.Not.Empty);
                    Assert.That(question.Accepts(question.correctAnswer.ToString()), Is.True);
                }
            }
        }

        [Test]
        public void DivisionIsAlwaysExactAndNeverUsesZeroDivisor()
        {
            ArithmeticQuestionFactory factory = new ArithmeticQuestionFactory(7);
            for (int i = 0; i < 500; i++)
            {
                ArithmeticQuestion question = factory.Generate(ArithmeticSubtopic.Division);
                Assert.That(question.prompt, Does.Not.Contain("÷ 0"));
                Assert.That(question.correctAnswer, Is.GreaterThan(0));
            }
        }

        [Test]
        public void MultipleChoiceContainsOneCorrectUniqueAnswer()
        {
            ArithmeticQuestion question = new ArithmeticQuestionFactory(2).Generate(ArithmeticSubtopic.Multiplication, QuestionFormat.MultipleChoice);
            Assert.That(question.choices.Distinct().Count(), Is.EqualTo(4));
            Assert.That(question.choices.Count(x => x == question.correctAnswer), Is.EqualTo(1));
        }

        [Test]
        public void SessionAvoidsRecentPromptDuplicates()
        {
            QuestionSession session = new QuestionSession(83);
            HashSet<string> prompts = new HashSet<string>();
            for (int i = 0; i < 20; i++)
                Assert.That(prompts.Add(session.Next(ArithmeticSubtopic.Addition, QuestionFormat.Numerical).prompt), Is.True);
        }

        [Test]
        public void RecentPerformanceAdjustsWithinSafeBands()
        {
            QuestionSession session = new QuestionSession(11);
            for (int i = 0; i < 3; i++)
            {
                ArithmeticQuestion question = session.Next(ArithmeticSubtopic.Multiplication, QuestionFormat.Numerical);
                session.Submit(question.correctAnswer.ToString(), 3f);
            }
            Assert.That(session.DifficultyBand, Is.EqualTo(4));
            for (int i = 0; i < 2; i++)
            {
                ArithmeticQuestion question = session.Next(ArithmeticSubtopic.Multiplication, QuestionFormat.Numerical);
                session.Submit((question.correctAnswer + 999).ToString(), 5f);
            }
            Assert.That(session.DifficultyBand, Is.EqualTo(3));
        }

        [Test]
        public void AnswerValidationTrimsInputAndRejectsOtherNumbers()
        {
            ArithmeticQuestion question = new ArithmeticQuestionFactory(4).Generate(ArithmeticSubtopic.Division);
            Assert.That(question.Accepts($"  {question.correctAnswer}  "), Is.True);
            Assert.That(question.Accepts((question.correctAnswer + 1).ToString()), Is.False);
            Assert.That(question.Accepts("not a number"), Is.False);
        }
    }
}
