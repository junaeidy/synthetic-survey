'use client';

import React, { useState } from 'react';
import { Survey, Question } from '@/types/survey';
import { generateBatchResponses, GeneratedRespondent } from '@/lib/gemini';
import { saveSimulationBatch } from '@/lib/storage';
import { Play, Bot, CheckCircle2, Loader2, X } from 'lucide-react';

interface SimulatorModalProps {
  survey: Survey;
  questions: Question[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function SimulatorModal({
  survey,
  questions,
  isOpen,
  onClose,
  onComplete,
}: SimulatorModalProps) {
  const [targetCount, setTargetCount] = useState<number>(survey.target_respondents || 30);
  const [batchSize] = useState<number>(5);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [completed, setCompleted] = useState<boolean>(false);

  if (!isOpen) return null;

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('id-ID');
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 30)]);
  };

  const handleStartSimulation = async () => {
    setIsRunning(true);
    setCompleted(false);
    setCurrentProgress(0);
    setLogs([]);

    addLog(`🚀 Memulai simulasi untuk ${targetCount} bot responden.`);
    addLog(`📅 Waktu rentang simulasi: ${new Date(survey.start_date).toLocaleDateString()} s/d ${new Date(survey.end_date).toLocaleDateString()}`);

    const totalBatches = Math.ceil(targetCount / batchSize);
    let totalGenerated = 0;

    try {
      for (let b = 0; b < totalBatches; b++) {
        const countInThisBatch = Math.min(batchSize, targetCount - totalGenerated);
        addLog(`⚡ Batch ${b + 1}/${totalBatches}: Menghasilkan ${countInThisBatch} persona bot via Gemini...`);

        // Panggil Gemini (atau Fallback Heuristik Cerdas)
        const respondentsBatch: GeneratedRespondent[] = await generateBatchResponses(
          survey,
          questions,
          countInThisBatch
        );

        // Simpan batch ke database (Supabase / Local fallback)
        await saveSimulationBatch(survey.id, respondentsBatch);

        totalGenerated += respondentsBatch.length;
        const pct = Math.round((totalGenerated / targetCount) * 100);
        setCurrentProgress(pct);

        addLog(`✅ Batch ${b + 1} sukses: ${respondentsBatch.length} responden tersimpan.`);

        // Delay 1.5 detik antar batch agar aman dari limit RPM
        if (b < totalBatches - 1) {
          addLog(`⏳ Jeda throttle 1.5 detik untuk stabilitas API...`);
          await new Promise((res) => setTimeout(res, 1500));
        }
      }

      addLog(`🎉 Simulasi tuntas! Seluruh ${totalGenerated} responden berhasil mengisi angket.`);
      setCompleted(true);
      setTimeout(() => {
        onComplete();
      }, 1200);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`❌ Terjadi error selama simulasi: ${errMsg}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        {/* Close Button */}
        {!isRunning && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Jalankan Simulator Responden Bot
            </h2>
            <p className="text-xs text-neutral-500 font-mono">
              Batching persona AI + Distribusi waktu acak
            </p>
          </div>
        </div>

        {/* Configuration controls */}
        {!isRunning && !completed && (
          <div className="space-y-4 py-5">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Target Jumlah Responden ($N$)
              </label>
              <div className="flex items-center gap-2">
                {[20, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTargetCount(num)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                      targetCount === num
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-semibold'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300'
                    }`}
                  >
                    {num} orang
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-8 w-24 rounded-lg border border-neutral-200 bg-neutral-50 px-2 text-xs font-mono text-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-50 dark:bg-neutral-950/60 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
              <div>
                <span className="text-neutral-400 block text-[11px] font-mono">Batch Size (Per Panggilan AI)</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono">5–10 persona / batch</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px] font-mono">Estimasi Durasi</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                  ~{(Math.ceil(targetCount / 5) * 2.5).toFixed(0)} detik (&lt; 5 menit)
                </span>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/40">
              💡 <strong>Catatan Stabilitas:</strong> Bot menggunakan sistem batch persona cerdas agar mematuhi batas gratisan Gemini API (15 RPM). Tanggal pengisian setiap bot akan diacak otomatis dalam jendela rentang waktu kuesioner.
            </div>
          </div>
        )}

        {/* Progress & Live Terminal Log */}
        {(isRunning || completed) && (
          <div className="space-y-4 py-5">
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neutral-500">Progres Pengisian:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{currentProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="h-full bg-neutral-900 transition-all duration-300 dark:bg-neutral-100"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
            </div>

            {/* Console Log Screen */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-950 p-3 text-neutral-200 font-mono text-[11px] h-48 overflow-y-auto space-y-1 shadow-inner">
              {logs.map((log, i) => (
                <div key={i} className="leading-tight text-neutral-300">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          {!isRunning && !completed && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleStartSimulation}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-medium transition-all shadow-sm"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Mulai Simulasi Bot</span>
              </button>
            </>
          )}

          {isRunning && (
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-900 dark:text-neutral-100" />
              <span>Simulasi sedang berjalan...</span>
            </div>
          )}

          {completed && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium transition-all shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Selesai & Buka Analitik</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
