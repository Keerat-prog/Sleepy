import React, { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { SleepJournalEntry } from '../types';

interface SleepJournalViewProps {
  entries: SleepJournalEntry[];
  sleepStreak: number;
  onAddEntry: (entry: Omit<SleepJournalEntry, 'id'>) => void;
  onDeleteEntry: (id: string) => void;
  onBack: () => void;
}

function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const SleepJournalView: React.FC<SleepJournalViewProps> = ({
  entries,
  sleepStreak,
  onAddEntry,
  onDeleteEntry,
  onBack,
}) => {
  const [dateISO, setDateISO] = useState<string>(getTodayISO);
  const [bedtime, setBedtime] = useState<string>('23:15');
  const [minutesToFallAsleep, setMinutesToFallAsleep] = useState<number>(20);
  const [relaxationRating, setRelaxationRating] = useState<1 | 2 | 3 | 4 | 5>(
    4
  );
  const [sleepQualityRating, setSleepQualityRating] = useState<
    1 | 2 | 3 | 4 | 5
  >(4);
  const [notes, setNotes] = useState<string>('');
  const [savedBanner, setSavedBanner] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEntry({
      dateISO,
      bedtime,
      minutesToFallAsleep,
      relaxationRating,
      sleepQualityRating,
      notes: notes.trim(),
    });
    setNotes('');
    setSavedBanner(true);
    window.setTimeout(() => setSavedBanner(false), 3000);
  };

  const ratings: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-28 md:pb-16 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 -ml-3 rounded-xl text-sm text-[#a6a2b5] hover:text-[#ece8e0] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sanctuary</span>
        </button>

        <div className="text-xs sm:text-sm text-[#a8a3b8] tabular-nums">
          <span>
            Routine Streak: {sleepStreak}{' '}
            {sleepStreak === 1 ? 'night' : 'nights'}
          </span>
          <span aria-hidden="true"> · </span>
          <span>{entries.length} logged</span>
        </div>
      </div>

      <header className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-light text-[#f0ece3]">
          Sleep Journal
        </h1>
        <p className="text-sm sm:text-base text-[#a29db1] max-w-2xl">
          Gently observe your nighttime rhythm without pressure or judgement.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Log Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-white/[0.025] border border-white/[0.07] space-y-5"
        >
          <h2 className="font-display text-xl text-[#ece7dd]">
            Record Tonight or Last Night
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="journal-date" className="text-xs text-[#8f8aa0] block">
                Night Date
              </label>
              <input
                id="journal-date"
                type="date"
                value={dateISO}
                onChange={(e) => setDateISO(e.target.value)}
                required
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#0c1120] border border-white/[0.08] text-sm text-[#e6e2da] focus:outline-none focus:ring-2 focus:ring-[#b8aedc]/50"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="journal-bedtime" className="text-xs text-[#8f8aa0] block">
                Bedtime
              </label>
              <input
                id="journal-bedtime"
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                required
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#0c1120] border border-white/[0.08] text-sm text-[#e6e2da] focus:outline-none focus:ring-2 focus:ring-[#b8aedc]/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8f8aa0]">
              <span>Estimated Time to Fall Asleep</span>
              <span className="font-mono tabular-nums text-[#cfc7e6]">
                {minutesToFallAsleep} min
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={minutesToFallAsleep}
              onChange={(e) => setMinutesToFallAsleep(Number(e.target.value))}
              aria-label="Minutes to fall asleep"
              className="sleep-slider w-full"
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs text-[#8f8aa0] block">
              How Relaxed You Felt (1 = tense, 5 = deeply calm)
            </span>
            <div className="grid grid-cols-5 gap-2">
              {ratings.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRelaxationRating(val)}
                  className={`min-h-[40px] rounded-xl text-xs font-mono transition-colors ${
                    relaxationRating === val
                      ? 'bg-[#b8aedc]/22 text-[#f1edf9] border border-[#b8aedc]/35'
                      : 'bg-white/[0.03] text-[#9b97aa] border border-white/[0.06] hover:text-white'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-[#8f8aa0] block">
              Overall Sleep Quality (1 = restless, 5 = restful)
            </span>
            <div className="grid grid-cols-5 gap-2">
              {ratings.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSleepQualityRating(val)}
                  className={`min-h-[40px] rounded-xl text-xs font-mono transition-colors ${
                    sleepQualityRating === val
                      ? 'bg-[#b8aedc]/22 text-[#f1edf9] border border-[#b8aedc]/35'
                      : 'bg-white/[0.03] text-[#9b97aa] border border-white/[0.06] hover:text-white'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="journal-notes" className="text-xs text-[#8f8aa0] block">
              Quiet Reflection (optional)
            </label>
            <textarea
              id="journal-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What helped your mind settle tonight?"
              className="w-full px-3 py-2.5 rounded-xl bg-[#0c1120] border border-white/[0.08] text-sm text-[#e6e2da] placeholder:text-[#666278] focus:outline-none focus:ring-2 focus:ring-[#b8aedc]/50"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#b8aedc]/20 hover:bg-[#b8aedc]/30 border border-[#b8aedc]/30 text-sm font-medium text-[#f1edf8] transition-colors"
          >
            {savedBanner ? 'Entry Saved Gently' : 'Save Sleep Entry'}
          </button>
        </form>

        {/* Entries List */}
        <div className="lg:col-span-7 space-y-4">
          {entries.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
              <p className="font-display text-xl text-[#dcd6ca]">
                No entries recorded yet.
              </p>
              <p className="text-sm text-[#8d899c]">
                Logging each night quietly builds your personal sleep streak.
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="p-5 sm:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06] flex items-start justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#9c97ad] tabular-nums">
                    <span className="text-[#e6e1d7] font-medium">
                      {entry.dateISO}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Bedtime {entry.bedtime}</span>
                    <span aria-hidden="true">·</span>
                    <span>~{entry.minutesToFallAsleep} min to sleep</span>
                  </div>

                  <div className="text-xs text-[#8d899c] tabular-nums">
                    <span>Relaxation {entry.relaxationRating}/5</span>
                    <span aria-hidden="true"> · </span>
                    <span>Sleep quality {entry.sleepQualityRating}/5</span>
                  </div>

                  {entry.notes && (
                    <p className="text-sm text-[#c7c2d4] pt-1 leading-relaxed">
                      {entry.notes}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteEntry(entry.id)}
                  aria-label="Delete sleep entry"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#7c788d] hover:text-[#d8c7c7] hover:bg-white/[0.04] transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
