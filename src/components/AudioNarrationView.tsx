import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Pause, Play, Square, Volume2 } from 'lucide-react';
import { sleepAudio } from '../audio/sleepAudioEngine';
import { AMBIENT_SOUNDS } from '../data/ambientSounds';
import { BORING_PASSAGES } from '../data/boringPassages';
import { NarrationSpeed, SoundId, UserPreferences } from '../types';

interface AudioNarrationViewProps {
  prefs: UserPreferences;
  activeSounds: SoundId[];
  sleepTimerRemainingSec: number | null;
  onUpdatePrefs: (updater: Partial<UserPreferences>) => void;
  onToggleSound: (id: SoundId) => void;
  onStartSleepTimer: (minutes: number) => void;
  onCancelSleepTimer: () => void;
  onBack: () => void;
}

function splitIntoSentences(paragraphs: string[]): string[] {
  const sentences: string[] = [];
  for (const para of paragraphs) {
    const parts = para.match(/[^.!?]+[.!?]+/g);
    if (parts) {
      for (const s of parts) {
        const clean = s.trim();
        if (clean) sentences.push(clean);
      }
    } else if (para.trim()) {
      sentences.push(para.trim());
    }
  }
  return sentences;
}

export const AudioNarrationView: React.FC<AudioNarrationViewProps> = ({
  prefs,
  activeSounds,
  sleepTimerRemainingSec,
  onUpdatePrefs,
  onToggleSound,
  onStartSleepTimer,
  onCancelSleepTimer,
  onBack,
}) => {
  const [selectedPassageId, setSelectedPassageId] = useState<string>(
    BORING_PASSAGES[0].id
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [sentenceIndex, setSentenceIndex] = useState<number>(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const currentPassage = useMemo(
    () =>
      BORING_PASSAGES.find((p) => p.id === selectedPassageId) ||
      BORING_PASSAGES[0],
    [selectedPassageId]
  );

  const sentences = useMemo(
    () => splitIntoSentences(currentPassage.paragraphs),
    [currentPassage]
  );

  // Load available SpeechSynthesis voices
  useEffect(() => {
    const refreshVoices = () => {
      const list = sleepAudio.getAvailableVoices();
      setVoices(list);
      if (!prefs.narrationVoiceURI && list.length > 0) {
        onUpdatePrefs({ narrationVoiceURI: list[0].voiceURI });
      }
    };
    refreshVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [prefs.narrationVoiceURI, onUpdatePrefs]);

  // Update engine parameters dynamically
  useEffect(() => {
    sleepAudio.updateNarrationConfig(
      prefs.narrationVoiceURI,
      prefs.narrationSpeed,
      prefs.narrationVolume
    );
  }, [prefs.narrationVoiceURI, prefs.narrationSpeed, prefs.narrationVolume]);

  // Cleanup narration on unmount
  useEffect(() => {
    return () => {
      sleepAudio.stopNarration();
    };
  }, []);

  const startPlaybackFrom = (startIdx: number, passageId = selectedPassageId) => {
    const passage =
      BORING_PASSAGES.find((p) => p.id === passageId) || BORING_PASSAGES[0];
    const passageSentences = splitIntoSentences(passage.paragraphs);

    setIsPlaying(true);
    sleepAudio.startSentenceNarration(passageSentences, startIdx, {
      voiceURI: prefs.narrationVoiceURI,
      speed: prefs.narrationSpeed,
      volume: prefs.narrationVolume,
      onSentenceChange: (idx) => setSentenceIndex(idx),
      onComplete: () => {
        // Automatically continue softly into next passage unless sleep timer ended
        const currentIdx = BORING_PASSAGES.findIndex((p) => p.id === passage.id);
        const nextPassage =
          BORING_PASSAGES[(currentIdx + 1) % BORING_PASSAGES.length];
        setSelectedPassageId(nextPassage.id);
        setSentenceIndex(0);
        window.setTimeout(() => {
          startPlaybackFrom(0, nextPassage.id);
        }, 1200);
      },
    });
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      sleepAudio.stopNarration();
      setIsPlaying(false);
    } else {
      startPlaybackFrom(sentenceIndex);
    }
  };

  const handleStop = () => {
    sleepAudio.stopNarration();
    setIsPlaying(false);
    setSentenceIndex(0);
  };

  const handlePassageSwitch = (id: string) => {
    setSelectedPassageId(id);
    setSentenceIndex(0);
    if (isPlaying) {
      startPlaybackFrom(0, id);
    }
  };

  const speeds: Array<{ id: NarrationSpeed; label: string }> = [
    { id: 'extra-slow', label: 'Extra Slow' },
    { id: 'slow', label: 'Slow' },
    { id: 'normal', label: 'Normal' },
  ];

  const ambientQuickIds: SoundId[] = [
    'rainfall',
    'brown-noise',
    'ocean',
    'fireplace',
    'room',
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-28 md:pb-16 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            sleepAudio.stopNarration();
            onBack();
          }}
          className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 -ml-3 rounded-xl text-sm text-[#a6a2b5] hover:text-[#ece8e0] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sanctuary</span>
        </button>

        {sleepTimerRemainingSec !== null && (
          <div className="flex items-center gap-3 text-xs sm:text-sm text-[#c4b8e6] tabular-nums">
            <span>
              Fading out in {Math.floor(sleepTimerRemainingSec / 60)}:
              {String(sleepTimerRemainingSec % 60).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={onCancelSleepTimer}
              className="text-xs text-[#9c97ad] hover:text-white underline underline-offset-4"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <header className="space-y-3">
        <h1 className="font-display text-3xl sm:text-4xl font-light text-[#f0ece3]">
          Listen &amp; Drift Away
        </h1>
        <p className="text-sm sm:text-base text-[#a29db1] max-w-2xl">
          Soft, steady, unhurried narration of ordinary topics. When the sleep
          timer ends, the voice gradually fades into silence.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Playback & Voice Controls */}
        <div className="lg:col-span-5 space-y-5 p-6 rounded-3xl bg-white/[0.03] border border-white/[0.07]">
          <div className="space-y-1">
            <p className="text-xs text-[#8f8aa0]">
              {currentPassage.categoryCode}. {currentPassage.categoryName}
            </p>
            <h2 className="font-display text-xl text-[#ece7dd]">
              {currentPassage.title}
            </h2>
          </div>

          {/* Primary Playback Controls */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="flex-1 inline-flex items-center justify-center gap-2.5 min-h-[48px] px-5 py-3 rounded-2xl bg-[#b8aedc]/20 hover:bg-[#b8aedc]/30 border border-[#b8aedc]/30 text-[#f1edf8] font-medium text-sm transition-colors"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Narration</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Begin Narration</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleStop}
              aria-label="Stop narration"
              className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#b4b0c2] transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Control */}
          <div className="space-y-2">
            <span className="text-xs text-[#8f8aa0] block">Narration Pace</span>
            <div className="grid grid-cols-3 gap-2">
              {speeds.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => onUpdatePrefs({ narrationSpeed: sp.id })}
                  className={`min-h-[40px] px-3 rounded-xl text-xs transition-colors whitespace-nowrap ${
                    prefs.narrationSpeed === sp.id
                      ? 'bg-[#b8aedc]/22 text-[#f0ecf8] border border-[#b8aedc]/35'
                      : 'bg-white/[0.03] text-[#9b97aa] border border-white/[0.06] hover:text-[#e0dce8]'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8f8aa0]">
              <span className="inline-flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                Voice Volume
              </span>
              <span className="font-mono tabular-nums">
                {Math.round(prefs.narrationVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={Math.round(prefs.narrationVolume * 100)}
              onChange={(e) =>
                onUpdatePrefs({ narrationVolume: Number(e.target.value) / 100 })
              }
              aria-label="Narration volume"
              className="sleep-slider w-full"
            />
          </div>

          {/* Voice selector */}
          <div className="space-y-2">
            <label
              htmlFor="narration-voice"
              className="text-xs text-[#8f8aa0] block"
            >
              Narrator Voice
            </label>
            <select
              id="narration-voice"
              value={prefs.narrationVoiceURI}
              onChange={(e) =>
                onUpdatePrefs({ narrationVoiceURI: e.target.value })
              }
              className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#0c1120] border border-white/[0.08] text-xs sm:text-sm text-[#e0dce6] focus:outline-none focus:ring-2 focus:ring-[#b8aedc]/50"
            >
              {voices.length === 0 ? (
                <option value="">System Default Calm Voice</option>
              ) : (
                voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Sleep Timer (15, 30, 45, 60 min) */}
          <div className="space-y-2 pt-1 border-t border-white/[0.06]">
            <span className="text-xs text-[#8f8aa0] block pt-2">
              Gradual Fade-Out Sleep Timer
            </span>
            <div className="grid grid-cols-4 gap-2">
              {([15, 30, 45, 60] as const).map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    onUpdatePrefs({ sleepTimerMinutes: mins });
                    onStartSleepTimer(mins);
                  }}
                  className={`min-h-[40px] rounded-xl text-xs transition-colors whitespace-nowrap ${
                    sleepTimerRemainingSec !== null &&
                    prefs.sleepTimerMinutes === mins
                      ? 'bg-[#b8aedc]/22 text-[#f0ecf8] border border-[#b8aedc]/35'
                      : 'bg-white/[0.03] text-[#9b97aa] border border-white/[0.06] hover:text-[#e0dce8]'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Combine with Ambient Sounds */}
          <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
            <span className="text-xs text-[#8f8aa0] block">
              Layer Gentle Ambient Sound
            </span>
            <div className="flex flex-wrap gap-2">
              {ambientQuickIds.map((id) => {
                const info = AMBIENT_SOUNDS.find((s) => s.id === id);
                const active = activeSounds.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onToggleSound(id)}
                    className={`px-3 py-2 min-h-[38px] rounded-xl text-xs transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#b8aedc]/20 text-[#efeaf8] border border-[#b8aedc]/35'
                        : 'bg-white/[0.03] text-[#9b97aa] border border-white/[0.06] hover:text-[#e0dce8]'
                    }`}
                  >
                    {info?.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Passage Picker & Live Calm Transcript */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap gap-2">
            {BORING_PASSAGES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePassageSwitch(p.id)}
                className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs transition-colors whitespace-nowrap ${
                  p.id === selectedPassageId
                    ? 'bg-[#b8aedc]/20 text-[#f1edf9] border border-[#b8aedc]/35'
                    : 'bg-white/[0.03] text-[#9b97aa] border border-white/[0.06] hover:text-[#e4e0ec]'
                }`}
              >
                {p.categoryCode}. {p.title}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-4 max-h-[540px] overflow-y-auto">
            <div className="flex items-center justify-between text-xs text-[#858196]">
              <span>Spoken Text</span>
              <span className="tabular-nums">
                Line {sentenceIndex + 1} of {sentences.length}
              </span>
            </div>
            <div className="space-y-3 leading-relaxed text-base text-[#9c97aa]">
              {sentences.map((sentence, idx) => {
                const active = idx === sentenceIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSentenceIndex(idx);
                      startPlaybackFrom(idx);
                    }}
                    className={`block text-left w-full rounded-lg px-2 py-1 transition-colors ${
                      active
                        ? 'text-[#f0ece3] bg-white/[0.04]'
                        : 'text-[#847f94] hover:text-[#c7c2d4]'
                    }`}
                  >
                    {sentence}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
