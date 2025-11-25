export type SecurityQuestion = {
  id: string;
  prompt: string;
};

export const SECURITY_QUESTION_BANK: SecurityQuestion[] = [
  {
    "id": "favorite-color",
    "prompt": "What is your favorite color?"
  },
  {
    "id": "best-friend-first-name",
    "prompt": "What is the first name of your best friend?"
  },
  {
    "id": "favorite-school-subject",
    "prompt": "What is your favorite school subject?"
  },
  {
    "id": "first-pet-name",
    "prompt": "What is the name of your first pet? (If none, type NONE)"
  },
  {
    "id": "favorite-food",
    "prompt": "What is your favorite food?"
  },
  {
    "id": "favorite-cartoon",
    "prompt": "What is your favorite cartoon or animated show?"
  },
  {
    "id": "favorite-game",
    "prompt": "What is your favorite game to play?"
  },
  {
    "id": "favorite-holiday",
    "prompt": "What is your favorite holiday or special day?"
  },
  {
    "id": "favorite-sport",
    "prompt": "What is your favorite sport or physical activity?"
  },
  {
    "id": "favorite-teacher-first-name",
    "prompt": "What is the first name of your favorite teacher?"
  },
  {
    "id": "city-born-in",
    "prompt": "In what city or town were you born?"
  },
  {
    "id": "favorite-animal",
    "prompt": "What is your favorite animal?"
  },
  {
    "id": "dream-job",
    "prompt": "What job do you most want to have when you grow up?"
  },
  {
    "id": "favorite-place-to-visit",
    "prompt": "What is your favorite place to visit (for example: mall, park, or city)?"
  },
  {
    "id": "favorite-book",
    "prompt": "What is the title of your favorite book or story?"
  },
  {
    "id": "favorite-season",
    "prompt": "What is your favorite season of the year (summer, rainy, etc.)?"
  },
  {
    "id": "favorite-ice-cream-flavor",
    "prompt": "What is your favorite ice cream flavor?"
  },
  {
    "id": "favorite-music",
    "prompt": "What is your favorite song or kind of music?"
  },
  {
    "id": "favorite-weekday",
    "prompt": "What is your favorite day of the week?"
  },
  {
    "id": "favorite-number",
    "prompt": "What is your favorite number?"
  }
];

export type SecurityQuestionId = (typeof SECURITY_QUESTION_BANK)[number]["id"];

export const isValidSecurityQuestionId = (id: string): id is SecurityQuestionId =>
  SECURITY_QUESTION_BANK.some((question) => question.id === id);

export const getSecurityQuestionPrompt = (id: string): string | undefined =>
  SECURITY_QUESTION_BANK.find((question) => question.id === id)?.prompt;
