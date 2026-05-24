import countries from "../data/countries.json";

export interface Country {
  name: string;
  capital: string;
  code: string;
  flag: string;
  region: string;
  continent: string;
}

export interface Question {
  type: "flag" | "capital";
  country: Country;
  options: string[];
  correctAnswer: string;
}

export const getRandomCountry = (
  excludeCodes: string[] = [],
  pool?: Country[],
): Country => {
  const available = (pool || countries).filter(
    (c) => !excludeCodes.includes(c.code),
  );
  return available[Math.floor(Math.random() * available.length)] as Country;
};

export const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const generateQuestion = (
  type: "flag" | "capital",
  pool?: Country[],
): Question => {
  const poolToUse = pool || (countries as Country[]);
  const country = getRandomCountry([], poolToUse);
  const correctAnswer = type === "flag" ? country.name : country.capital;

  // Get 3 distractors from the same region if possible, otherwise anywhere in the pool
  let distractors = poolToUse
    .filter((c) => c.code !== country.code && c.region === country.region)
    .map((c) => (type === "flag" ? c.name : c.capital));

  if (distractors.length < 3) {
    distractors = poolToUse
      .filter((c) => c.code !== country.code)
      .map((c) => (type === "flag" ? c.name : c.capital));
  }

  const selectedDistractors = shuffle(distractors).slice(0, 3);
  const options = shuffle([correctAnswer, ...selectedDistractors]);

  return {
    type,
    country,
    options,
    correctAnswer,
  };
};
export const generateQuizForLevel = (level: number, type: "flag" | "capital"): Question[] => {
  const COUNTRIES_PER_LEVEL = 10;
  const startIndex = (level - 1) * COUNTRIES_PER_LEVEL;
  const levelCountries = countries.slice(startIndex, startIndex + COUNTRIES_PER_LEVEL);
  
  return levelCountries.map(country => {
    const correctAnswer = type === "flag" ? country.name : country.capital;
    
    // Distractors from the same region if possible, otherwise anywhere in countries pool
    let distractors = countries
      .filter((c) => c.code !== country.code && c.region === country.region)
      .map((c) => (type === "flag" ? c.name : c.capital))
      .filter(val => !!val);
    
    if (distractors.length < 3) {
      distractors = countries
        .filter((c) => c.code !== country.code)
        .map((c) => (type === "flag" ? c.name : c.capital))
        .filter(val => !!val);
    }
    
    // Deduplicate and ensure correct answer is not in distractors
    const uniqueDistractors = Array.from(new Set(distractors)).filter(d => d !== correctAnswer);
    const selectedDistractors = shuffle(uniqueDistractors).slice(0, 3);
    const options = shuffle([correctAnswer, ...selectedDistractors]);
    
    return {
      type,
      country: country as Country,
      options,
      correctAnswer,
    };
  });
};
