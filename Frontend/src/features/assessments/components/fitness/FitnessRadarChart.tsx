import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export interface RadarDataPoint {
  dimension: string;
  score: number;
  benchmark?: number;
  fullMark?: number;
}

interface FitnessRadarChartProps {
  data: RadarDataPoint[];
  height?: number;
  showBenchmark?: boolean;
}

export const FitnessRadarChart: React.FC<FitnessRadarChartProps> = ({
  data,
  height = 300,
  showBenchmark = false,
}) => {
  return (
    <div style={{ width: '100%', height }} className="relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#1E293B" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#F8FAFC', fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#94A3B8', fontSize: 9 }}
          />

          <Radar
            name="Điểm số học viên"
            dataKey="score"
            stroke="#00E5FF"
            fill="#00E5FF"
            fillOpacity={0.35}
            strokeWidth={2}
          />

          {showBenchmark && (
            <Radar
              name="Mức tiêu chuẩn"
              dataKey="benchmark"
              stroke="#38BDF8"
              fill="#38BDF8"
              fillOpacity={0.15}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          )}

          <Tooltip
            contentStyle={{
              backgroundColor: '#131B2E',
              borderRadius: '12px',
              border: '1px solid #1E293B',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              fontSize: '11px',
              fontWeight: 600,
              color: '#F8FAFC',
            }}
            itemStyle={{ color: '#00E5FF' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
