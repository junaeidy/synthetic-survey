'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';

interface TimelineChartProps {
  timelineData: { date: string; count: number; cumulative: number }[];
  startDate: string;
  endDate: string;
  totalRespondents: number;
}

export default function TimelineChart({
  timelineData,
  startDate,
  endDate,
  totalRespondents,
}: TimelineChartProps) {
  const formatDateLabel = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
              Simulasi Temporal
            </span>
            <span className="text-xs font-mono text-neutral-400">
              Rentang Pengisian Angket
            </span>
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-neutral-500" />
            Distribusi Waktu Responden Bot (Kumulatif & Harian)
          </h3>
        </div>

        {/* Date span pills */}
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
          <span>{formatDateLabel(startDate)}</span>
          <span className="text-neutral-300 dark:text-neutral-700">→</span>
          <span>{formatDateLabel(endDate)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-5">
        {/* Main Area Chart */}
        <div className="lg:col-span-3 h-[240px] w-full">
          {timelineData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-neutral-400 font-mono">
              Belum ada data linimasa pengisian
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" opacity={0.15} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  tick={{ fontSize: 11, fill: '#737373' }}
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
                  formatter={(val, name) => [
                    `${String(val)} responden`,
                    name === 'cumulative' ? 'Total Terkumpul' : 'Masuk Hari Ini',
                  ]}
                  labelFormatter={(lbl) => `Tanggal: ${formatDateLabel(String(lbl))}`}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCumulative)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Statistics Sidebar */}
        <div className="flex flex-col justify-center space-y-3 lg:border-l border-neutral-100 dark:border-neutral-800 lg:pl-5">
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200/70 dark:border-neutral-800">
            <p className="text-[11px] font-mono uppercase text-neutral-400">Total Terisi</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {totalRespondents}
              </span>
              <span className="text-xs text-neutral-500 font-mono">responden</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200/70 dark:border-neutral-800">
            <p className="text-[11px] font-mono uppercase text-neutral-400">Rentang Waktu</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {timelineData.length || 7}
              </span>
              <span className="text-xs text-neutral-500 font-mono">hari sebaran</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200/70 dark:border-neutral-800">
            <p className="text-[11px] font-mono uppercase text-neutral-400">Rata-rata Harian</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {timelineData.length > 0 ? (totalRespondents / timelineData.length).toFixed(1) : '0'}
              </span>
              <span className="text-xs text-neutral-500 font-mono">respons / hari</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
