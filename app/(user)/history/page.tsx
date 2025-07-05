'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface Attempt {
  id: number;
  score: number;
  attempt_number: number;
  timestamp: string;
  quiz: {
    id: number;
    title: string;
  };
}

export default function HistoryPage() {
  const { user, token } = useAuth();
  const [attemptsByQuiz, setAttemptsByQuiz] = useState<Record<string, Attempt[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/quiz-attempts/by-user/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch history.");
        const allAttempts: Attempt[] = await res.json();
        
        const grouped = allAttempts.reduce((acc, attempt) => {
          const title = attempt.quiz.title;
          if (!acc[title]) acc[title] = [];
          acc[title].push(attempt);
          return acc;
        }, {} as Record<string, Attempt[]>);

        setAttemptsByQuiz(grouped);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [user, token]);

  return (
    <div>
      <header className="pb-4 border-b border-gray-200 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Your Quiz History</h1>
        <p className="text-gray-500">Review your past attempts and scores.</p>
      </header>

      {isLoading ? <p>Loading history...</p> : (
        <div className="space-y-6">
          {Object.keys(attemptsByQuiz).length === 0 ? (
            <div className="text-center py-10 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">You have not attempted any quizzes yet.</p>
            </div>
          ) : (
            Object.entries(attemptsByQuiz).map(([quizTitle, attempts]) => (
              <div key={quizTitle} className="bg-white rounded-lg shadow-md overflow-hidden">
                <h3 className="bg-gray-50 p-4 font-bold text-lg text-gray-700 border-b">{quizTitle}</h3>
                <ul className="divide-y divide-gray-200">
                  {attempts.sort((a,b) => a.attempt_number - b.attempt_number).map(attempt => (
                    <li key={attempt.id} className="p-4 grid grid-cols-3 items-center gap-4 hover:bg-slate-50">
                      <span className="font-medium text-gray-800">Attempt #{attempt.attempt_number}</span>
                      <span className="text-center text-gray-800">Score: <strong className="text-blue-600 text-lg">{attempt.score}</strong></span>
                      <span className="text-sm text-gray-500 text-right">{new Date(attempt.timestamp).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}