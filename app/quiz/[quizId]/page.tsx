'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
// This import should now work after restarting the TS Server
import { FullQuiz, Question } from '@/types/quiz';
import ProtectedRoute from '@/components/ProtectedRoute';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// --- NEW: Explicitly define the props for the QuestionCard component ---
interface QuestionCardProps {
  question: Question;
  onAnswerChange: (questionId: number, answer: string, isMsq: boolean) => void;
  selectedAnswers: { [key: number]: string[] };
  isSubmitted: boolean;
}

// A component to render a single question
function QuestionCard({ question, onAnswerChange, selectedAnswers, isSubmitted }: QuestionCardProps) {
  const isCorrect = () => {
    if (!isSubmitted) return '';
    const userAnswers = new Set(selectedAnswers[question.id] || []);
    const correctAnswers = new Set(question.correct_answers);
    if (userAnswers.size !== correctAnswers.size) return 'bg-red-100 border-red-300';
    for (const answer of userAnswers) {
      if (!correctAnswers.has(answer)) return 'bg-red-100 border-red-300';
    }
    return 'bg-green-100 border-green-300';
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md border-2 ${isSubmitted ? isCorrect() : 'border-transparent'}`}>
      <p className="text-lg font-semibold text-gray-800 mb-4">{question.question}</p>
      <div className="space-y-3">
        {question.options.map((option: string, index: number) => { // <-- Explicit types
          const isChecked = selectedAnswers[question.id]?.includes(option);
          const isCorrectAnswer = question.correct_answers.includes(option);
          
          let labelClass = "text-gray-700";
          if (isSubmitted) {
            if (isCorrectAnswer) labelClass = "text-green-700 font-bold";
            else if (isChecked) labelClass = "text-red-700 line-through";
          }
          
          return (
            <label key={index} className="flex items-center p-3 rounded-md transition-colors hover:bg-gray-50">
              <input
                type={question.type === 'MCQ' ? 'radio' : 'checkbox'}
                name={`question_${question.id}`}
                value={option}
                checked={isChecked || false}
                onChange={() => onAnswerChange(question.id, option, question.type === 'MSQ')}
                disabled={isSubmitted}
                className="h-5 w-5 mr-3"
              />
              <span className={labelClass}>{option}</span>
            </label>
          )
        })}
      </div>
    </div>
  );
}


// The main page component
export default function QuizAttemptPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;

  const [quizData, setQuizData] = useState<FullQuiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string[] }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    if (!quizId || !token) return;
    const fetchQuiz = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/quizzes/${quizId}/questions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load quiz data.');
        const data: FullQuiz = await res.json();
        setQuizData(data);
      } catch (err: any) { setError(err.message); } 
      finally { setIsLoading(false); }
    };
    fetchQuiz();
  }, [quizId, token]);

  const handleAnswerChange = (questionId: number, answer: string, isMsq: boolean) => {
    setSelectedAnswers(prev => {
      const existingAnswers = prev[questionId] || [];
      if (isMsq) {
        const newAnswers = existingAnswers.includes(answer)
          ? existingAnswers.filter(a => a !== answer)
          : [...existingAnswers, answer];
        return { ...prev, [questionId]: newAnswers };
      } else {
        return { ...prev, [questionId]: [answer] };
      }
    });
  };

  const handleSubmitQuiz = async () => {
    if (!quizData || !user) return;
    let score = 0;
    quizData.questions.forEach((q: Question) => { // <-- Explicit type
      const userAnswers = new Set(selectedAnswers[q.id] || []);
      const correctAnswers = new Set(q.correct_answers);
      if (userAnswers.size === correctAnswers.size && [...userAnswers].every(a => correctAnswers.has(a))) {
        score += q.marks;
      }
    });
    setFinalScore(score);
    setIsSubmitted(true);

    try {
        await fetch(`${API_BASE_URL}/quiz-attempts/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ user_id: user.id, quiz_id: parseInt(quizId), score: score })
        });
    } catch (err) {
        console.error("Failed to submit score:", err);
    }
  };

  if (isLoading) return <div className="text-center p-10">Loading Quiz...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!quizData) return <div className="text-center p-10">Quiz not found.</div>;
  
  return (
    <ProtectedRoute allowedRoles={['user']}>
        <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">{quizData.title}</h1>
                </header>
                
                <div className="space-y-6">
                    {quizData.questions.map((question: Question) => ( // <-- Explicit type
                        <QuestionCard 
                            key={question.id}
                            question={question}
                            onAnswerChange={handleAnswerChange}
                            selectedAnswers={selectedAnswers}
                            isSubmitted={isSubmitted}
                        />
                    ))}
                </div>
                
                <div className="mt-8 text-center">
                    {!isSubmitted ? (
                        <button onClick={handleSubmitQuiz} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg">
                            Submit Quiz
                        </button>
                    ) : (
                        <div className="bg-white p-8 rounded-lg shadow-xl">
                            <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
                            <p className="text-4xl font-bold text-blue-600 mb-6">Your Score: {finalScore}</p>
                            <button onClick={() => router.push('/dashboard')} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-lg">
                                Back to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </ProtectedRoute>
  );
}