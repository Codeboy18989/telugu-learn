// Reading Track - Level 1: Letter Recognition
// Telugu alphabet with transliterations

export const TELUGU_VOWELS = [
  {
    id: 'vowel-1',
    letter: 'అ',
    transliteration: 'a',
    soundFile: null, // Will be added when audio is available
    category: 'vowel',
    difficulty: 1
  },
  {
    id: 'vowel-2',
    letter: 'ఆ',
    transliteration: 'aa',
    soundFile: null,
    category: 'vowel',
    difficulty: 1
  },
  {
    id: 'vowel-3',
    letter: 'ఇ',
    transliteration: 'i',
    soundFile: null,
    category: 'vowel',
    difficulty: 1
  },
  {
    id: 'vowel-4',
    letter: 'ఈ',
    transliteration: 'ee',
    soundFile: null,
    category: 'vowel',
    difficulty: 1
  },
  {
    id: 'vowel-5',
    letter: 'ఉ',
    transliteration: 'u',
    soundFile: null,
    category: 'vowel',
    difficulty: 2
  },
  {
    id: 'vowel-6',
    letter: 'ఊ',
    transliteration: 'oo',
    soundFile: null,
    category: 'vowel',
    difficulty: 2
  },
  {
    id: 'vowel-7',
    letter: 'ఋ',
    transliteration: 'ru',
    soundFile: null,
    category: 'vowel',
    difficulty: 3
  },
  {
    id: 'vowel-8',
    letter: 'ౠ',
    transliteration: 'ruu',
    soundFile: null,
    category: 'vowel',
    difficulty: 3
  },
  {
    id: 'vowel-9',
    letter: 'ఎ',
    transliteration: 'e',
    soundFile: null,
    category: 'vowel',
    difficulty: 2
  },
  {
    id: 'vowel-10',
    letter: 'ఏ',
    transliteration: 'ae',
    soundFile: null,
    category: 'vowel',
    difficulty: 2
  },
  {
    id: 'vowel-11',
    letter: 'ఐ',
    transliteration: 'ai',
    soundFile: null,
    category: 'vowel',
    difficulty: 2
  },
  {
    id: 'vowel-12',
    letter: 'ఒ',
    transliteration: 'o',
    soundFile: null,
    category: 'vowel',
    difficulty: 2
  },
  {
    id: 'vowel-13',
    letter: 'ఓ',
    transliteration: 'oh',
    soundFile: null,
    category: 'vowel',
    difficulty: 2
  },
  {
    id: 'vowel-14',
    letter: 'ఔ',
    transliteration: 'au',
    soundFile: null,
    category: 'vowel',
    difficulty: 3
  },
  {
    id: 'vowel-15',
    letter: 'అం',
    transliteration: 'am',
    soundFile: null,
    category: 'vowel',
    difficulty: 3
  },
  {
    id: 'vowel-16',
    letter: 'అః',
    transliteration: 'ah',
    soundFile: null,
    category: 'vowel',
    difficulty: 3
  }
];

export const TELUGU_CONSONANTS = [
  // Ka varga (క వర్గం)
  {
    id: 'consonant-1',
    letter: 'క',
    transliteration: 'ka',
    soundFile: null,
    category: 'consonant',
    group: 'ka-varga',
    difficulty: 1
  },
  {
    id: 'consonant-2',
    letter: 'ఖ',
    transliteration: 'kha',
    soundFile: null,
    category: 'consonant',
    group: 'ka-varga',
    difficulty: 2
  },
  {
    id: 'consonant-3',
    letter: 'గ',
    transliteration: 'ga',
    soundFile: null,
    category: 'consonant',
    group: 'ka-varga',
    difficulty: 1
  },
  {
    id: 'consonant-4',
    letter: 'ఘ',
    transliteration: 'gha',
    soundFile: null,
    category: 'consonant',
    group: 'ka-varga',
    difficulty: 2
  },
  {
    id: 'consonant-5',
    letter: 'ఙ',
    transliteration: 'nga',
    soundFile: null,
    category: 'consonant',
    group: 'ka-varga',
    difficulty: 3
  },

  // Cha varga (చ వర్గం)
  {
    id: 'consonant-6',
    letter: 'చ',
    transliteration: 'cha',
    soundFile: null,
    category: 'consonant',
    group: 'cha-varga',
    difficulty: 1
  },
  {
    id: 'consonant-7',
    letter: 'ఛ',
    transliteration: 'chha',
    soundFile: null,
    category: 'consonant',
    group: 'cha-varga',
    difficulty: 2
  },
  {
    id: 'consonant-8',
    letter: 'జ',
    transliteration: 'ja',
    soundFile: null,
    category: 'consonant',
    group: 'cha-varga',
    difficulty: 1
  },
  {
    id: 'consonant-9',
    letter: 'ఝ',
    transliteration: 'jha',
    soundFile: null,
    category: 'consonant',
    group: 'cha-varga',
    difficulty: 2
  },
  {
    id: 'consonant-10',
    letter: 'ఞ',
    transliteration: 'nya',
    soundFile: null,
    category: 'consonant',
    group: 'cha-varga',
    difficulty: 3
  },

  // Ta varga (ట వర్గం) - Retroflex
  {
    id: 'consonant-11',
    letter: 'ట',
    transliteration: 'ta',
    soundFile: null,
    category: 'consonant',
    group: 'ta-varga',
    difficulty: 1
  },
  {
    id: 'consonant-12',
    letter: 'ఠ',
    transliteration: 'tha',
    soundFile: null,
    category: 'consonant',
    group: 'ta-varga',
    difficulty: 2
  },
  {
    id: 'consonant-13',
    letter: 'డ',
    transliteration: 'da',
    soundFile: null,
    category: 'consonant',
    group: 'ta-varga',
    difficulty: 1
  },
  {
    id: 'consonant-14',
    letter: 'ఢ',
    transliteration: 'dha',
    soundFile: null,
    category: 'consonant',
    group: 'ta-varga',
    difficulty: 2
  },
  {
    id: 'consonant-15',
    letter: 'ణ',
    transliteration: 'na',
    soundFile: null,
    category: 'consonant',
    group: 'ta-varga',
    difficulty: 2
  },

  // Tha varga (త వర్గం) - Dental
  {
    id: 'consonant-16',
    letter: 'త',
    transliteration: 'tha',
    soundFile: null,
    category: 'consonant',
    group: 'tha-varga',
    difficulty: 1
  },
  {
    id: 'consonant-17',
    letter: 'థ',
    transliteration: 'thha',
    soundFile: null,
    category: 'consonant',
    group: 'tha-varga',
    difficulty: 2
  },
  {
    id: 'consonant-18',
    letter: 'ద',
    transliteration: 'dha',
    soundFile: null,
    category: 'consonant',
    group: 'tha-varga',
    difficulty: 1
  },
  {
    id: 'consonant-19',
    letter: 'ధ',
    transliteration: 'dhha',
    soundFile: null,
    category: 'consonant',
    group: 'tha-varga',
    difficulty: 2
  },
  {
    id: 'consonant-20',
    letter: 'న',
    transliteration: 'na',
    soundFile: null,
    category: 'consonant',
    group: 'tha-varga',
    difficulty: 1
  },

  // Pa varga (ప వర్గం)
  {
    id: 'consonant-21',
    letter: 'ప',
    transliteration: 'pa',
    soundFile: null,
    category: 'consonant',
    group: 'pa-varga',
    difficulty: 1
  },
  {
    id: 'consonant-22',
    letter: 'ఫ',
    transliteration: 'pha',
    soundFile: null,
    category: 'consonant',
    group: 'pa-varga',
    difficulty: 2
  },
  {
    id: 'consonant-23',
    letter: 'బ',
    transliteration: 'ba',
    soundFile: null,
    category: 'consonant',
    group: 'pa-varga',
    difficulty: 1
  },
  {
    id: 'consonant-24',
    letter: 'భ',
    transliteration: 'bha',
    soundFile: null,
    category: 'consonant',
    group: 'pa-varga',
    difficulty: 2
  },
  {
    id: 'consonant-25',
    letter: 'మ',
    transliteration: 'ma',
    soundFile: null,
    category: 'consonant',
    group: 'pa-varga',
    difficulty: 1
  },

  // Additional consonants
  {
    id: 'consonant-26',
    letter: 'య',
    transliteration: 'ya',
    soundFile: null,
    category: 'consonant',
    group: 'additional',
    difficulty: 1
  },
  {
    id: 'consonant-27',
    letter: 'ర',
    transliteration: 'ra',
    soundFile: null,
    category: 'consonant',
    group: 'additional',
    difficulty: 1
  },
  {
    id: 'consonant-28',
    letter: 'ల',
    transliteration: 'la',
    soundFile: null,
    category: 'consonant',
    group: 'additional',
    difficulty: 1
  },
  {
    id: 'consonant-29',
    letter: 'వ',
    transliteration: 'va',
    soundFile: null,
    category: 'consonant',
    group: 'additional',
    difficulty: 1
  },
  {
    id: 'consonant-30',
    letter: 'శ',
    transliteration: 'sha',
    soundFile: null,
    category: 'consonant',
    group: 'additional',
    difficulty: 2
  },
  {
    id: 'consonant-31',
    letter: 'ష',
    transliteration: 'sha',
    soundFile: null,
    category: 'consonant',
    group: 'additional',
    difficulty: 2
  },
  {
    id: 'consonant-32',
    letter: 'స',
    transliteration: 'sa',
    soundFile: null,
    category: 'consonant',
    group: 'additional',
    difficulty: 1
  },
  {
    id: 'consonant-33',
    letter: 'హ',
    transliteration: 'ha',
    soundFile: null,
    category: 'consonant',
    group: 'additional',
    difficulty: 1
  },
  {
    id: 'consonant-34',
    letter: 'ళ',
    transliteration: 'la',
    soundFile: null,
    category: 'consonant',
    group: 'additional',
    difficulty: 2
  },
  {
    id: 'consonant-35',
    letter: 'క్ష',
    transliteration: 'ksha',
    soundFile: null,
    category: 'consonant',
    group: 'additional',
    difficulty: 3
  },
  {
    id: 'consonant-36',
    letter: 'ఱ',
    transliteration: 'rra',
    soundFile: null,
    category: 'consonant',
    group: 'additional',
    difficulty: 3
  }
];

// Combine all letters
export const ALL_LETTERS = [...TELUGU_VOWELS, ...TELUGU_CONSONANTS];

// Helper function to get letters by difficulty
export function getLettersByDifficulty(difficulty) {
  return ALL_LETTERS.filter(letter => letter.difficulty === difficulty);
}

// Helper function to get random letters (for wrong options)
export function getRandomLetters(count, excludeIds = []) {
  const availableLetters = ALL_LETTERS.filter(l => !excludeIds.includes(l.id));
  const shuffled = [...availableLetters].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Helper function to get similar-looking letters (for harder challenges)
export function getSimilarLetters(letter) {
  const similarGroups = {
    'అ': ['ఆ', 'ఇ'],
    'ఆ': ['అ', 'ఓ'],
    'ఇ': ['ఈ', 'అ'],
    'ఈ': ['ఇ', 'ల'],
    'ఉ': ['ఊ', 'ఋ'],
    'ఊ': ['ఉ', 'ఓ'],
    'క': ['ఖ', 'గ', 'న'],
    'గ': ['క', 'ఘ', 'య'],
    'చ': ['ఛ', 'జ'],
    'జ': ['చ', 'ఝ'],
    'త': ['థ', 'ద', 'న'],
    'ద': ['త', 'ధ', 'య'],
    'న': ['మ', 'త', 'క'],
    'ప': ['ఫ', 'బ'],
    'బ': ['ప', 'భ', 'మ'],
    'మ': ['న', 'భ', 'య'],
    'య': ['న', 'గ', 'ద'],
    'ర': ['ఱ'],
    'ల': ['ళ', 'ఈ'],
    'వ': ['య'],
    'స': ['శ', 'ష']
  };

  return similarGroups[letter] || [];
}

// Game progression config
export const LEVEL_1_CONFIG = {
  level: 1,
  name: 'Letter Recognition',
  description: 'Learn to recognize Telugu letters',
  totalLessons: 10,
  lessonsPerDifficulty: {
    1: 4,  // 4 lessons with difficulty 1 letters
    2: 4,  // 4 lessons with difficulty 2 letters
    3: 2   // 2 lessons with difficulty 3 letters
  },
  questionsPerLesson: 10,
  passingScore: 0.7, // 70% correct to pass
  starsThresholds: {
    3: 0.9,  // 90%+ = 3 stars
    2: 0.75, // 75-89% = 2 stars
    1: 0.6   // 60-74% = 1 star
  }
};
