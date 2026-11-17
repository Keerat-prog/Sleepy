import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { sleepAudio } from '../audio/sleepAudioEngine';
import { UserPreferences } from '../types';

interface EyeRelaxationViewProps {
  prefs: UserPreferences;
  onBack: () => void;
}

type ExerciseId = 'closing' | 'blinking' | 'darkness' | 'rest';

interface ExerciseStep {
  instruction: string;
  subtext: string;
  durationSec: number;
  eyeState: 'closed' | 'open' | 'blinking' | 'soft-dark';
}

interface EyeExercise {
  id: ExerciseId;
  code: string;
  title: string;
  summary: string;
  steps: ExerciseStep[];
}

const EYE_EXERCISES: EyeExercise[] = [
  {
    id: 'closing',
    code: 'A',
    title: 'Gentle Eye Closing',
    summary: 'Slowly close your eyes for 10 seconds, open gently, repeat 3 times.',
    steps: [
      {
        instruction: 'Slowly close your eyes.',
        subtext: 'Keep them comfortably closed without squeezing.',
        durationSec: 10,
        eyeState: 'closed',
      },
      {
        instruction: 'Open your eyes gently.',
        subtext: 'Let your gaze rest softly without focusing sharply.',
        durationSec: 5,
        eyeState: 'open',
      },
      {
        instruction: 'Slowly close your eyes again.',
        subtext: 'Release any tension behind your eyelids.',
        durationSec: 10,
        eyeState: 'closed',
      },
      {
        instruction: 'Open your eyes gently.',
        subtext: 'Take one slow, unhurried breath.',
        durationSec: 5,
        eyeState: 'open',
      },
      {
        instruction: 'Close your eyes one final time.',
        subtext: 'Notice how heavy and warm your eyelids feel.',
        durationSec: 10,
        eyeState: 'closed',
      },
      {
        instruction: 'Open softly, or keep them closed.',
        subtext: 'Gentle eye closing complete.',
        durationSec: 4,
        eyeState: 'open',
      },
    ],
  },
  {
    id: 'blinking',
    code: 'B',
    title: 'Slow Blinking',
    summary: 'Slowly blink your eyes for 20 seconds without forcing or straining.',
    steps: [
      {
        instruction: 'Blink very slowly and lightly.',
        subtext: 'Avoid forcing or straining your eyelids. Let each blink feel soft.',
        durationSec: 20,
        eyeState: 'blinking',
      },
      {
        instruction: 'Let your eyes settle.',
        subtext: 'Allow your eyelids to rest naturally.',
        durationSec: 5,
        eyeState: 'closed',
      },
    ],
  },
  {
    id: 'darkness',
    code: 'C',
    title: 'Darkness Relaxation',
    summary: 'Close your eyes comfortably and rest in darkness for 1 minute.',
    steps: [
      {
        instruction: 'Close your eyes comfortably.',
        subtext: 'Notice the quiet darkness behind your eyelids. Let your eye muscles soften.',
        durationSec: 60,
        eyeState: 'soft-dark',
      },
    ],
  },
  {
    id: 'rest',
    code: 'D',
    title: 'Eye & Facial Rest',
    summary: 'Look away from screens, close your eyes, and soften your forehead.',
    steps: [
      {
        instruction: 'Look gently away from the screen.',
        subtext: 'Let your gaze drift into the dark room.',
        durationSec: 10,
        eyeState: 'open',
      },
      {
        instruction: 'Close your eyes softly.',
        subtext: 'Relax your forehead, temples, and the muscles around your jaw.',
        durationSec: 35,
        eyeState: 'soft-dark',
      },
    ],
  },
];

export const EyeRelaxationView: React.FC<EyeRelaxationViewProps> = ({
  prefs,
  onBack,
}) => {
  const [selectedId, setSelectedId] = useState<ExerciseId>('closing');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(
    EYE_EXERCISES[0].steps[0].durationSec
  );
  const [voiceGuidance, setVoiceGuidance] = useState<boolean>(true);
  const [completed, setCompleted] = useState<boolean>(false);
  const [blinkClosed, setBlinkClosed] = useState<boolean>(false);

  const exercise = useMemo(
    () => EYE_EXERCISES.find((e) => e.id === selectedId) || EYE_EXERCISES[0],
    [selectedId]
  );

  const currentStep = exercise.steps[stepIndex] || exercise.steps[0];

  const totalDuration = useMemo(
    () => exercise.steps.reduce((acc, s) => acc + s.durationSec, 0),
    [exercise]
  );

  const elapsedDuration = useMemo(() => {
    const prior = exercise.steps
      .slice(0, stepIndex)
      .reduce((acc, s) => acc + s.durationSec, 0);
    return prior + (currentStep.durationSec - secondsLeft);
  }, [exercise, stepIndex, currentStep, secondsLeft]);

  const progressPct = Math.min(
    100,
    Math.round((elapsedDuration / Math.max(1, totalDuration)) * 100)
  );

  // Switch exercise
  const handleSelectExercise = (id: ExerciseId) => {
    const next = EYE_EXERCISES.find((e) => e.id === id) || EYE_EXERCISES[0];
    setSelectedId(id);
    setIsRunning(false);
    setCompleted(false);
    setStepIndex(0);
    setSecondsLeft(next.steps[0].durationSec);
  };

  // Slow blinking visual pulse
  useEffect(() => {
    if (!isRunning || currentStep.eyeState !== 'blinking') {
      setBlinkClosed(false);
      return;
    }
    const id = window.setInterval(() => {
      setBlinkClosed((prev) => !prev);
    }, 2200);
    return () => window.clearInterval(id);
  }, [isRunning, currentStep.eyeState]);

  // Speak cue on step start
  useEffect(() => {
    if (!isRunning || completed) return;
    if (voiceGuidance) {
      sleepAudio.speakSinglePhrase(
        `${currentStep.instruction} ${currentStep.subtext}`,
        {
          voiceURI: prefs.narrationVoiceURI,
          speed: 'slow',
          volume: prefs.narrationVolume,
        }
      );
    } else {
      sleepAudio.playGentleChime(340);
    }
  }, [isRunning, stepIndex, selectedId, completed, voiceGuidance, currentStep, prefs.narrationVoiceURI, prefs.narrationVolume]);

  // Countdown timer
  useEffect(() => {
    if (!isRunning || completed) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Advance to next step
        if (stepIndex < exercise.steps.length - 1) {
          const nextIdx = stepIndex + 1;
          setStepIndex(nextIdx);
          return exercise.steps[nextIdx].durationSec;
        } else {
          setIsRunning(false);
          setCompleted(true);
          sleepAudio.playGentleChime(288);
          return 0;
        }
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [isRunning, completed, stepIndex, exercise]);

  useEffect(() => {
    return () => {
      sleepAudio.stopNarration();
    };
  }, []);

  const handleToggleRun = () => {
    if (completed) {
      setCompleted(false);
      setStepIndex(0);
      setSecondsLeft(exercise.steps[0].durationSec);
      setIsRunning(true);
      return;
    }
    setIsRunning((r) => !r);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCompleted(false);
    setStepIndex(0);
    setSecondsLeft(exercise.steps[0].durationSec);
    sleepAudio.stopNarration();
  };

  const isEyelidClosed =
    currentStep.eyeState === 'closed' ||
    currentStep.eyeState === 'soft-dark' ||
    (currentStep.eyeState === 'blinking' && blinkClosed);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-28 md:pb-16 space-y-8">
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
          onClick={() => setVoiceGuidance((v) => !v)}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs sm:text-sm text-[#c7c2d6] hover:text-white transition-colors"
        >
          {voiceGuidance ? (
            <Volume2 className="w-4 h-4 text-[#c4b8e6]" />
          ) : (
            <VolumeX className="w-4 h-4 text-[#8c889b]" />
          )}
          <span>Voice Guidance: {voiceGuidance ? 'On' : 'Chime Only'}</span>
        </button>
      </div>

      <header className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-light text-[#f0ece3]">
          Relax Your Eyes
        </h1>
        <p className="text-sm sm:text-base text-[#a29db1] max-w-2xl">
          Release screen tension softly. No staring, no pressure, and no strain.
        </p>
      </header>

      {/* Exercise Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {EYE_EXERCISES.map((ex) => {
          const active = ex.id === selectedId;
          return (
            <button
              key={ex.id}
              type="button"
              onClick={() => handleSelectExercise(ex.id)}
              className={`text-left p-4 rounded-2xl border transition-colors ${
                active
                  ? 'bg-[#b8aedc]/15 border-[#b8aedc]/35 text-[#f0ecf8]'
                  : 'bg-white/[0.025] border-white/[0.06] text-[#a5a0b3] hover:bg-white/[0.045]'
              }`}
            >
              <span className="text-xs text-[#88849a] block">
                Exercise {ex.code}
              </span>
              <span className="font-display text-base block mt-1 text-[#ece7dd]">
                {ex.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Visual Guidance Surface */}
      <section className="p-8 sm:p-12 rounded-3xl bg-white/[0.025] border border-white/[0.07] text-center space-y-8">
        {/* Soft Eyelid / Darkness Animation */}
        <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full transition-all duration-1000"
            style={{
              background: isEyelidClosed
                ? 'radial-gradient(circle, rgba(16,18,32,0.95) 0%, rgba(10,12,24,0.2) 70%, transparent 100%)'
                : 'radial-gradient(circle, rgba(184,174,220,0.14) 0%, rgba(184,174,220,0.03) 65%, transparent 100%)',
            }}
          />

          <svg viewBox="0 0 160 120" className="w-40 h-32 relative z-10" aria-hidden="true">
            {/* Upper lid arch */}
            <path
              d={
                isEyelidClosed
                  ? 'M 25 60 Q 80 76 135 60'
                  : 'M 25 60 Q 80 24 135 60'
              }
              fill="none"
              stroke="#c4b8e6"
              strokeWidth="2"
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            {/* Lower lid curve */}
            <path
              d={
                isEyelidClosed
                  ? 'M 25 60 Q 80 76 135 60'
                  : 'M 25 60 Q 80 90 135 60'
              }
              fill="none"
              stroke="#8b84a6"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeOpacity="0.65"
              className="transition-all duration-1000"
            />
            {/* Soft iris outline only when open */}
            <circle
              cx="80"
              cy="60"
              r="11"
              fill="rgba(184,174,220,0.08)"
              stroke="#c4b8e6"
              strokeWidth="1.3"
              className="transition-opacity duration-700"
              style={{ opacity: isEyelidClosed ? 0 : 0.7 }}
            />
          </svg>
        </div>

        {/* Instruction & Countdown */}
        <div className="space-y-3 max-w-lg mx-auto">
          {completed ? (
            <>
              <h2 className="font-display text-2xl sm:text-3xl font-light text-[#f0ece3]">
                Your eyes are rested.
              </h2>
              <p className="text-sm sm:text-base text-[#a49fb3]">
                Keep your eyelids heavy and calm for as long as you wish.
              </p>
            </>
          ) : (
            <>
              <p className="font-mono text-2xl sm:text-3xl text-[#cfc6e8] tabular-nums">
                {secondsLeft}s
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-light text-[#f0ece3]">
                {currentStep.instruction}
              </h2>
              <p className="text-sm sm:text-base text-[#a49fb3]">
                {currentStep.subtext}
              </p>
            </>
          )}
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-[#b8aedc]/60 transition-all duration-700"
              style={{ width: `${completed ? 100 : progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[#858196] tabular-nums">
            <span>
              Step {stepIndex + 1} of {exercise.steps.length}
            </span>
            <span>{completed ? 100 : progressPct}% complete</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleToggleRun}
            className="inline-flex items-center justify-center gap-2.5 min-h-[48px] px-7 py-3 rounded-2xl bg-[#b8aedc]/20 hover:bg-[#b8aedc]/30 border border-[#b8aedc]/30 text-[#f1edf8] font-medium text-sm transition-colors"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>{completed ? 'Repeat Exercise' : 'Begin Exercise'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset exercise"
            className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#b4b0c2] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
