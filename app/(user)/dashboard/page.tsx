'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Subject, Chapter, Quiz } from '@/types/quiz';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function DashboardPage() {
  const { user, logout, token } = useAuth();

  // Data state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attemptCounts, setAttemptCounts] = useState<Record<number, number>>({});

  // UI state
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState({
    subjects: true,
    chapters: false,
    quizzes: false,
  });
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all subjects when the component first mounts
  useEffect(() => {
    if (!token) return;
    const fetchSubjects = async () => {
      setIsLoading(prev => ({ ...prev, subjects: true }));
      try {
        const response = await fetch(`${API_BASE_URL}/subjects`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch subjects.');
        setSubjects(await response.json());
      } catch (err: any) { setError(err.message); } 
      finally { setIsLoading(prev => ({ ...prev, subjects: false })); }
    };
    fetchSubjects();
  }, [token]);
  
  // Memoized function to fetch attempt counts for a list of quizzes
  const fetchAttemptCounts = useCallback(async (quizzesToFetch: Quiz[]) => {
    if (!user || !token || quizzesToFetch.length === 0) return;
    
    // Create an array of fetch promises
    const promises = quizzesToFetch.map(quiz =>
      fetch(`${API_BASE_URL}/quiz-attempts/by-user-quiz/${user.id}/${quiz.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.ok ? res.json() : [])
    );
    
    // Wait for all promises to resolve
    const results = await Promise.all(promises);
    
    // Create a new map of quizId to attempt count
    const newCounts: Record<number, number> = {};
    quizzesToFetch.forEach((quiz, index) => {
      newCounts[quiz.id] = results[index].length;
    });
    
    setAttemptCounts(prev => ({...prev, ...newCounts}));
  }, [user, token]);

  // 2. Handle clicking on a subject card
  const handleSelectSubject = async (subject: Subject) => {
    if (selectedSubject?.id === subject.id) {
      setSelectedSubject(null);
      setSelectedChapter(null);
      setChapters([]);
      setQuizzes([]);
      return;
    }
    
    setSelectedSubject(subject);
    setSelectedChapter(null);
    setQuizzes([]);
    setIsLoading(prev => ({ ...prev, chapters: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/chapters/by-subject/${subject.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch chapters.');
      const data: Chapter[] = await response.json();
      setChapters(data);
      // Automatically select and load quizzes for the first chapter
      if (data.length > 0) {
        handleSelectChapter(data[0]);
      }
    } catch (err: any) { setError(err.message); } 
    finally { setIsLoading(prev => ({ ...prev, chapters: false })); }
  };

  // 3. Handle clicking on a chapter tab
  const handleSelectChapter = async (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setIsLoading(prev => ({ ...prev, quizzes: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/by-chapter/${chapter.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch quizzes.');
      const data: Quiz[] = await response.json();
      setQuizzes(data);
      // After fetching quizzes, fetch their attempt counts
      if (data.length > 0) {
        fetchAttemptCounts(data);
      }
    } catch (err: any) { setError(err.message); } 
    finally { setIsLoading(prev => ({ ...prev, quizzes: false })); }
  };
  
  const requestReattempt = async (e: React.MouseEvent<HTMLButtonElement>, quizId: number) => {
      const button = e.currentTarget;
      if (!user || !token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/quiz-attempts/request-reattempt`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ user_id: user.id, quiz_id: quizId })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || "Failed to send request.");
        alert(result.message);
        button.textContent = "Request Sent";
        button.disabled = true;
      } catch(error: any) {
        alert(error.message);
      }
  }

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name}!</h1>
        <p className="text-gray-600">Choose a subject to start learning and attempting quizzes.</p>
      </header>

      {error && <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Select a Subject</h2>
        {isLoading.subjects ? <p className="text-gray-600">Loading subjects...</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subjects.map((subject) => (
              <button key={subject.id} onClick={() => handleSelectSubject(subject)} className={`p-6 rounded-lg text-gray-800 text-left transition-all duration-300 transform hover:-translate-y-1 ${ selectedSubject?.id === subject.id ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-300' : 'bg-white hover:bg-gray-100 shadow' }`}>
                <h3 className="font-bold text-lg ">{subject.name}</h3>
                <p className={`text-sm ${selectedSubject?.id === subject.id ? 'text-blue-100' : 'text-gray-900'}`}>{subject.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSubject && (
        <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Select a Chapter from {selectedSubject.name}</h2>
          {isLoading.chapters ? <p className="text-gray-900">Loading chapters...</p> : (
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 mb-4">
              {chapters.length > 0 ? chapters.map((chapter) => (
                <button key={chapter.id} onClick={() => handleSelectChapter(chapter)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${ selectedChapter?.id === chapter.id ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800' }`}>
                  {chapter.name}
                </button>
              )) : <p className="text-gray-600">No chapters found.</p>}
            </div>
          )}

          {selectedChapter && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">3. Available Quizzes</h3>
              {isLoading.quizzes ? <p className="text-gray-600">Loading quizzes...</p> : (
                <ul className="divide-y divide-gray-200">
                  {quizzes.length > 0 ? quizzes.map((quiz) => {
                    const attemptCount = attemptCounts[quiz.id] ?? 0;
                    const maxAttemptsReached = attemptCount >= 3;
                    return (
                      <li key={quiz.id} className="py-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-lg text-gray-900">{quiz.title}</p>
                        </div>
                        {maxAttemptsReached ? (
                            <button onClick={(e) => requestReattempt(e, quiz.id)} className="bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50">
                                Request Re-attempt
                            </button>
                        ) : (
                            <Link href={`/quiz/${quiz.id}`} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
                                Start Quiz ({attemptCount}/3)
                            </Link>
                        )}
                      </li>
                    )
                  }) : <p className="text-gray-600">No quizzes found for this chapter.</p>}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}