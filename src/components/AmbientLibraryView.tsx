import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { AMBIENT_SOUNDS, SOUND_PRESETS } from '../data/ambientSounds';
import { SoundCategory, SoundId, UserPreferences } from '../types';

interface AmbientLibraryViewProps {
  prefs: UserPreferences;
  activeSounds: SoundId[];
  sleepTimerRemainingSec: number | null;
  onToggleSound: (id: SoundId) => void;
  onSetSoundVolume: (id: SoundId, volume: number) => void;
  onApplyPreset: (sounds: Partial<Record<SoundId, number>>) => void;
  onStopAll: () => void;
  onUpdatePrefs: (updater: Partial<UserPreferences>) => void;
  onStartSleepTimer: (minutes: number) => void;
  onCancelSleepTimer: () => void;
  onBack: () => void;
}

const CATEGORIES: SoundCategory[] = ['Nature', 'White Noise', 'Indoor'];

export const AmbientLibraryView: React.FC<AmbientLibraryViewProps> = ({
  prefs,
  activeSounds,
  sleepTimerRemainingSec,
  onToggleSound,
  onSetSoundVolume,
  onApplyPreset,
  onStopAll,
  onUpdatePrefs,
  onStartSleepTimer,
  onCancelSleepTimer,
  onBack,
}) => {
  const [filter, setFilter] = useState<'All' | SoundCategory>('All');

  const visibleSounds =
    filter === 'All'
      ? AMBIENT_SOUNDS
      : AMBIENT_SOUNDS.filter((s) => s.category === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-28 md:pb-16 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 -ml-3 rounded-xl text-sm text-[#a6a2b5] hover:text-[#ece8e0] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sanctuary</span>
        </button>

        {activeSounds.length > 0 && (
          <button
            type="button"
            onClick={onStopAll}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs sm:text-sm text-[#cbc6d6] transition-colors"
          >
            <VolumeX className="w-4 h-4" />
            <span>Silence All ({activeSounds.length} active)</span>
          </button>
        )}
      </div>

      <header className="space-y-3">
        <h1 className="font-display text-3xl sm:text-4xl font-light text-[#f0ece3]">
          Ambient Sound Library
        </h1>
        <p className="text-sm sm:text-base text-[#a29db1] max-w-2xl">
          Layer multiple nighttime textures together. Every volume change blends
          smoothly without sudden jumps.
        </p>
      </header>

      {/* Master Volume & Sleep Fade-Out Timer */}
      <section className="p-6 rounded-3xl bg-white/[0.025] border border-white/[0.07] grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm text-[#a8a3b8]">
            <span className="inline-flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#c4b8e6]" />
              Master Ambient Level
            </span>
            <span className="font-mono tabular-nums">
              {Math.round(prefs.masterVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(prefs.masterVolume * 100)}
            onChange={(e) =>
              onUpdatePrefs({ masterVolume: Number(e.target.value) / 100 })
            }
            aria-label="Master ambient volume"
            className="sleep-slider w-full"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm text-[#a8a3b8]">
            <span>Sleep Timer (Gradual Fade-Out)</span>
            {sleepTimerRemainingSec !== null ? (
              <button
                type="button"
                onClick={onCancelSleepTimer}
                className="text-xs text-[#c4b8e6] hover:text-white underline underline-offset-4 tabular-nums"
              >
                {Math.floor(sleepTimerRemainingSec / 60)}:
                {String(sleepTimerRemainingSec % 60).padStart(2, '0')} · Cancel
              </button>
            ) : (
              <span className="text-xs text-[#7c788c]">Continuous</span>
            )}
          </div>
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
      </section>

      {/* Calm Presets */}
      <section className="space-y-3">
        <p className="text-xs text-[#8d899c]">Evening Combinations</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SOUND_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset.sounds)}
              className="text-left p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] transition-colors space-y-1"
            >
              <span className="font-display text-base text-[#ece7dd] block">
                {preset.name}
              </span>
              <span className="text-xs text-[#8d899c] block leading-relaxed">
                {preset.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {(['All', ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm transition-colors whitespace-nowrap ${
              filter === cat
                ? 'bg-[#b8aedc]/20 text-[#f1edf9] border border-[#b8aedc]/35'
                : 'bg-white/[0.03] text-[#9b97aa] border border-white/[0.06] hover:text-[#e4e0ec]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Individual Sound Mixer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleSounds.map((sound) => {
          const isActive = activeSounds.includes(sound.id);
          const vol = prefs.ambientVolumes[sound.id] ?? 0.5;
          return (
            <div
              key={sound.id}
              className={`p-5 rounded-2xl border transition-colors flex flex-col justify-between space-y-5 ${
                isActive
                  ? 'bg-[#b8aedc]/[0.08] border-[#b8aedc]/30'
                  : 'bg-white/[0.025] border-white/[0.06]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-[#88849a] block">
                    {sound.category}
                  </span>
                  <h2 className="font-display text-lg text-[#ece7dd]">
                    {sound.name}
                  </h2>
                  <p className="text-xs text-[#8e899e] leading-relaxed">
                    {sound.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleSound(sound.id)}
                  aria-label={
                    isActive ? `Mute ${sound.name}` : `Play ${sound.name}`
                  }
                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors shrink-0 ${
                    isActive
                      ? 'bg-[#b8aedc]/25 border-[#b8aedc]/40 text-[#f3effb]'
                      : 'bg-white/[0.03] border-white/[0.08] text-[#938ea3] hover:text-white'
                  }`}
                >
                  {isActive ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(vol * 100)}
                  onChange={(e) =>
                    onSetSoundVolume(sound.id, Number(e.target.value) / 100)
                  }
                  aria-label={`${sound.name} volume`}
                  className="sleep-slider w-full"
                />
                <span className="font-mono text-xs text-[#8d899c] tabular-nums w-9 text-right">
                  {Math.round(vol * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
