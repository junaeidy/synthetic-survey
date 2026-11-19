'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { ChartType, Question } from '@/types/survey';
import { BarChart3, PieChart as PieIcon, AlignLeft } from 'lucide-react';

interface QuestionChartProps {
  question: Question;
  distribution: { name: string; count: number; percentage: number }[];
  initialChartType?: ChartType;
}

// Anti-slop disciplined color palette (distinct, high-contrast, professional data tones)
const PALETTE = [
  '#2563eb', // Blue 600
  '#059669', // Emerald 600
  '#d97706', // Amber 600
  '#7c3aed', // Violet 600
  '#db2777', // Pink 600
  '#475569', // Slate 600
  '#0891b2', // Cyan 600
  '#ea580c', // Orange 600
];

export default function QuestionChart({
  question,
  distribution,
  initialChartType = 'bar_vertical',
}: QuestionChartProps) {
  const [chartType, setChartType] = useState<ChartType>(initialChartType);

  const totalResponses = distribution.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
      {/* Question Header & Chart Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              {question.question_type === 'multiple_choice' ? 'Pilihan Ganda' : 'Benar / Salah'}
            </span>
            <span className="text-xs font-mono text-neutral-400">
              {totalResponses} respons
            </span>
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {question.question_text}
          </h3>
        </div>

        {/* Chart Selector Buttons */}
        <div className="flex items-center self-start sm:self-auto p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <button
            onClick={() => setChartType('bar_vertical')}
            title="Diagram Batang Vertikal"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              chartType === 'bar_vertical'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Batang</span>
          </button>

          <button
            onClick={() => setChartType('bar_horizontal')}
            title="Diagram Batang Horizontal"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              chartType === 'bar_horizontal'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <AlignLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Horizontal</span>
          </button>

          <button
            onClick={() => setChartType('donut')}
            title="Diagram Donat"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              chartType === 'donut'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <PieIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Donat</span>
          </button>

          <button
            onClick={() => setChartType('pie')}
            title="Diagram Lingkaran (Pie)"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              chartType === 'pie'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <PieIcon className="h-3.5 w-3.5 rotate-45" />
            <span className="hidden sm:inline">Pie</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas & Data Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5 items-center">
        {/* Visual Chart */}
        <div className="lg:col-span-2 h-[260px] w-full">
          {distribution.length === 0 || totalResponses === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-neutral-400 font-mono">
              Belum ada data responden untuk pertanyaan ini
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar_vertical' ? (
                <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#737373' }}
                    interval={0}
                    tickFormatter={(val) => (val.length > 14 ? `${val.slice(0, 14)}...` : val)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#737373' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: '#262626',
                      borderRadius: '8px',
                      color: '#fafafa',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${String(value)} suara`, 'Jumlah']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : chartType === 'bar_horizontal' ? (
                <BarChart
                  data={distribution}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#737373' }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    tickFormatter={(val) => (val.length > 12 ? `${val.slice(0, 12)}...` : val)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: '#262626',
                      borderRadius: '8px',
                      color: '#fafafa',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${String(value)} suara`, 'Jumlah']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {distribution.map((_, index) => (
                      <Cell key={`cell-h-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={distribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={chartType === 'donut' ? 60 : 0}
                    outerRadius={95}
                    paddingAngle={chartType === 'donut' ? 3 : 0}
                  >
                    {distribution.map((_, index) => (
                      <Cell key={`cell-pie-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: '#262626',
                      borderRadius: '8px',
                      color: '#fafafa',
                      fontSize: '12px',
                    }}
                    formatter={(value, name) => [
                      `${String(value)} suara (${totalResponses > 0 ? Math.round((Number(value) / totalResponses) * 100) : 0}%)`,
                      String(name),
                    ]}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend & Breakdown Table */}
        <div className="space-y-2 border-t lg:border-t-0 lg:border-l border-neutral-100 dark:border-neutral-800 lg:pl-5 pt-3 lg:pt-0">
          <p className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider">Distribusi Pilihan</p>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {distribution.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800/80"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                  />
                  <span className="truncate text-neutral-800 dark:text-neutral-200" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono shrink-0">
                  <span className="text-neutral-500">{item.count}</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-200/60 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[11px]">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
