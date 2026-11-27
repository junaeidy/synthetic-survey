'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Calendar, TrendingUp, BarChart2, Layers } from 'lucide-react';

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
  // Default ke 'daily' agar grafik langsung menampilkan fluktuasi naik-turun per hari
  const [viewMode, setViewMode] = useState<'daily' | 'combo' | 'cumulative'>('daily');

  const formatDateLabel = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return isoDate;
    }
  };

  // Cari hari teramai (peak) dan hari tersenggang (lull)
  const { peakDay, lowestDay } = React.useMemo(() => {
    if (!timelineData || timelineData.length === 0) {
      return { peakDay: null, lowestDay: null };
    }
    let peak = timelineData[0];
    let lowest = timelineData[0];
    for (const item of timelineData) {
      if (item.count > peak.count) peak = item;
      if (item.count < lowest.count) lowest = item;
    }
    return { peakDay: peak, lowestDay: lowest };
  }, [timelineData]);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
              Dinamika Waktu Responden
            </span>
            <span className="text-xs font-mono text-neutral-400">
              Rentang Pengisian Angket
            </span>
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <span>
              {viewMode === 'daily'
                ? 'Distribusi Respons Harian'
                : viewMode === 'combo'
                ? 'Respons Harian & Total Akumulasi'
                : 'Total Akumulasi Responden'}
            </span>
          </h3>
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl self-start sm:self-auto border border-neutral-200 dark:border-neutral-700/60">
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              viewMode === 'daily'
                ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Respons Harian</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('combo')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              viewMode === 'combo'
                ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Gabungan</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('cumulative')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              viewMode === 'cumulative'
                ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Akumulasi Total</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-5">
        {/* Main Chart Area */}
        <div className="lg:col-span-3 h-[250px] w-full">
          {timelineData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-neutral-400 font-mono">
              Belum ada data linimasa pengisian
            </div>
          ) : viewMode === 'daily' ? (
            /* Mode 1: Daily Area Wave (Fluktuasi Naik-Turun) */
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
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
                    borderColor: '#383838',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  }}
                  itemStyle={{ color: '#ffffff', fontWeight: 500 }}
                  labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: '2px' }}
                  formatter={(val, name) => [
                    `${String(val)} responden`,
                    name === 'count' ? 'Masuk Hari Ini' : 'Total Kumulatif',
                  ]}
                  labelFormatter={(lbl) => `Tanggal: ${formatDateLabel(String(lbl))}`}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="count"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorDaily)"
                  activeDot={{ r: 5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : viewMode === 'combo' ? (
            /* Mode 2: Combo Bar (Harian) + Garis (Akumulatif) */
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
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
                    borderColor: '#383838',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  }}
                  itemStyle={{ color: '#ffffff', fontWeight: 500 }}
                  labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: '2px' }}
                  formatter={(val, name) => [
                    `${String(val)} responden`,
                    name === 'count' ? 'Masuk Hari Ini (Bar)' : 'Total Kumulatif (Garis)',
                  ]}
                  labelFormatter={(lbl) => `Tanggal: ${formatDateLabel(String(lbl))}`}
                />
                <Bar
                  dataKey="count"
                  name="count"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  name="cumulative"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            /* Mode 3: Cumulative Growth Area */
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
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
                    borderColor: '#383838',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  }}
                  itemStyle={{ color: '#ffffff', fontWeight: 500 }}
                  labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: '2px' }}
                  formatter={(val, name) => [
                    `${String(val)} responden`,
                    name === 'cumulative' ? 'Total Terkumpul' : 'Masuk Hari Ini',
                  ]}
                  labelFormatter={(lbl) => `Tanggal: ${formatDateLabel(String(lbl))}`}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="cumulative"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCumulative)"
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Statistics Sidebar */}
        <div className="flex flex-col justify-center space-y-2.5 lg:border-l border-neutral-100 dark:border-neutral-800 lg:pl-5">
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200/70 dark:border-neutral-800">
            <p className="text-[10px] font-mono uppercase text-neutral-400">Total Terisi</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {totalRespondents}
              </span>
              <span className="text-xs text-neutral-500 font-mono">responden</span>
            </div>
          </div>

          {peakDay && (
            <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50">
              <p className="text-[10px] font-mono uppercase text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                <span>Puncak Teramai</span>
                <span className="font-bold">+{peakDay.count}</span>
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xs font-semibold font-mono text-neutral-900 dark:text-neutral-100">
                  {formatDateLabel(peakDay.date)}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono">
                  ({Math.round((peakDay.count / Math.max(1, totalRespondents)) * 100)}% total)
                </span>
              </div>
            </div>
          )}

          {lowestDay && (
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200/70 dark:border-neutral-800">
              <p className="text-[10px] font-mono uppercase text-neutral-400 flex items-center justify-between">
                <span>Hari Tersenggang</span>
                <span>{lowestDay.count} resp</span>
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xs font-medium font-mono text-neutral-700 dark:text-neutral-300">
                  {formatDateLabel(lowestDay.date)}
                </span>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200/70 dark:border-neutral-800">
            <p className="text-[10px] font-mono uppercase text-neutral-400">Rentang Waktu</p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
              <Calendar className="h-3 w-3 text-neutral-400" />
              <span>{formatDateLabel(startDate)}</span>
              <span>-</span>
              <span>{formatDateLabel(endDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
