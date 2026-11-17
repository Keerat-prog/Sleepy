import React, { useEffect, useState } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { AppView, SoundId } from '../types';

interface ClearMindViewProps {
  activeSounds: SoundId[];
  onStartPreferredAmbient: () => void;
  onNavigate: (view: AppView) => void;
  onBack: () => void;
}

const BREATH_PHASES = [
  { label: 'Breathe in slowly', duration: 4, scale: 1.18 },
  { label: 'Hold gently', duration: 2, scale: 1.18 },
  { label: 'Let the breath fall out', duration: 6, scale: 0.88 },
];

const BODY_CUES = [
  'Let your shoulders drop away from your ears.',
  'Unclench your jaw and soften your tongue.',
  'Notice the weight of your hands resting still.',
  'Allow your forehead to become completely smooth.',
  'There is nothing you need to figure out tonight.',
];

export const ClearMindView: React.FC<ClearMindViewProps> = ({
  activeSounds,
  onStartPreferredAmbient,
  onNavigate,
  onBack,
}) => {
  const [noThoughtMode, setNoThoughtMode] = useState<boolean>(false);
  const [quickRunning, setQuickRunning] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180); // 3 minutes
  const [phaseIdx, setPhaseIdx] = useState<number>(0);
  const [phaseElapsed, setPhaseElapsed] = useState<number>(0);

  // Quick 3-minute relaxation timer
  useEffect(() => {
    if (!quickRunning) return;
    const id = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setQuickRunning(false);
          return 0;
        }
        return prev - 1;
      });

      setPhaseElapsed((el) => {
        const currentPhase = BREATH_PHASES[phaseIdx];
        if (el + 1 >= currentPhase.duration) {
          setPhaseIdx((p) => (p + 1) % BREATH_PHASES.length);
          return 0;
        }
        return el + 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [quickRunning, phaseIdx]);

  const currentPhase = BREATH_PHASES[phaseIdx];
  const cueIdx = Math.floor(((180 - secondsRemaining) / 36) % BODY_CUES.length);

  // Full-screen No-Thought Mode
  if (noThoughtMode) {
    return (
      <div
        onClick={() => setNoThoughtMode(false)}
        className="fixed inset-0 z-50 bg-[#03050c]/85 flex flex-col items-center justify-end p-8 cursor-pointer"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setNoThoughtMode(false);
          }}
          className="px-4 py-2 min-h-[44px] rounded-xl text-xs text-[#69657a] hover:text-[#b4b0c4] transition-colors"
        >
          Leave No-Thought Mode
        </button>
      </div>
    );
  }

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

        <button
          type="button"
          onClick={() => onNavigate('random-thought')}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-xs sm:text-sm text-[#d4cfe0] transition-colors"
        >
          <Sparkles className="w-4 h-4 text-[#c4b8e6]" />
          <span>Open Random Thought Generator</span>
        </button>
      </div>

      <header className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-light text-[#f0ece3]">
          Clear Your Mind
        </h1>
        <p className="text-sm sm:text-base text-[#a29db1] max-w-2xl">
          Take three quiet minutes to slow your breathing, or enter complete
          visual stillness with gentle ambient sound.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 3-Minute Quick Relaxation */}
        <section className="lg:col-span-7 p-7 sm:p-10 rounded-3xl bg-white/[0.025] border border-white/[0.07] flex flex-col justify-between space-y-8 text-center">
          <div className="flex items-center justify-between text-xs text-[#8f8aa0]">
            <span>Quick Relaxation · 3 Minutes</span>
            <span className="font-mono tabular-nums">
              {Math.floor(secondsRemaining / 60)}:
              {String(secondsRemaining % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="py-4 flex flex-col items-center justify-center space-y-8">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div
                className="w-32 h-32 rounded-full bg-[#b8aedc]/12 border border-[#b8aedc]/25 transition-transform duration-1000 ease-in-out flex items-center justify-center"
                style={{
                  transform: `scale(${
                    quickRunning ? currentPhase.scale : 0.96
                  })`,
                }}
              >
                <div className="w-14 h-14 rounded-full bg-[#b8aedc]/15" />
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <h2 className="font-display text-2xl sm:text-3xl font-light text-[#f0ece3]">
                {secondsRemaining === 0
                  ? 'Three minutes complete.'
                  : quickRunning
                  ? currentPhase.label
                  : 'Ready when you are.'}
              </h2>
              <p className="text-sm text-[#a29db1] leading-relaxed">
                {secondsRemaining === 0
                  ? 'Stay still for a few moments before closing your eyes.'
                  : BODY_CUES[cueIdx]}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (secondsRemaining === 0) {
                  setSecondsRemaining(180);
                  setPhaseIdx(0);
                  setPhaseElapsed(0);
                }
                setQuickRunning((r) => !r);
              }}
              className="inline-flex items-center gap-2.5 min-h-[48px] px-6 py-3 rounded-2xl bg-[#b8aedc]/20 hover:bg-[#b8aedc]/30 border border-[#b8aedc]/30 text-sm font-medium text-[#f1edf8] transition-colors"
            >
              {quickRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>
                    {secondsRemaining === 0
                      ? 'Restart 3 Minutes'
                      : 'Start 3-Minute Rest'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setQuickRunning(false);
                setSecondsRemaining(180);
                setPhaseIdx(0);
                setPhaseElapsed(0);
              }}
              aria-label="Reset 3-minute timer"
              className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#b4b0c2] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* No-Thought Mode & Object Thinking Shortcuts */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="flex-1 p-7 rounded-3xl bg-white/[0.025] border border-white/[0.07] flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="text-xs text-[#8f8aa0] block">
                Minimalist Sanctuary
              </span>
              <h2 className="font-display text-2xl font-light text-[#f0ece3]">
                No-Thought Mode
              </h2>
              <p className="text-sm text-[#9e99ad] leading-relaxed">
                Removes every instruction, button, and word from your screen.
                Leaves only soft darkness and your chosen ambient sound.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (activeSounds.length === 0) {
                  onStartPreferredAmbient();
                }
                setNoThoughtMode(true);
              }}
              className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.09] text-sm font-medium text-[#e9e4da] transition-colors"
            >
              Enter No-Thought Mode
            </button>
          </section>

          <section className="flex-1 p-7 rounded-3xl bg-white/[0.025] border border-white/[0.07] flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="text-xs text-[#8f8aa0] block">
                Interrupt Overthinking
              </span>
              <h2 className="font-display text-2xl font-light text-[#f0ece3]">
                Random Object Thinking
              </h2>
              <p className="text-sm text-[#9e99ad] leading-relaxed">
                Replace circling thoughts with neutral, unrelated objects,
                animals, places, or soft colors that slow down automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('random-thought')}
              className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#b8aedc]/16 hover:bg-[#b8aedc]/25 border border-[#b8aedc]/25 text-sm font-medium text-[#efeaf8] transition-colors"
            >
              Begin Random Thought Flow
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
