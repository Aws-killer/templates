/**
 * Finds the best possible start and end timestamps for a quote within an
 * imperfect transcript using fuzzy matching and sliding window optimization.
 *
 * @param {object} transcript - The full transcript object from your JSON file.
 * @param {string} quoteText - The text of the quote to find.
 * @param {object} [options={}] - Configuration options.
 * @param {number} [options.matchThreshold=0.7] - Minimum percentage of words that must match (0.0 to 1.0).
 * @param {number} [options.windowFlexibility=1.5] - How much larger the search window can be relative to quote length.
 * @param {boolean} [options.useFuzzyMatching=true] - Enable fuzzy matching for similar words.
 * @param {number} [options.fuzzyThreshold=0.85] - Similarity threshold for fuzzy matching (0.0 to 1.0).
 * @returns {{
 *   highlightStartTime: number,
 *   highlightEndTime: number,
 *   narrationStartTime: number,
 *   narrationEndTime: number,
 *   duration: number,
 *   score: number,
 *   found: boolean,
 *   matchedWords: Array<{word: string, start: number, end: number}>,
 *   confidence: string
 * }} An object with detailed timing info and match quality.
 */
export const findQuoteTimings = (transcript, quoteText, options = {}) => {
  const {
    matchThreshold = 0.7,
    windowFlexibility = 1.5,
    useFuzzyMatching = true,
    fuzzyThreshold = 0.85
  } = options;

  // 1. PREPARATION
  const normalizedQuote = normalizeText(quoteText);
  const quoteWords = normalizedQuote.split(/\s+/).filter(Boolean);

  const defaultReturn = {
    highlightStartTime: 0,
    highlightEndTime: 0,
    narrationStartTime: 0,
    narrationEndTime: 0,
    duration: 0,
    score: 0,
    found: false,
    matchedWords: [],
    confidence: 'none'
  };

  if (!transcript?.segments?.length || quoteWords.length === 0) {
    console.warn('Invalid input: missing transcript segments or empty quote');
    return defaultReturn;
  }

  // Flatten and clean words once
  const allWords = transcript.segments
    .flatMap(segment => segment.words || [])
    .filter(word => word && typeof word.word === 'string')
    .map((word, index) => ({
      ...word,
      normalized: normalizeText(word.word.replace(/\s+/g, '')),
      index
    }));

  if (allWords.length === 0) {
    console.warn('No valid words found in transcript');
    return defaultReturn;
  }

  // 2. OPTIMIZED SEARCH WITH SLIDING WINDOW
  const maxWindowSize = Math.floor(quoteWords.length * windowFlexibility);
  let bestMatch = { ...defaultReturn, startIndex: -1, endIndex: -1 };

  // Early termination: stop if we find a perfect match
  for (let i = 0; i <= allWords.length - quoteWords.length; i++) {
    // Try different window sizes to account for missing/extra words
    for (let windowSize = quoteWords.length; windowSize <= Math.min(maxWindowSize, allWords.length - i); windowSize++) {
      const windowWords = allWords.slice(i, i + windowSize);
      const matchResult = calculateMatchScore(quoteWords, windowWords, useFuzzyMatching, fuzzyThreshold);
      
      if (matchResult.score > bestMatch.score) {
        bestMatch = {
          ...matchResult,
          startIndex: i,
          endIndex: i + matchResult.lastMatchOffset,
          actualStartIndex: i + matchResult.firstMatchOffset,
          matchedWords: matchResult.matchedWords.map(idx => allWords[i + idx])
        };
        
        // Early exit on perfect or near-perfect match
        if (matchResult.score >= 0.95) {
          break;
        }
      }
    }
    
    // Early exit optimization
    if (bestMatch.score >= 0.95) break;
  }

  // 3. FINALIZE TIMINGS IF A GOOD MATCH WAS FOUND
  if (bestMatch.score >= matchThreshold && bestMatch.startIndex !== -1) {
    const { actualStartIndex, endIndex, matchedWords } = bestMatch;
    
    // Get precise timings from matched words
    const highlightStartTime = allWords[actualStartIndex].start;
    const highlightEndTime = allWords[endIndex].end;

    // Check for narrator cues with more flexible matching
    const narrationTiming = findNarrationBoundaries(
      allWords,
      actualStartIndex,
      endIndex
    );

    const result = {
      highlightStartTime,
      highlightEndTime,
      narrationStartTime: narrationTiming.start,
      narrationEndTime: narrationTiming.end,
      duration: narrationTiming.end - narrationTiming.start,
      score: bestMatch.score,
      found: true,
      matchedWords: matchedWords.map(w => ({
        word: w.word,
        start: w.start,
        end: w.end
      })),
      confidence: getConfidenceLevel(bestMatch.score)
    };

    if (options.debug) {
      console.log('Match found:', {
        quote: quoteText.substring(0, 50) + '...',
        score: bestMatch.score.toFixed(3),
        confidence: result.confidence,
        timing: `${result.narrationStartTime.toFixed(2)}s - ${result.narrationEndTime.toFixed(2)}s`
      });
    }
    console.log(result)

    return result;
  }

  // No sufficient match found
  console.warn(
    `Quote not found with threshold ${matchThreshold}: "${quoteText.substring(0, 50)}..." ` +
    `(Best score: ${bestMatch.score.toFixed(3)})`
  );
  return defaultReturn;
};

/**
 * Calculate match score between quote words and transcript window
 */
function calculateMatchScore(quoteWords, windowWords, useFuzzy, fuzzyThreshold) {
  let matches = 0;
  let firstMatchOffset = -1;
  let lastMatchOffset = -1;
  const matchedWords = [];
  
  let windowIndex = 0;
  
  for (let quoteIndex = 0; quoteIndex < quoteWords.length; quoteIndex++) {
    const quoteWord = quoteWords[quoteIndex];
    let found = false;
    
    // Look for this quote word in the remaining window
    while (windowIndex < windowWords.length) {
      const windowWord = windowWords[windowIndex].normalized;
      
      if (windowWord === quoteWord || 
          (useFuzzy && calculateSimilarity(quoteWord, windowWord) >= fuzzyThreshold)) {
        matches++;
        matchedWords.push(windowIndex);
        if (firstMatchOffset === -1) firstMatchOffset = windowIndex;
        lastMatchOffset = windowIndex;
        windowIndex++;
        found = true;
        break;
      }
      
      windowIndex++;
      
      // Don't skip too far ahead
      if (windowIndex - (lastMatchOffset + 1) > 3) break;
    }
    
    if (!found) {
      // Reset window position for next quote word
      windowIndex = Math.max(0, lastMatchOffset + 1);
    }
  }
  
  return {
    score: matches / quoteWords.length,
    firstMatchOffset,
    lastMatchOffset,
    matchedWords
  };
}

/**
 * Find narration boundaries including quote markers
 */
function findNarrationBoundaries(allWords, startIndex, endIndex) {
  let narrationStart = allWords[startIndex].start;
  let narrationEnd = allWords[endIndex].end;
  
  // Check for "quote" variations before start
  for (let i = Math.max(0, startIndex - 2); i < startIndex; i++) {
    const word = allWords[i].normalized;
    if (word === 'quote' || word === 'saying' || word === 'said') {
      narrationStart = allWords[i].start;
      break;
    }
  }
  
  // Check for "end quote" or punctuation after end
  for (let i = endIndex + 1; i < Math.min(allWords.length, endIndex + 3); i++) {
    const word = allWords[i].normalized;
    if (word === 'quote' || word === 'unquote') {
      narrationEnd = allWords[i].end;
      // Check if preceded by "end"
      if (i > 0 && allWords[i - 1].normalized === 'end') {
        narrationEnd = allWords[i].end;
      }
      break;
    }
  }
  
  return { start: narrationStart, end: narrationEnd };
}

/**
 * Calculate similarity between two words (Levenshtein distance based)
 */
function calculateSimilarity(word1, word2) {
  if (word1 === word2) return 1;
  if (Math.abs(word1.length - word2.length) > 3) return 0;
  
  const longer = word1.length > word2.length ? word1 : word2;
  const shorter = word1.length > word2.length ? word2 : word1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Get confidence level based on match score
 */
function getConfidenceLevel(score) {
  if (score >= 0.95) return 'high';
  if (score >= 0.85) return 'medium';
  if (score >= 0.70) return 'low';
  return 'very low';
}

/**
 * Normalize text for comparison
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}