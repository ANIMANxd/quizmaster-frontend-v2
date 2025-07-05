'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Bar Chart for Subject Performance ---
interface SubjectChartProps {
  data: { subject_name: string; average_score: number }[];
}

export function SubjectPerformanceChart({ data }: SubjectChartProps) {
  return (
    // ResponsiveContainer makes the chart fill its parent container
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={data}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="subject_name" fontSize={12} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="average_score" fill="#0891b2" name="Avg Score" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// --- Line Chart for Performance Trend ---
interface TrendChartProps {
  data: { score: number }[];
}

export function TrendPerformanceChart({ data }: TrendChartProps) {
  // Add a name for each attempt to the data for the X-axis
  const chartData = data.map((item, index) => ({
    name: `Attempt ${index + 1}`,
    score: item.score
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="score" stroke="#0284c7" strokeWidth={2} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}