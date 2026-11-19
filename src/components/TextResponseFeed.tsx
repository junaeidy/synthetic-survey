'use client';

import React, { useState } from 'react';
import { Question } from '@/types/survey';
import { Search, MessageSquare, User, Calendar } from 'lucide-react';

interface TextResponseFeedProps {
  question: Question;
  responses?: {
    text: string;
    persona: string;
    sentiment: string;
    date: string;
  }[];
}

export default function TextResponseFeed({
  question,
  responses = [],
}: TextResponseFeedProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');

  const filtered = responses.filter((r) => {
    const matchesSearch =
      r.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.persona.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSentiment = sentimentFilter === 'all' || r.sentiment === sentimentFilter;
    return matchesSearch && matchesSentiment;
  });

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Positif
          </span>
        );
      case 'negative':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            Kritis / Negatif
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            Netral
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              Isian Bebas (Kualitatif)
            </span>
            <span className="text-xs font-mono text-neutral-400">
              {responses.length} tanggapan teks
            </span>
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-neutral-500" />
            {question.question_text}
          </h3>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sentiment Filter Tabs */}
          <div className="flex items-center p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs">
            <button
              onClick={() => setSentimentFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                sentimentFilter === 'all'
                  ? 'bg-white font-medium text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSentimentFilter('positive')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                sentimentFilter === 'positive'
                  ? 'bg-white font-medium text-emerald-600 shadow-sm dark:bg-neutral-800 dark:text-emerald-400'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Positif
            </button>
            <button
              onClick={() => setSentimentFilter('neutral')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                sentimentFilter === 'neutral'
                  ? 'bg-white font-medium text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Netral
            </button>
            <button
              onClick={() => setSentimentFilter('negative')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                sentimentFilter === 'negative'
                  ? 'bg-white font-medium text-rose-600 shadow-sm dark:bg-neutral-800 dark:text-rose-400'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Kritis
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari respon / persona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-44 sm:w-56 rounded-lg border border-neutral-200 bg-neutral-50 pl-8 pr-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:bg-neutral-900"
            />
          </div>
        </div>
      </div>

      {/* Feed list */}
      <div className="pt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400 font-mono">
            Tidak ada tanggapan yang cocok dengan filter pencarian
          </div>
        ) : (
          filtered.map((item, idx) => (
            <div
              key={idx}
              className="group rounded-lg border border-neutral-100 bg-neutral-50/70 p-3.5 transition-all hover:border-neutral-300 dark:border-neutral-800/80 dark:bg-neutral-950/40 dark:hover:border-neutral-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                    <User className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    {item.persona}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getSentimentBadge(item.sentiment)}
                  <span className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 pl-7">
                “{item.text}”
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
