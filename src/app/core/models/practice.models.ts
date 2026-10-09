export interface Question {
  id: string;
  question: string;
  answer: string;
  acceptedAnswers?: string[];
  explanation?: string;
  category?: string;
  level?: string;
}

export interface ImageQuestion {
  id: string;
  question: string;
  answer: string;
  acceptedAnswers?: string[];
  explanation?: string;
}

export interface ImageExercise {
  id: string;
  image: string;
  title?: string;
  questions: ImageQuestion[];
}

export interface PracticeItem {
  id: string;
  question: string;
  answer: string;
  acceptedAnswers?: string[];
  explanation?: string;
  image?: string;
  imageTitle?: string;
  imageExerciseId?: string;
  source: 'text' | 'image';
}

export interface AnswerReview extends PracticeItem {
  userAnswer: string;
  correct: boolean;
}
