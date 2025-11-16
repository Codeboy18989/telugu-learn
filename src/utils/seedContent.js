// Seed data for pre-loaded Telugu content (Age 2-4)
// Run this once as a Super Admin to populate the database

export const SEED_CONTENT_AGE_2_4 = [
  {
    teluguText: 'అమ్మ',
    englishTranslation: 'Mother',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'నాన్న',
    englishTranslation: 'Father',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'నీళ్ళు',
    englishTranslation: 'Water',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'అన్నం',
    englishTranslation: 'Rice/Food',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'పాలు',
    englishTranslation: 'Milk',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'బంతి',
    englishTranslation: 'Ball',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'కుక్క',
    englishTranslation: 'Dog',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'పిల్లి',
    englishTranslation: 'Cat',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'పువ్వు',
    englishTranslation: 'Flower',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'చెట్టు',
    englishTranslation: 'Tree',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'సూర్యుడు',
    englishTranslation: 'Sun',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'చంద్రుడు',
    englishTranslation: 'Moon',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'నక్షత్రం',
    englishTranslation: 'Star',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'ఇల్లు',
    englishTranslation: 'House',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'కారు',
    englishTranslation: 'Car',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'పుస్తకం',
    englishTranslation: 'Book',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'బొమ్మ',
    englishTranslation: 'Toy/Doll',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'చేయి',
    englishTranslation: 'Hand',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'కాలు',
    englishTranslation: 'Leg',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'కళ్ళు',
    englishTranslation: 'Eyes',
    ageGroup: '2-4',
    category: 'words'
  },
  {
    teluguText: 'నమస్కారం',
    englishTranslation: 'Hello/Greetings',
    ageGroup: '2-4',
    category: 'phrases'
  },
  {
    teluguText: 'ధన్యవాదాలు',
    englishTranslation: 'Thank you',
    ageGroup: '2-4',
    category: 'phrases'
  },
  {
    teluguText: 'నాకు నీళ్ళు కావాలి',
    englishTranslation: 'I want water',
    ageGroup: '2-4',
    category: 'phrases'
  },
  {
    teluguText: 'నాకు పాలు కావాలి',
    englishTranslation: 'I want milk',
    ageGroup: '2-4',
    category: 'phrases'
  },
  {
    teluguText: 'నాకు అన్నం కావాలి',
    englishTranslation: 'I want food',
    ageGroup: '2-4',
    category: 'phrases'
  }
];

// Helper function to seed content (to be called from Content Management as Super Admin)
export function getSeedContent() {
  return SEED_CONTENT_AGE_2_4;
}
