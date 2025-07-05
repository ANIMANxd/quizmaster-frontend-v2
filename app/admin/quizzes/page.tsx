'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz, Chapter, Subject } from '@/types/quiz';
import Modal from '@/components/Modal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Type for questions that are being edited manually
interface EditableQuestion {
  id?: number;
  question_text: string;
  question_type: 'mcq' | 'msq';
  marks: number;
  options: {
    id?: number;
    option_text: string;
    is_correct: boolean;
  }[];
}

// Type for questions coming from the AI
interface AIQuestion {
  question: string;
  type: 'MCQ' | 'MSQ';
  options: string[];
  correct_answers: string[];
  marks: number;
}
interface AIGeneratedQuiz {
  title: string;
  questions: AIQuestion[];
}

export default function QuizzesPage() {
  const { user, token } = useAuth(); // <-- We now use the 'user' object for role checks
  
  // Data State
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]); // This will be filtered for teachers
  const [subjects, setSubjects] = useState<Subject[]>([]); // This will be filtered for teachers
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual Quiz Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [manualFormState, setManualFormState] = useState({ title: '', subject_id: '', chapter_id: '' });

  // AI Quiz Flow State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiFormSubject, setAiFormSubject] = useState('');
  const [selectedChapterForAI, setSelectedChapterForAI] = useState<string>('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<AIGeneratedQuiz | null>(null);

  // Manual Question Editor State
  const [isQuestionEditorOpen, setIsQuestionEditorOpen] = useState(false);
  const [currentQuizForQuestions, setCurrentQuizForQuestions] = useState<Quiz | null>(null);
  const [editableQuestions, setEditableQuestions] = useState<EditableQuestion[]>([]);

  // ==================== START: UPDATED DATA FETCHING LOGIC ====================
// In app/admin/quizzes/page.tsx

  // --- Core Data Fetching (Corrected Version) ---
  const fetchData = async () => {
    if (!user || !token) return;

    setIsLoading(true);
    setError(null);
    try {
      // Determine the correct URL for fetching quizzes based on the user's role.
      const quizzesUrl = user.role === 'admin'
        ? `${API_BASE_URL}/quizzes/`
        : `${API_BASE_URL}/quizzes/by-teacher`; // This endpoint is specifically for teachers.

      // We still need all chapters for mapping, but subjects are handled differently.
      // The `/subjects` endpoint will AUTOMATICALLY return a filtered list for teachers.
      const [quizzesRes, chaptersRes, subjectsRes] = await Promise.all([
        fetch(quizzesUrl, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/chapters/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/subjects/`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      // Check all responses for errors.
      if (!quizzesRes.ok) {
          // Let's get the raw text of the response if it's not JSON
          const errorText = await quizzesRes.text();
          console.error("DEBUG: Raw error response from /quizzes/by-teacher:", errorText);
          
          // Check if token is expired
          if (errorText.includes("Token expired")) {
            // Redirect to login page or refresh token
            setError("Your session has expired. Please login again.");
            // Optional: force logout and redirect
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token'); // Clear the token
              window.location.href = '/login'; // Redirect to login
            }
            return;
          }
          
          throw new Error('Failed to fetch quizzes. Check browser and server console.');
      }
      if (!chaptersRes.ok) throw new Error('Failed to fetch chapters.');
      if (!subjectsRes.ok) throw new Error('Failed to fetch subjects.');

      const quizzesData = await quizzesRes.json();
      console.log("DEBUG: Successfully fetched quizzes data:", quizzesData);
      const chaptersData = await chaptersRes.json();
      const subjectsData = await subjectsRes.json(); // For teachers, this is already their assigned subjects.

      // Set the state directly. No complex client-side filtering is needed for the main lists.
      setQuizzes(quizzesData);
      setChapters(chaptersData);
      setSubjects(subjectsData);

    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchData();
    }
  }, [token, user]); // Depend on user as well
  // ==================== END: UPDATED DATA FETCHING LOGIC ====================
  
  // --- All other handler functions (Manual Quiz CRUD, Question Editor, AI Flow) remain the same ---
  // They will now operate on the pre-filtered 'subjects' and 'chapters' state,
  // preventing teachers from selecting options they are not assigned to.
  const handleOpenManualModal = (quiz: Quiz | null) => {
    if (quiz) {
      setEditingQuiz(quiz);
      const chapter = chapters.find(c => c.id === quiz.chapter_id);
      const subject = subjects.find(s => s.id === chapter?.subject_id);
      setManualFormState({ title: quiz.title, subject_id: subject ? String(subject.id) : '', chapter_id: chapter ? String(chapter.id) : '' });
    } else {
      setEditingQuiz(null);
      setManualFormState({ title: '', subject_id: '', chapter_id: '' });
    }
    setIsManualModalOpen(true);
  };
  const handleManualFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const url = editingQuiz ? `${API_BASE_URL}/quizzes/${editingQuiz.id}` : `${API_BASE_URL}/quizzes/`;
    const method = editingQuiz ? 'PUT' : 'POST';
    const payload = { title: manualFormState.title, chapter_id: parseInt(manualFormState.chapter_id) };
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to save manual quiz.');
      setIsManualModalOpen(false);
      fetchData();
    } catch (err: any) { alert(`Error: ${err.message}`); }
  };
  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm("Are you sure? This will delete the quiz and all its questions.")) return;
    try {
      await fetch(`${API_BASE_URL}/quizzes/${quizId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
      fetchData();
    } catch(err: any) { alert(`Error: ${err.message}`); }
  };
  const handleOpenQuestionEditor = async (quiz: Quiz) => {
  setCurrentQuizForQuestions(quiz);

  try {
    const res = await fetch(`${API_BASE_URL}/questions/by-quiz/${quiz.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Could not fetch existing questions.");

    const questionsFromApi = await res.json();

    const formattedQuestions: EditableQuestion[] = questionsFromApi.map((q: any) => ({
      id: q.id,
      question_text: q.question_text || "",
      question_type: q.question_type === "msq" ? "msq" : "mcq", // fallback to 'mcq' if unknown
      marks: q.marks ?? 1,
      options: (q.options || []).map((opt: any) => ({
        id: opt.id,
        option_text: opt.option_text || "",
        is_correct: !!opt.is_correct
      }))
    }));

    setEditableQuestions(formattedQuestions);
    setIsQuestionEditorOpen(true);

  } catch (err: any) {
    alert(`Error loading questions: ${err.message}`);
    setEditableQuestions([]);
    setIsQuestionEditorOpen(false);
  }
};

  const handleSaveManualQuestions = async () => {
    if (!currentQuizForQuestions) {
      alert("No quiz is selected for editing.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/quizzes/${currentQuizForQuestions.id}/questions`, 
        {
          method: 'PUT', // Using PUT for an update operation
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          // Send the entire list of questions as the payload.
          // The backend will handle the rest.
          body: JSON.stringify(editableQuestions),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to save questions.");
      }

      alert("Questions saved successfully!");
      setIsQuestionEditorOpen(false);
      // No need to call fetchData() as the quiz itself hasn't changed, only its children.
      // Or you can call it to be safe, it doesn't hurt.
      fetchData(); 

    } catch (err: any) {
      alert(`An error occurred while saving questions: ${err.message}`);
    }
  };
  const handleManualQuestionChange = (qIndex: number, field: keyof EditableQuestion, value: any) => {
    const newQ = [...editableQuestions];
    (newQ[qIndex] as any)[field] = value;

    if (field === 'question_type' && value === 'mcq') {
      let first = false;
      newQ[qIndex].options.forEach(opt => {
        if (opt.is_correct && !first) first = true;
        else opt.is_correct = false;
      });
    }

    setEditableQuestions(newQ);
  };

  const handleManualOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQ = [...editableQuestions];
    newQ[qIndex].options[oIndex].option_text = value;
    setEditableQuestions(newQ);
  };

  const handleManualCorrectToggle = (qIndex: number, oIndex: number) => {
    const newQ = [...editableQuestions];
    const q = newQ[qIndex];
    const opt = q.options[oIndex];

    if (q.question_type === 'mcq') {
      q.options.forEach((op, i) => (op.is_correct = i === oIndex));
    } else {
      opt.is_correct = !opt.is_correct;
    }

    setEditableQuestions(newQ);
  };

  const addManualOption = (qIndex: number) => {
    const newQ = [...editableQuestions];
    newQ[qIndex].options.push({ option_text: 'New Option', is_correct: false });
    setEditableQuestions(newQ);
  };

  const removeManualOption = (qIndex: number, oIndex: number) => {
    const newQ = [...editableQuestions];
    if (newQ[qIndex].options.length <= 2) {
      alert("Must have at least two options.");
      return;
    }
    newQ[qIndex].options.splice(oIndex, 1);
    setEditableQuestions(newQ);
  };

  const addManualQuestion = () => {
    const newQ: EditableQuestion = {
      question_text: 'New Question',
      question_type: 'mcq',
      marks: 1,
      options: [
        { option_text: 'Option A', is_correct: true },
        { option_text: 'Option B', is_correct: false }
      ]
    };
    setEditableQuestions([...editableQuestions, newQ]);
  };

  const removeManualQuestion = (qIndex: number) => {
    const newQ = [...editableQuestions];
    if (newQ.length > 0) {
      newQ.splice(qIndex, 1);
      setEditableQuestions(newQ);
    }
  };

  const handleAiFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);

    const formData = new FormData(e.currentTarget);
    const chapterId = formData.get('chapterSelect');

    if (!chapterId) {
      alert("Please select a chapter.");
      setIsGenerating(false);
      return;
    }

    setSelectedChapterForAI(chapterId as string);

    try {
      const res = await fetch(`${API_BASE_URL}/ai-quizzes/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to generate quiz.');

      setGeneratedQuiz(data);
      setIsAiModalOpen(false);
      setIsPreviewModalOpen(true);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiQuizSubmit = async () => {
    if (!generatedQuiz || !selectedChapterForAI) return;

    const payload = { ...generatedQuiz, chapter_id: parseInt(selectedChapterForAI) };

    try {
      const res = await fetch(`${API_BASE_URL}/ai-quizzes/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to save AI quiz.');

      setIsPreviewModalOpen(false);
      fetchData();
      alert('AI Quiz saved successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleGeneratedQuizChange = (field: string, value: any) => {
    if (generatedQuiz) {
      setGeneratedQuiz({ ...generatedQuiz, [field]: value });
    }
  };

  const handleQuestionChange = (qIndex: number, field: string, value: any) => {
    if (generatedQuiz) {
      const newQ = [...generatedQuiz.questions];
      (newQ[qIndex] as any)[field] = value;
      setGeneratedQuiz({ ...generatedQuiz, questions: newQ });
    }
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    if (generatedQuiz) {
      const newQ = [...generatedQuiz.questions];
      const oldOpt = newQ[qIndex].options[oIndex];
      newQ[qIndex].options[oIndex] = value;

      const correctIdx = newQ[qIndex].correct_answers.indexOf(oldOpt);
      if (correctIdx !== -1) {
        newQ[qIndex].correct_answers[correctIdx] = value;
      }

      setGeneratedQuiz({ ...generatedQuiz, questions: newQ });
    }
  };

  const handleCorrectToggle = (qIndex: number, option: string) => {
    if (generatedQuiz) {
      const newQ = [...generatedQuiz.questions];
      const q = newQ[qIndex];
      const answers = new Set(q.correct_answers);

      if (answers.has(option)) {
        answers.delete(option);
      } else {
        if (q.type === 'MCQ') answers.clear();
        answers.add(option);
      }

      q.correct_answers = Array.from(answers);
      setGeneratedQuiz({ ...generatedQuiz, questions: newQ });
    }
  };

  const addOption = (qIndex: number) => {
    if (generatedQuiz) {
      const newQ = [...generatedQuiz.questions];
      newQ[qIndex].options.push('New Option');
      setGeneratedQuiz({ ...generatedQuiz, questions: newQ });
    }
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    if (generatedQuiz) {
      const newQ = [...generatedQuiz.questions];
      if (newQ[qIndex].options.length <= 2) {
        alert("Must have at least two options.");
        return;
      }
      const removedOpt = newQ[qIndex].options.splice(oIndex, 1)[0];
      newQ[qIndex].correct_answers = newQ[qIndex].correct_answers.filter(ans => ans !== removedOpt);
      setGeneratedQuiz({ ...generatedQuiz, questions: newQ });
    }
  };

  const addQuestion = () => {
    if (generatedQuiz) {
      const newQ: AIQuestion = {
        question: 'New Question',
        type: 'MCQ',
        options: ['Option A', 'Option B'],
        correct_answers: ['Option A'],
        marks: 1
      };
      setGeneratedQuiz({ ...generatedQuiz, questions: [...generatedQuiz.questions, newQ] });
    }
  };

  const removeQuestion = (qIndex: number) => {
    if (generatedQuiz && generatedQuiz.questions.length > 1) {
      const newQ = [...generatedQuiz.questions];
      newQ.splice(qIndex, 1);
      setGeneratedQuiz({ ...generatedQuiz, questions: newQ });
    } else {
      alert("Quiz must have at least one question.");
    }
  };

  const getQuizInfo = (chapterId: number) => {
    const chapter = chapters.find(c => c.id === chapterId);
    const subject = subjects.find(s => s.id === chapter?.subject_id);
    return {
      chapterName: chapter?.name || 'N/A',
      subjectName: subject?.name || 'N/A'
    };
  };

  return (
    // ================== THE ONLY CHANGE IS HERE ==================
    // I am changing the classes on this single div.
    <div className="bg-white p-6 rounded-lg shadow-md w-full">
      <header className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Management</h1>
          <p className="text-sm text-gray-600">Create, edit, and manage all quizzes.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => handleOpenManualModal(null)} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
            Create Manually
          </button>
          <button onClick={() => setIsAiModalOpen(true)} className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-purple-700 transition-colors">
            Create with AI
          </button>
        </div>
      </header>

      {isLoading ? (
        <p className="text-gray-700">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Quiz Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Origin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Chapter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quizzes.map((quiz) => { 
                const { chapterName, subjectName } = getQuizInfo(quiz.chapter_id); 
                return (
                  <tr key={quiz.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{quiz.title}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        quiz.is_ai_generated 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {quiz.is_ai_generated ? 'AI' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{subjectName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{chapterName}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleOpenQuestionEditor(quiz)} 
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-green-600 text-green-700 bg-green-50 hover:bg-green-100 transition"
                        >
                          Add/Edit
                        </button>

                        <button 
                          onClick={() => handleOpenManualModal(quiz)} 
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-yellow-500 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition"
                        >
                          Edit
                        </button>

                        <button 
                          onClick={() => handleDeleteQuiz(quiz.id)} 
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-red-600 text-red-700 bg-red-50 hover:bg-red-100 transition"
                        >
                          Delete
                        </button>
                      </div>

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

        {/* Manual Quiz Modal */}
<Modal
  isOpen={isManualModalOpen}
  onClose={() => setIsManualModalOpen(false)}
  title={editingQuiz ? "Edit Quiz" : "Create Manual Quiz"}
>
  <form onSubmit={handleManualFormSubmit}>
    <div className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title</label>
        <input
          type="text"
          value={manualFormState.title}
          onChange={(e) =>
            setManualFormState({ ...manualFormState, title: e.target.value })
          }
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
        <select
          value={manualFormState.subject_id}
          onChange={(e) =>
            setManualFormState({
              ...manualFormState,
              subject_id: e.target.value,
              chapter_id: '',
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md bg-white"
          required
        >
          <option value="" disabled>-- Select Subject --</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Chapter</label>
        <select
          value={manualFormState.chapter_id}
          onChange={(e) =>
            setManualFormState({
              ...manualFormState,
              chapter_id: e.target.value,
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md bg-white"
          required
          disabled={!manualFormState.subject_id}
        >
          <option value="" disabled>-- Select Chapter --</option>
          {chapters
            .filter((c) => c.subject_id === parseInt(manualFormState.subject_id))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </div>
    </div>
    <div className="bg-gray-50 px-6 py-3 flex justify-end border-t">
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
      >
        Save Quiz
      </button>
    </div>
  </form>
</Modal>

{/* AI Quiz Generation Modal */}
<Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="Create Quiz with AI">
  <form onSubmit={handleAiFormSubmit}>
    <div className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium">1. Select Subject</label>
        <select
          defaultValue=""
          onChange={(e) => setAiFormSubject(e.target.value)}
          className="w-full p-2 border rounded-md bg-white"
          required
        >
          <option value="" disabled>-- Select --</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">2. Select Chapter</label>
        <select
          name="chapterSelect"
          defaultValue=""
          disabled={!aiFormSubject}
          className="w-full p-2 border rounded-md bg-white disabled:bg-gray-200"
          required
        >
          <option value="" disabled>-- Select --</option>
          {chapters
            .filter((c) => c.subject_id === parseInt(aiFormSubject))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">MCQs</label>
        <input
          type="number"
          name="mcq_count"
          defaultValue={3}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">MSQs</label>
        <input
          type="number"
          name="msq_count"
          defaultValue={2}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Marks/Question</label>
        <input
          type="number"
          name="marks_per_question"
          defaultValue={1}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">File</label>
        <input
          type="file"
          name="file"
          accept=".pdf,.txt,.pptx,.docx"
          className="w-full"
          required
        />
      </div>
    </div>
    <div className="bg-gray-50 px-6 py-3 flex justify-end border-t">
      <button
        type="submit"
        disabled={isGenerating}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-purple-300"
      >
        {isGenerating ? 'Generating...' : 'Generate Quiz'}
      </button>
    </div>
  </form>
</Modal>

<Modal 
        isOpen={isPreviewModalOpen} 
        onClose={() => {
          setIsPreviewModalOpen(false);
          setGeneratedQuiz(null); // Clear data on close
        }} 
        title="Review & Edit AI Quiz"
      >
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {generatedQuiz && (
            <>
              <div className="mb-6">
                <label className="block text-lg font-bold text-gray-800 mb-2">Quiz Title</label>
                <input type="text" value={generatedQuiz.title} onChange={(e) => handleGeneratedQuizChange('title', e.target.value)} className="w-full p-2 border rounded-md text-xl font-bold"/>
              </div>
              <div className="space-y-6">
                {generatedQuiz.questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 border-2 rounded-lg bg-gray-50/50">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <textarea value={q.question} onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)} className="w-full p-2 border rounded-md font-semibold" rows={2}/>
                      <button onClick={() => removeQuestion(qIndex)} className="text-red-500 font-bold text-2xl">×</button>
                    </div>
                    <div className="space-y-2 mb-4">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input type={q.type === 'MCQ' ? 'radio' : 'checkbox'} name={`correct_q_${qIndex}`} checked={q.correct_answers.includes(opt)} onChange={() => handleCorrectToggle(qIndex, opt)} className="h-5 w-5"/>
                          <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} className="flex-grow p-2 border rounded-md"/>
                          <button onClick={() => removeOption(qIndex, oIndex)} className="text-red-500 text-sm">Remove</button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => addOption(qIndex)} className="text-sm text-blue-600 hover:underline">+ Add Option</button>
                    <div className="flex justify-end items-center gap-4 mt-4 border-t pt-3">
                      <label className="text-sm">Type:</label>
                      <select value={q.type} onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)} className="p-1 border rounded-md bg-white">
                        <option value="MCQ">MCQ</option>
                        <option value="MSQ">MSQ</option>
                      </select>
                      <label className="text-sm">Marks:</label>
                      <input type="number" value={q.marks} min="1" onChange={(e) => handleQuestionChange(qIndex, 'marks', parseInt(e.target.value) || 1)} className="w-20 p-1 border rounded-md"/>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addQuestion} className="mt-6 w-full py-2 bg-green-100 text-green-700 font-semibold rounded-md hover:bg-green-200">+ Add Question</button>
            </>
          )}
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-end border-t">
          <button onClick={handleAiQuizSubmit} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">Save Quiz</button>
        </div>
      </Modal>


{/* Manual Question Editor Modal */}
<Modal
  isOpen={isQuestionEditorOpen}
  onClose={() => setIsQuestionEditorOpen(false)}
  title={`Editing Questions for: ${currentQuizForQuestions?.title || ''}`}
>
  <div className="p-6 max-h-[70vh] overflow-y-auto">
    <div className="space-y-6">
      {editableQuestions.map((q, qIndex) => (
        <div key={q.id || qIndex} className="p-4 border-2 rounded-lg bg-gray-50">
          <div className="flex justify-between items-start gap-4 mb-3">
            <textarea
              value={q.question_text}
              onChange={(e) =>
                handleManualQuestionChange(qIndex, 'question_text', e.target.value)
              }
              className="w-full p-2 border rounded-md font-semibold"
              rows={2}
            />
            <button
              onClick={() => removeManualQuestion(qIndex)}
              className="text-red-500 font-bold text-2xl hover:text-red-700 transition-colors"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 mb-4">
            {q.options.map((opt, oIndex) => (
              <div key={opt.id || oIndex} className="flex items-center gap-2">
                <input
                  type={q.question_type === 'mcq' ? 'radio' : 'checkbox'}
                  name={`manual_correct_q_${qIndex}`}
                  checked={opt.is_correct}
                  onChange={() => handleManualCorrectToggle(qIndex, oIndex)}
                  className="h-5 w-5"
                />
                <input
                  type="text"
                  value={opt.option_text}
                  onChange={(e) =>
                    handleManualOptionChange(qIndex, oIndex, e.target.value)
                  }
                  className="flex-grow p-2 border rounded-md"
                />
                <button
                  onClick={() => removeManualOption(qIndex, oIndex)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => addManualOption(qIndex)}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add Option
          </button>
          <div className="flex justify-end items-center gap-4 mt-4 border-t pt-3">
            <label className="text-sm">Type:</label>
            <select
              value={q.question_type}
              onChange={(e) =>
                handleManualQuestionChange(qIndex, 'question_type', e.target.value as 'mcq' | 'msq')
              }
              className="p-1 border rounded-md bg-white"
            >
              <option value="mcq">MCQ</option>
              <option value="msq">MSQ</option>
            </select>
            <label className="text-sm">Marks:</label>
            <input
              type="number"
              value={q.marks}
              min="1"
              onChange={(e) =>
                handleManualQuestionChange(qIndex, 'marks', parseInt(e.target.value) || 1)
              }
              className="w-20 p-1 border rounded-md"
            />
          </div>
        </div>
      ))}
    </div>
    <button
      onClick={addManualQuestion}
      className="mt-6 w-full py-2 bg-green-100 text-green-700 font-semibold rounded-md hover:bg-green-200"
    >
      + Add Question
    </button>
  </div>
  <div className="bg-gray-50 px-6 py-3 flex justify-end border-t">
    <button
      onClick={handleSaveManualQuestions}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
    >
      Save All Changes
    </button>
  </div>
</Modal>
      </div>
    
  );
}