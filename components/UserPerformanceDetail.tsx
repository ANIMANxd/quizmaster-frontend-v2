'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
// Import our new Recharts-based components
import { SubjectPerformanceChart, TrendPerformanceChart } from '@/components/PerformanceCharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface UserPerformanceDetailProps {
  userId: number;
}

// Define the shape of the performance data based on your schemas.py
interface PerformanceData {
  total_quizzes_taken: number;
  total_attempts: number;
  average_score: number;
  best_subject: string | null;
  performance_by_subject: { subject_name: string; average_score: number }[];
  recent_attempts: { score: number }[];
}

export default function UserPerformanceDetail({ userId }: UserPerformanceDetailProps) {
  const { token } = useAuth();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !token) return;

    const fetchPerformanceData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/performance/user/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Could not load performance data for this user.');
        const result: PerformanceData = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
  }, [userId, token]);

  if (isLoading) return <div className="p-6 text-center">Loading performance data...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!data || data.total_attempts === 0) return <div className="p-6 text-center">This user has not attempted any quizzes yet.</div>;
  
  return (
    <div className="p-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-100 p-4 rounded-lg text-center"><h4 className="text-sm text-gray-500">Quizzes Taken</h4><p className="text-2xl font-bold">{data.total_quizzes_taken}</p></div>
        <div className="bg-gray-100 p-4 rounded-lg text-center"><h4 className="text-sm text-gray-500">Total Attempts</h4><p className="text-2xl font-bold">{data.total_attempts}</p></div>
        <div className="bg-gray-100 p-4 rounded-lg text-center"><h4 className="text-sm text-gray-500">Average Score</h4><p className="text-2xl font-bold">{data.average_score.toFixed(1)}</p></div>
        <div className="bg-gray-100 p-4 rounded-lg text-center"><h4 className="text-sm text-gray-500">Best Subject</h4><p className="text-2xl font-bold">{data.best_subject || 'N/A'}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2 text-center">Score by Subject</h3>
            <SubjectPerformanceChart data={data.performance_by_subject} />
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2 text-center">Recent Trend</h3>
            <TrendPerformanceChart data={data.recent_attempts} />
        </div>
      </div>
    </div>
  );
}