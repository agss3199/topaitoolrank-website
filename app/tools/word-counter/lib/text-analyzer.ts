/**
 * Text Analyzer for Word Counter Tool
 *
 * Provides real-time statistics: words, chars, sentences, paragraphs, reading time
 */

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
  readingTimeSeconds: number;
  topWords: { word: string; count: number }[];
}

const WORDS_PER_MINUTE = 200; // Average reading speed

export function analyzeText(text: string): TextStats {
  if (!text) {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMinutes: 0,
      readingTimeSeconds: 0,
      topWords: [],
    };
  }

  const trimmed = text.trim();

  // Characters
  const characters = trimmed.length;
  const charactersNoSpaces = trimmed.replace(/\s/g, "").length;

  // Words
  const words = trimmed
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Sentences (. ! ? as delimiters)
  const sentences = (trimmed.match(/[.!?]+/g) || []).length || (words > 0 ? 1 : 0);

  // Paragraphs (double newline)
  const paragraphs = trimmed.split(/\n\n+/).filter((p) => p.trim()).length;

  // Reading time
  const totalSeconds = Math.round((words / WORDS_PER_MINUTE) * 60);
  const readingTimeMinutes = Math.floor(totalSeconds / 60);
  const readingTimeSeconds = totalSeconds % 60;

  // Top words
  const wordFreq = new Map<string, number>();
  trimmed
    .toLowerCase()
    .match(/\b\w+\b/g)
    ?.forEach((word) => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

  const topWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    readingTimeMinutes,
    readingTimeSeconds,
    topWords,
  };
}
