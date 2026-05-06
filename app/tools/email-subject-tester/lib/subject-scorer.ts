/**
 * Email Subject Line Scoring Engine
 * Analyzes subject lines for effectiveness across multiple dimensions
 */

export interface SubjectLineScore {
  overallScore: number; // 0-100
  length: { score: number; message: string };
  urgency: { score: number; message: string };
  personalization: { score: number; message: string };
  curiosity: { score: number; message: string };
  powerWords: { score: number; message: string };
  specialCharacters: { score: number; message: string };
  sentiment: string; // "positive", "negative", "neutral"
  estimatedOpenRate: string; // "low", "medium", "high"
  suggestions: string[];
}

const POWER_WORDS = [
  "urgent",
  "limited",
  "exclusive",
  "amazing",
  "shocking",
  "proven",
  "secret",
  "guaranteed",
  "free",
  "new",
  "important",
  "breakthrough",
  "essential",
  "critical",
  "revealed",
  "discover",
  "save",
  "boost",
  "increase",
  "maximize",
  "ultimate",
  "exclusive",
  "powerful",
];

const URGENCY_WORDS = [
  "urgent",
  "limited",
  "now",
  "today",
  "immediately",
  "asap",
  "quickly",
  "hurry",
  "expires",
  "deadline",
  "last chance",
  "ending soon",
  "don't miss",
  "act now",
];

const CURIOSITY_WORDS = ["discover", "secret", "revealed", "uncover", "inside", "untold", "shocking", "surprising"];

const PERSONALIZATION_KEYWORDS = ["your", "you", "my", "name", "first"];

export function scoreSubjectLine(subjectLine: string): SubjectLineScore {
  const trimmed = subjectLine.trim();

  if (!trimmed) {
    return {
      overallScore: 0,
      length: { score: 0, message: "Subject line is empty" },
      urgency: { score: 0, message: "No urgency detected" },
      personalization: { score: 0, message: "Not personalized" },
      curiosity: { score: 0, message: "No curiosity gap" },
      powerWords: { score: 0, message: "No power words found" },
      specialCharacters: { score: 0, message: "No special characters" },
      sentiment: "neutral",
      estimatedOpenRate: "low",
      suggestions: ["Add some content to your subject line"],
    };
  }

  const scores = {
    length: scoreLengthOptimization(trimmed),
    urgency: scoreUrgency(trimmed),
    personalization: scorePersonalization(trimmed),
    curiosity: scoreCuriosity(trimmed),
    powerWords: scorePowerWords(trimmed),
    specialCharacters: scoreSpecialCharacters(trimmed),
  };

  const overallScore = Math.round(
    (scores.length.score +
      scores.urgency.score +
      scores.personalization.score +
      scores.curiosity.score +
      scores.powerWords.score +
      scores.specialCharacters.score) /
      6
  );

  const sentiment = detectSentiment(trimmed);
  const estimatedOpenRate = estimateOpenRate(overallScore, sentiment);
  const suggestions = generateSuggestions(trimmed, scores);

  return {
    overallScore,
    length: scores.length,
    urgency: scores.urgency,
    personalization: scores.personalization,
    curiosity: scores.curiosity,
    powerWords: scores.powerWords,
    specialCharacters: scores.specialCharacters,
    sentiment,
    estimatedOpenRate,
    suggestions,
  };
}

function scoreLengthOptimization(subject: string): { score: number; message: string } {
  const length = subject.length;

  // Optimal: 35-50 characters (sweet spot for subject lines)
  if (length >= 35 && length <= 50) {
    return {
      score: 100,
      message: `Perfect length (${length} chars) - likely to fit on most devices`,
    };
  }

  // Good: 25-60 characters
  if (length >= 25 && length <= 60) {
    return {
      score: 80,
      message: `Good length (${length} chars) - should display well on mobile`,
    };
  }

  // Too short: < 25 characters
  if (length < 25) {
    return {
      score: 60,
      message: `Short (${length} chars) - consider adding more context or benefit`,
    };
  }

  // Too long: > 60 characters
  if (length > 60 && length < 100) {
    return {
      score: 70,
      message: `Long (${length} chars) - may be truncated on mobile devices`,
    };
  }

  // Way too long: > 100 characters
  return {
    score: 40,
    message: `Very long (${length} chars) - likely to be truncated; consider shortening`,
  };
}

function scoreUrgency(subject: string): { score: number; message: string } {
  const lowerSubject = subject.toLowerCase();
  const urgencyMatches = URGENCY_WORDS.filter((word) => lowerSubject.includes(word)).length;

  if (urgencyMatches >= 2) {
    return { score: 95, message: "Strong urgency - creates immediate action impulse" };
  }

  if (urgencyMatches === 1) {
    return { score: 75, message: "Some urgency detected - good for conversions" };
  }

  return { score: 40, message: "No urgency - consider adding time-sensitive language" };
}

function scorePersonalization(subject: string): { score: number; message: string } {
  const lowerSubject = subject.toLowerCase();
  const hasPersonalization = PERSONALIZATION_KEYWORDS.some((word) => lowerSubject.includes(word));

  if (hasPersonalization) {
    return { score: 85, message: "Personalized - increases relevance and engagement" };
  }

  return { score: 50, message: "Not personalized - adding 'you' or recipient name increases open rates" };
}

function scoreCuriosity(subject: string): { score: number; message: string } {
  const lowerSubject = subject.toLowerCase();
  const hasQuestion = subject.includes("?");
  const hasCuriosityWords = CURIOSITY_WORDS.some((word) => lowerSubject.includes(word));
  const hasNumbers = /\d+/.test(subject);
  const hasEllipsis = subject.includes("...");

  let score = 40;
  const triggers = [];

  if (hasQuestion) {
    score += 20;
    triggers.push("question mark");
  }

  if (hasCuriosityWords) {
    score += 20;
    triggers.push("curiosity word");
  }

  if (hasNumbers) {
    score += 15;
    triggers.push("numbers");
  }

  if (hasEllipsis) {
    score += 10;
    triggers.push("ellipsis");
  }

  score = Math.min(score, 95);

  if (triggers.length === 0) {
    return { score: 40, message: "Low curiosity - consider adding questions or intriguing elements" };
  }

  return {
    score,
    message: `Good curiosity triggers (${triggers.join(", ")}) - encourages opens`,
  };
}

function scorePowerWords(subject: string): { score: number; message: string } {
  const lowerSubject = subject.toLowerCase();
  const foundPowerWords = POWER_WORDS.filter((word) => lowerSubject.includes(word));

  if (foundPowerWords.length >= 3) {
    return { score: 95, message: `Strong power words: ${foundPowerWords.slice(0, 3).join(", ")}` };
  }

  if (foundPowerWords.length === 2) {
    return { score: 80, message: `Good power words: ${foundPowerWords.join(", ")}` };
  }

  if (foundPowerWords.length === 1) {
    return { score: 65, message: `One power word: ${foundPowerWords[0]} - could use more` };
  }

  return { score: 30, message: "No power words - add action-oriented language" };
}

function scoreSpecialCharacters(subject: string): { score: number; message: string } {
  const hasEmoji = /[\p{Extended_Pictographic}]/u.test(subject);
  const hasBrackets = subject.includes("[") || subject.includes("(");
  const hasArrows = subject.includes("→") || subject.includes("→") || subject.includes("↓");

  let score = 40;
  const triggers = [];

  if (hasEmoji) {
    score += 25;
    triggers.push("emoji");
  }

  if (hasBrackets) {
    score += 15;
    triggers.push("brackets");
  }

  if (hasArrows) {
    score += 15;
    triggers.push("visual elements");
  }

  if (triggers.length === 0) {
    return {
      score: 50,
      message: "Plain formatting - consider adding emoji or visual markers for standout",
    };
  }

  return {
    score: Math.min(score, 95),
    message: `Formatted well (${triggers.join(", ")}) - stands out in inbox`,
  };
}

function detectSentiment(subject: string): string {
  const lowerSubject = subject.toLowerCase();

  const positiveWords = ["great", "amazing", "awesome", "fantastic", "wonderful", "love", "best", "excellent"];
  const negativeWords = ["fail", "problem", "issue", "error", "bad", "worst", "poor", "ugly"];

  const positiveMatches = positiveWords.filter((w) => lowerSubject.includes(w)).length;
  const negativeMatches = negativeWords.filter((w) => lowerSubject.includes(w)).length;

  if (positiveMatches > negativeMatches) return "positive";
  if (negativeMatches > positiveMatches) return "negative";
  return "neutral";
}

function estimateOpenRate(overallScore: number, sentiment: string): string {
  if (sentiment === "negative") {
    return "low"; // Negative sentiment typically reduces open rates
  }

  if (overallScore >= 80) return "high";
  if (overallScore >= 60) return "medium";
  return "low";
}

function generateSuggestions(subject: string, scores: Record<string, any>): string[] {
  const suggestions: string[] = [];

  if (scores.length.score < 70) {
    suggestions.push(
      "Adjust length to 35-50 characters for optimal mobile display"
    );
  }

  if (scores.urgency.score < 60) {
    suggestions.push("Add urgency words like 'limited', 'today', or 'urgent' to increase engagement");
  }

  if (scores.personalization.score < 70) {
    suggestions.push("Personalize with 'you' or the recipient's name to increase relevance");
  }

  if (scores.curiosity.score < 60) {
    suggestions.push("Add a question mark or intriguing element to create curiosity gap");
  }

  if (scores.powerWords.score < 60) {
    suggestions.push("Include action words like 'discover', 'boost', or 'unlock'");
  }

  if (scores.specialCharacters.score < 60) {
    suggestions.push("Consider adding emoji or visual markers to stand out in the inbox");
  }

  if (suggestions.length === 0) {
    suggestions.push("✓ This is a strong subject line! Well done.");
  }

  return suggestions;
}

export function getSubjectLineStatistics(subjectLine: string): {
  wordCount: number;
  characterCount: number;
  numbersCount: number;
  hasEmoji: boolean;
} {
  const trimmed = subjectLine.trim();

  return {
    wordCount: trimmed.split(/\s+/).filter((w) => w.length > 0).length,
    characterCount: trimmed.length,
    numbersCount: (trimmed.match(/\d/g) || []).length,
    hasEmoji: /[\p{Extended_Pictographic}]/u.test(trimmed),
  };
}
