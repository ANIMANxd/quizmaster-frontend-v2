export interface Subject {
  id: number;
  name: string;
  description: string;
}

export interface Chapter {
  id: number;
  name: string;
  subject_id: number;
}

export interface Quiz {
  id: number;
  title: string;
  chapter_id: number;
  is_ai_generated: boolean;
  created_at: string; // This will be a string in JSON
}

// ... keep your existing Subject, Chapter, and Quiz types

export interface Question {
  id: number;
  question: string;
  type: 'MCQ' | 'MSQ'; // Use uppercase to match your API response
  marks: number;
  options: string[];
  correct_answers: string[];
}

export interface FullQuiz {
  quiz_id: number;
  title: string;
  questions: Question[];
}