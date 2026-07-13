using System;
using MyRPG.Data;

namespace MyRPG.Education
{
    [Serializable]
    public sealed class ArithmeticQuestion
    {
        public string id;
        public ArithmeticSubtopic subtopic;
        public QuestionFormat format;
        public string prompt;
        public int correctAnswer;
        public string explanation;
        public int[] choices;
        public int timeLimitSeconds = 20;
        public int difficultyBand = 3;

        public bool Accepts(string answer)
        {
            return int.TryParse(answer?.Trim(), out int value) && value == correctAnswer;
        }
    }

    public sealed class ArithmeticQuestionFactory
    {
        private readonly Random _random;
        private int _sequence;

        public ArithmeticQuestionFactory(int seed) { _random = new Random(seed); }

        public ArithmeticQuestion Generate(ArithmeticSubtopic subtopic, QuestionFormat format = QuestionFormat.Numerical, int difficultyBand = 3)
        {
            difficultyBand = Math.Max(1, Math.Min(5, difficultyBand));
            ArithmeticQuestion question = subtopic switch
            {
                ArithmeticSubtopic.Addition => Addition(difficultyBand),
                ArithmeticSubtopic.Subtraction => Subtraction(difficultyBand),
                ArithmeticSubtopic.Multiplication => Multiplication(difficultyBand),
                ArithmeticSubtopic.Division => Division(difficultyBand),
                ArithmeticSubtopic.NegativeNumbers => NegativeNumbers(difficultyBand),
                ArithmeticSubtopic.FactorsAndMultiples => Factors(difficultyBand),
                ArithmeticSubtopic.OrderOfOperations => OrderOfOperations(difficultyBand),
                _ => throw new ArgumentOutOfRangeException(nameof(subtopic))
            };
            question.id = $"arith-{subtopic.ToString().ToLowerInvariant()}-{_sequence++}-{Math.Abs(_random.Next())}";
            question.subtopic = subtopic;
            question.format = format;
            question.difficultyBand = difficultyBand;
            question.timeLimitSeconds = Math.Max(12, 26 - difficultyBand * 2);
            if (format == QuestionFormat.MultipleChoice) question.choices = BuildChoices(question.correctAnswer);
            return question;
        }

        private ArithmeticQuestion Addition(int band)
        {
            int maximum = new[] { 100, 250, 500, 1000, 5000 }[band - 1];
            int a = Next(10, maximum + 1), b = Next(10, maximum + 1);
            return Q($"{a} + {b} = ?", a + b, $"Add {a} and {b} to get {a + b}.");
        }

        private ArithmeticQuestion Subtraction(int band)
        {
            int maximum = new[] { 100, 250, 500, 1000, 5000 }[band - 1];
            int a = Next(30, maximum + 1), b = Next(5, a + 1);
            return Q($"{a} − {b} = ?", a - b, $"Subtract {b} from {a} to get {a - b}.");
        }

        private ArithmeticQuestion Multiplication(int band)
        {
            int maximum = Math.Min(12, 5 + band * 2);
            int a = Next(2, maximum + 1), b = Next(2, maximum + 1);
            return Q($"{a} × {b} = ?", a * b, $"{a} groups of {b} make {a * b}.");
        }

        private ArithmeticQuestion Division(int band)
        {
            int maximum = Math.Min(12, 5 + band * 2);
            int divisor = Next(2, maximum + 1), answer = Next(2, maximum + 1), dividend = divisor * answer;
            return Q($"{dividend} ÷ {divisor} = ?", answer, $"{divisor} fits into {dividend} exactly {answer} times.");
        }

        private ArithmeticQuestion NegativeNumbers(int band)
        {
            int range = 5 + band * 5;
            int start = Next(-range, range + 1), change = Next(-range, range + 1), result = start + change;
            string sign = change < 0 ? "−" : "+";
            return Q($"{start} {sign} {Math.Abs(change)} = ?", result, $"Move {Math.Abs(change)} places {(change < 0 ? "left" : "right")} from {start} to reach {result}.");
        }

        private ArithmeticQuestion Factors(int band)
        {
            int maximum = Math.Min(12, 5 + band * 2);
            int factor = Next(2, maximum + 1), multiplier = Next(2, maximum + 1), number = factor * multiplier;
            return Q($"What is the missing factor? {factor} × ? = {number}", multiplier, $"{number} ÷ {factor} = {multiplier}.");
        }

        private ArithmeticQuestion OrderOfOperations(int band)
        {
            int maximum = 5 + band * 2;
            int a = Next(2, maximum), b = Next(2, maximum), c = Next(2, maximum), answer = a + b * c;
            return Q($"{a} + {b} × {c} = ?", answer, $"Multiply first: {b} × {c} = {b * c}. Then add {a} to get {answer}.");
        }

        private int[] BuildChoices(int answer)
        {
            int[] values = { answer, answer + Delta(), answer + Delta(), answer + Delta() };
            for (int i = 1; i < values.Length; i++)
                while (Array.IndexOf(values, values[i], 0, i) >= 0) values[i] = answer + Delta();
            for (int i = values.Length - 1; i > 0; i--)
            {
                int swap = Next(0, i + 1);
                (values[i], values[swap]) = (values[swap], values[i]);
            }
            return values;
        }

        private int Delta() { int delta; do delta = Next(-10, 11); while (delta == 0); return delta; }
        private int Next(int minimum, int exclusiveMaximum) => _random.Next(minimum, exclusiveMaximum);
        private static ArithmeticQuestion Q(string prompt, int answer, string explanation) => new ArithmeticQuestion { prompt = prompt, correctAnswer = answer, explanation = explanation };
    }
}
