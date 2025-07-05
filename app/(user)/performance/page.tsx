'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
// Import our new Recharts-based components
import { SubjectPerformanceChart, TrendPerformanceChart } from '@/components/PerformanceCharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// ... (The PerformanceData interface and StatCard/PerformanceList components remain the same)
interface PerformanceData {
  total_quizzes_taken: number;
  total_attempts: number;
  average_score: number;
  best_subject: string | null;
  worst_subject: string | null;
  performance_by_subject: { subject_name: string; average_score: number }[];
  recent_attempts: { score: number }[];
  best_performing_quizzes: { quiz_title: string; best_score: number }[];
  improvement_areas: { quiz_title: string; best_score: number }[];
}
const StatCard = ({ title, value }: { title: string, value: string | number }) => (
  <div className="bg-white p-5 rounded-lg shadow text-center border-l-4 border-sky-500"><h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3><p className="text-3xl font-bold text-gray-800 mt-2">{value}</p></div>
);
const PerformanceList = ({ title, items }: { title: string, items: { quiz_title: string; best_score: number }[] }) => (
    <div className="bg-white p-6 rounded-lg shadow h-full"><h3 className="font-bold text-lg mb-4 text-center text-gray-700">{title}</h3><div className="space-y-3 max-h-80 overflow-y-auto">{items.map((item, index) => (<div key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-slate-50"><span className="font-medium text-gray-700 truncate pr-2">{item.quiz_title}</span><span className={`font-bold text-sm w-8 h-8 flex items-center justify-center rounded-full text-white ${item.best_score >= 8 ? 'bg-green-500' : item.best_score >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}>{item.best_score}</span></div>))}</div></div>
);


export default function PerformancePage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;
    const fetchPerformance = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/performance/user/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load performance data.");
        setData(await res.json());
      } catch (err) { console.error(err); } 
      finally { setIsLoading(false); }
    };
    fetchPerformance();
  }, [user, token]);

  if (isLoading) return <p>Loading performance data...</p>;
  if (!data || data.total_attempts === 0) return <div className="text-center py-10 bg-white rounded-lg shadow-md"><p className="text-gray-500">No performance data available. Complete a quiz to see your stats!</p></div>;

  return (
    <div>
      <header className="pb-4 border-b border-gray-200 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Your Performance Summary</h1>
        <p className="text-gray-500">An overview of your quiz results and progress.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Quizzes Taken" value={data.total_quizzes_taken} />
        <StatCard title="Total Attempts" value={data.total_attempts} />
        <StatCard title="Average Score" value={data.average_score.toFixed(1)} />
        <StatCard title="Best Subject" value={data.best_subject || 'N/A'} />
      </section>

      {/* --- THIS IS THE UPDATED SECTION --- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-4 text-center text-gray-800">Average Score by Subject</h3>
            <SubjectPerformanceChart data={data.performance_by_subject} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-4 text-center text-gray-800">Recent Performance Trend</h3>
            <TrendPerformanceChart data={data.recent_attempts} />
        </div>
        <PerformanceList title="Best Performing Quizzes" items={data.best_performing_quizzes} />
        <PerformanceList title="Areas for Improvement" items={data.improvement_areas} />
      </section>
    </div>
  );
}