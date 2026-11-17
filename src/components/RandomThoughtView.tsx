import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sleepAudio } from '../audio/sleepAudioEngine';
import { THOUGHT_ITEMS } from '../data/thoughtItems';
import { ThoughtItem, ThoughtMode, UserPreferences } from '../types';
import { ThoughtIllustration } from './ThoughtIllustration';

interface RandomThoughtViewProps {
  prefs: UserPreferences;
  onUpdatePrefs: (updater: Partial<UserPreferences>) => void;
  onBack: () => void;
}

const MODES: Array<{ id: ThoughtMode; label: string; subtitle: string }> = [
  { id: 'objects', label: 'Random Objects', subtitle: 'Everyday items' },
  { id: 'animals', label: 'Random Animals', subtitle: 'Calm creatures' },
  { id: 'places', label: 'Random Places', subtitle: 'Quiet settings' },
  { id: 'colors', label: 'Random Colors', subtitle: 'Soft shades' },
  { id: 'mixed', label: 'Random Categories', subtitle: 'Unrelated mix' },
];

export const RandomThoughtView: React.FC<RandomThoughtViewProps> = ({
  prefs,
  onUpdatePrefs,
  onBack,
}) => {
  const [mode, setMode] = useState<ThoughtMode>('objects');
  const [autoMode, setAutoMode] = useState<boolean>(true);
  const [hideIllustrations, setHideIllustrations] = useState<boolean>(false);
  const [speakName, setSpeakName] = useState<boolean>(false);
  const [stepCount, setStepCount] = useState<number>(0);

  const pool = useMemo(() => {
    if (mode === 'mixed') return THOUGHT_ITEMS;
    return THOUGHT_ITEMS.filter((item) => item.category === mode);
  }, [mode]);

  const [currentItem, setCurrentItem] = useState<ThoughtItem>(() => pool[0]);
  const [visible, setVisible] = useState<boolean>(true);

  const pickNextItem = useCallback(
    (sourcePool: ThoughtItem[], currentId?: string): ThoughtItem => {
      if (sourcePool.length <= 1) return sourcePool[0];
      // In mixed mode, prefer switching to a different category than the current one
      const currentCategory = sourcePool.find((i) => i.id === currentId)?.category;
      const filtered =
        mode === 'mixed' && currentCategory
          ? sourcePool.filter((i) => i.category !== currentCategory)
          : sourcePool.filter((i) => i.id !== currentId);
      const candidates = filtered.length > 0 ? filtered : sourcePool;
      return candidates[Math.floor(Math.random() * candidates.length)];
    },
    [mode]
  );

  const advanceThought = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => {
      setCurrentItem((prev) => {
        const next = pickNextItem(pool, prev?.id);
        if (speakName) {
          sleepAudio.speakSinglePhrase(next.label, {
            voiceURI: prefs.narrationVoiceURI,
            speed: 'extra-slow',
            volume: prefs.narrationVolume,
          });
        }
        return next;
      });
      setStepCount((c) => c + 1);
      setVisible(true);
    }, 320);
  }, [pickNextItem, pool, speakName, prefs.narrationVoiceURI, prefs.narrationVolume]);

  // Reset item cleanly when switching modes
  useEffect(() => {
    const next = pickNextItem(pool);
    setCurrentItem(next);
    setStepCount(0);
    setVisible(true);
  }, [mode, pool, pickNextItem]);

  // Effective transition interval (gradually slows down as steps increase)
  const effectiveIntervalSec = useMemo(() => {
    const base = prefs.randomObjectIntervalSec;
    if (!prefs.randomObjectSlowdown) return base;
    // Slowly lengthens by +1.2s per transition up to 24s max
    return Math.min(24, Math.round((base + stepCount * 1.2) * 10) / 10);
  }, [prefs.randomObjectIntervalSec, prefs.randomObjectSlowdown, stepCount]);

  useEffect(() => {
    if (!autoMode) return;
    const id = window.setTimeout(() => {
      advanceThought();
    }, effectiveIntervalSec * 1000);
    return () => window.clearTimeout(id);
  }, [autoMode, effectiveIntervalSec, stepCount, advanceThought]);

  useEffect(() => {
    return () => {
      sleepAudio.stopNarration();
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-28 md:pb-16 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 -ml-3 rounded-xl text-sm text-[#a6a2b5] hover:text-[#ece8e0] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sanctuary</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setHideIllustrations((v) => !v)}
            className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-[#c7c2d6] hover:text-white transition-colors"
          >
            {hideIllustrations ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            <span>
              {hideIllustrations ? 'Show Illustrations' : 'Imagination Only'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSpeakName((v) => !v)}
            className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-xl border text-xs transition-colors ${
              speakName
                ? 'bg-[#b8aedc]/20 border-[#b8aedc]/35 text-[#efeaf8]'
                : 'bg-white/[0.03] border-white/[0.08] text-[#c7c2d6] hover:text-white'
            }`}
          >
            {speakName ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>Voice Name: {speakName ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>

      <header className="space-y-3">
        <h1 className="font-display text-3xl sm:text-4xl font-light text-[#f0ece3]">
          Random Thought Generator
        </h1>
        <p className="text-sm sm:text-base text-[#a8a3b8] max-w-2xl leading-relaxed">
          Imagine this object for a few seconds. Notice its shape, color and
          appearance. When you&apos;re ready, move to the next object. There is
          nothing to solve and nowhere to go.
        </p>
      </header>

      {/* 5 Thinking Modes */}
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`px-4 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#b8aedc]/20 text-[#f1edf9] border border-[#b8aedc]/35'
                  : 'bg-white/[0.03] text-[#9b97aa] border border-white/[0.06] hover:text-[#e4e0ec]'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Central Thought Canvas */}
      <section className="p-8 sm:p-14 rounded-3xl bg-white/[0.025] border border-white/[0.07] text-center space-y-8">
        <div
          onClick={advanceThought}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              advanceThought();
            }
          }}
          aria-label="Advance to next random thought"
          className={`cursor-pointer select-none space-y-6 transition-all duration-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          {!hideIllustrations && <ThoughtIllustration item={currentItem} />}

          <div className="space-y-3 max-w-lg mx-auto">
            <span className="text-xs text-[#8a869c] capitalize block">
              {currentItem.category}
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-light text-[#f2eee6]">
              {currentItem.label}
            </h2>
            <p className="text-sm sm:text-base text-[#a6a1b5] leading-relaxed">
              {currentItem.detail}
            </p>
          </div>
        </div>

        {/* Manual + Automatic Pace Controls */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={advanceThought}
              className="inline-flex items-center gap-2 min-h-[46px] px-5 py-2.5 rounded-xl bg-[#b8aedc]/20 hover:bg-[#b8aedc]/30 border border-[#b8aedc]/30 text-sm font-medium text-[#f1edf8] transition-colors"
            >
              <span>Next Thought</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setAutoMode((v) => !v)}
              className="inline-flex items-center gap-2 min-h-[46px] px-4 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-xs sm:text-sm text-[#cfcadd] transition-colors"
            >
              {autoMode ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Auto-Advance On ({effectiveIntervalSec}s)</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Auto-Advance Paused</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#9691a6]">
            <label className="inline-flex items-center gap-2 cursor-pointer min-h-[40px]">
              <input
                type="checkbox"
                checked={prefs.randomObjectSlowdown}
                onChange={(e) =>
                  onUpdatePrefs({ randomObjectSlowdown: e.target.checked })
                }
                className="accent-[#b8aedc] w-4 h-4 rounded"
              />
              <span>Gradually slow down transitions</span>
            </label>

            <div className="flex items-center gap-2">
              <span>Base pace</span>
              <input
                type="range"
                min={5}
                max={10}
                value={prefs.randomObjectIntervalSec}
                onChange={(e) =>
                  onUpdatePrefs({
                    randomObjectIntervalSec: Number(e.target.value),
                  })
                }
                aria-label="Random object transition interval in seconds"
                className="sleep-slider w-24"
              />
              <span className="font-mono tabular-nums w-6">
                {prefs.randomObjectIntervalSec}s
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
