'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
// Import our new Recharts-based chart components
import { SubjectPerformanceChart } from '@/components/PerformanceCharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Define types for our dashboard data, based on your schemas.py
interface Stat {
  subjects: number;
  chapters: number;
  quizzes: number;
  questions: number;
  users: number;
}
interface Activity {
  user_name: string;
  quiz_title: string;
  score: number;
  timestamp: string;
}
interface QuizStat {
  quiz_id: number;
  quiz_title: string;
  value: number;
}
interface DashboardData {
  stats: Stat;
  recent_activity: Activity[];
  most_attempted_quizzes: QuizStat[];
  lowest_scoring_quizzes: QuizStat[];
}

export default function AdminDashboardPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/admin/dashboard-data`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data. Are you an admin?');
        }
        const result: DashboardData = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchDashboardData();
  }, [token]);

  if (error) return <div className="text-red-600 text-center">{error}</div>;
  if (!data) return <div className="text-gray-600 text-center">Loading dashboard...</div>;
  
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name}!</h1>
        <p className="text-gray-600">A complete overview of your platform's activity.</p>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Subjects</h3>
          <p className="text-3xl font-bold text-gray-900">{data.stats.subjects}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Chapters</h3>
          <p className="text-3xl font-bold text-gray-900">{data.stats.chapters}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Quizzes</h3>
          <p className="text-3xl font-bold text-gray-900">{data.stats.quizzes}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Questions</h3>
          <p className="text-3xl font-bold text-gray-900">{data.stats.questions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-gray-900">{data.stats.users}</p>
        </div>
      </section>

      {/* Charts and Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
          <ul className="space-y-4 max-h-96 overflow-y-auto">
            {data.recent_activity.map((activity, index) => (
              <li key={index} className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-semibold text-gray-900">{activity.user_name}</span>
                  <span className="text-gray-600"> attempted "{activity.quiz_title}"</span>
                </div>
                <span className="font-bold text-blue-600">{activity.score}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Most Popular Quizzes (by Attempts)</h3>
            <SubjectPerformanceChart 
                data={data.most_attempted_quizzes.map(q => ({ 
                    subject_name: q.quiz_title, 
                    average_score: q.value 
                }))} 
            />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Lowest Scoring Quizzes (by Avg Score)</h3>
            <SubjectPerformanceChart 
                data={data.lowest_scoring_quizzes.map(q => ({ 
                    subject_name: q.quiz_title, 
                    average_score: q.value 
                }))} 
            />
          </div>
        </div>
      </section>
    </div>
  );
}