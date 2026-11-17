import React, { useEffect, useState } from 'react';
import { sleepAudio } from '../audio/sleepAudioEngine';
import { BORING_PASSAGES } from '../data/boringPassages';
import { THOUGHT_ITEMS } from '../data/thoughtItems';
import { SoundId, UserPreferences } from '../types';

interface StartSleepingViewProps {
  prefs: UserPreferences;
  activeSounds: SoundId[];
  sleepTimerRemainingSec: number | null;
  onStartPreferredAmbient: () => void;
  onStartSleepTimer: (minutes: number) => void;
  onCancelSleepTimer: () => void;
  onExit: () => void;
}

export const StartSleepingView: React.FC<StartSleepingViewProps> = ({
  prefs,
  activeSounds,
  sleepTimerRemainingSec,
  onStartPreferredAmbient,
  onStartSleepTimer,
  onCancelSleepTimer,
  onExit,
}) => {
  const [dimOpacity, setDimOpacity] = useState<number>(0.25);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [breathingOn, setBreathingOn] = useState<boolean>(true);
  const [thoughtsOn, setThoughtsOn] = useState<boolean>(false);
  const [narrationOn, setNarrationOn] = useState<boolean>(false);
  const [breathExpand, setBreathExpand] = useState<boolean>(false);
  const [thoughtIdx, setThoughtIdx] = useState<number>(0);

  // Automatically start ambient sound and sleep timer upon entering Start Sleeping
  useEffect(() => {
    if (activeSounds.length === 0) {
      onStartPreferredAmbient();
    }
    if (sleepTimerRemainingSec === null) {
      onStartSleepTimer(prefs.sleepTimerMinutes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gradually dim screen toward near-black over ~45 seconds
  useEffect(() => {
    const id = window.setInterval(() => {
      setDimOpacity((prev) => Math.min(0.88, prev + 0.025));
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  // Auto-hide controls after 5 seconds of stillness
  useEffect(() => {
    if (!controlsVisible) return;
    const id = window.setTimeout(() => {
      setControlsVisible(false);
    }, 5000);
    return () => window.clearTimeout(id);
  }, [controlsVisible]);

  // Breathing pulse cycle (4.5s in, 5.5s out)
  useEffect(() => {
    if (!breathingOn) return;
    const id = window.setInterval(() => {
      setBreathExpand((prev) => !prev);
    }, 5000);
    return () => window.clearInterval(id);
  }, [breathingOn]);

  // Optional quiet random object thinking cycle
  useEffect(() => {
    if (!thoughtsOn) return;
    const id = window.setInterval(() => {
      setThoughtIdx((prev) => (prev + 1) % THOUGHT_ITEMS.length);
    }, Math.max(8, prefs.randomObjectIntervalSec + 2) * 1000);
    return () => window.clearInterval(id);
  }, [thoughtsOn, prefs.randomObjectIntervalSec]);

  // Optional boring audio narration
  useEffect(() => {
    if (!narrationOn) {
      sleepAudio.stopNarration();
      return;
    }
    const allSentences = BORING_PASSAGES.flatMap((p) =>
      p.paragraphs.flatMap((para) => para.match(/[^.!?]+[.!?]+/g) || [para])
    );
    sleepAudio.startSentenceNarration(allSentences, 0, {
      voiceURI: prefs.narrationVoiceURI,
      speed: prefs.narrationSpeed,
      volume: prefs.narrationVolume * 0.85,
      onSentenceChange: () => {},
      onComplete: () => setNarrationOn(false),
    });

    return () => {
      sleepAudio.stopNarration();
    };
  }, [
    narrationOn,
    prefs.narrationVoiceURI,
    prefs.narrationSpeed,
    prefs.narrationVolume,
  ]);

  const wakeControls = () => {
    setControlsVisible(true);
  };

  const currentThought = THOUGHT_ITEMS[thoughtIdx];

  return (
    <div
      onClick={wakeControls}
      onMouseMove={wakeControls}
      onTouchStart={wakeControls}
      className="fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden"
    >
      {/* Near-black gradual dimming overlay */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[#010206] pointer-events-none transition-opacity duration-1000"
        style={{ opacity: dimOpacity }}
      />

      {/* Top unobtrusive row */}
      <div
        className={`relative z-10 flex items-center justify-between transition-opacity duration-700 ${
          controlsVisible ? 'opacity-80' : 'opacity-15'
        }`}
      >
        <span className="font-mono text-xs text-[#6c687e] tabular-nums">
          {sleepTimerRemainingSec !== null
            ? `Audio fading in ${Math.floor(sleepTimerRemainingSec / 60)}:${String(
                sleepTimerRemainingSec % 60
              ).padStart(2, '0')}`
            : 'Ambient active'}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            sleepAudio.stopNarration();
            onCancelSleepTimer();
            onExit();
          }}
          className="px-3.5 py-2 min-h-[40px] rounded-xl text-xs text-[#7d788f] hover:text-[#d5d0e3] bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] transition-colors"
        >
          Exit Sleep Mode
        </button>
      </div>

      {/* Center ultra-dim focus */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center space-y-8 pointer-events-none">
        {breathingOn && (
          <div className="flex flex-col items-center space-y-5">
            <div
              className="w-28 h-28 rounded-full border border-[#b8aedc]/15 bg-[#b8aedc]/[0.03] transition-transform duration-[5000ms] ease-in-out"
              style={{ transform: `scale(${breathExpand ? 1.25 : 0.85})` }}
            />
            <p className="text-xs text-[#59556b] tracking-wide transition-opacity duration-1000">
              {breathExpand ? 'Breathe in gently' : 'Breathe out slowly'}
            </p>
          </div>
        )}

        {thoughtsOn && (
          <div className="space-y-1 max-w-sm">
            <p className="font-display text-2xl font-light text-[#8b869e]">
              {currentThought.label}
            </p>
            <p className="text-xs text-[#59556b]">{currentThought.detail}</p>
          </div>
        )}
      </div>

      {/* Bottom quiet toggles (fade nearly invisible when untouched) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 flex flex-wrap items-center justify-center gap-2.5 transition-opacity duration-700 ${
          controlsVisible ? 'opacity-85' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={() => setBreathingOn((v) => !v)}
          className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs border transition-colors ${
            breathingOn
              ? 'bg-[#b8aedc]/15 border-[#b8aedc]/30 text-[#d8d2ea]'
              : 'bg-white/[0.02] border-white/[0.06] text-[#7b778d]'
          }`}
        >
          Breathing Guide: {breathingOn ? 'On' : 'Off'}
        </button>

        <button
          type="button"
          onClick={() => setThoughtsOn((v) => !v)}
          className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs border transition-colors ${
            thoughtsOn
              ? 'bg-[#b8aedc]/15 border-[#b8aedc]/30 text-[#d8d2ea]'
              : 'bg-white/[0.02] border-white/[0.06] text-[#7b778d]'
          }`}
        >
          Random Objects: {thoughtsOn ? 'On' : 'Off'}
        </button>

        <button
          type="button"
          onClick={() => setNarrationOn((v) => !v)}
          className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs border transition-colors ${
            narrationOn
              ? 'bg-[#b8aedc]/15 border-[#b8aedc]/30 text-[#d8d2ea]'
              : 'bg-white/[0.02] border-white/[0.06] text-[#7b778d]'
          }`}
        >
          Boring Narration: {narrationOn ? 'On' : 'Off'}
        </button>

        <button
          type="button"
          onClick={() => setDimOpacity((d) => (d > 0.75 ? 0.35 : 0.88))}
          className="px-3.5 py-2 min-h-[40px] rounded-xl text-xs bg-white/[0.02] border border-white/[0.06] text-[#7b778d] hover:text-[#cfcadd] transition-colors"
        >
          {dimOpacity > 0.75 ? 'Raise Dimmer' : 'Dim Further'}
        </button>
      </div>
    </div>
  );
};
