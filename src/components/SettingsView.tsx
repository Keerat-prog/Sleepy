import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { sleepAudio } from '../audio/sleepAudioEngine';
import { AMBIENT_SOUNDS } from '../data/ambientSounds';
import {
  NarrationSpeed,
  RelaxationActivityId,
  SoundId,
  ThemeId,
  UserPreferences,
} from '../types';

interface SettingsViewProps {
  prefs: UserPreferences;
  onUpdatePrefs: (updater: Partial<UserPreferences>) => void;
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  prefs,
  onUpdatePrefs,
  onBack,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const load = () => setVoices(sleepAudio.getAvailableVoices());
    load();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = load;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const themes: Array<{ id: ThemeId; name: string; desc: string }> = [
    { id: 'midnight', name: 'Midnight Sky', desc: 'Slow stars & soft crescent' },
    { id: 'rain', name: 'Quiet Rain', desc: 'Gentle rainfall over navy sky' },
    { id: 'mist', name: 'Moonlit Mist', desc: 'Soft lavender clouds & glow' },
    { id: 'obsidian', name: 'Deep Obsidian', desc: 'Minimal dim charcoal sky' },
  ];

  const activities: Array<{ id: RelaxationActivityId; label: string }> = [
    { id: 'reading', label: 'Read Something Boring' },
    { id: 'narration', label: 'Listen & Drift Away' },
    { id: 'eyes', label: 'Relax Your Eyes' },
    { id: 'clear-mind', label: 'Clear Your Mind' },
    { id: 'random-thought', label: 'Random Thought Generator' },
  ];

  // Top preferred sound selector updates default starting sound volume priority
  const topPreferredSound =
    (Object.entries(prefs.ambientVolumes).sort(
      (a, b) => (b[1] ?? 0) - (a[1] ?? 0)
    )[0]?.[0] as SoundId) || 'rainfall';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-28 md:pb-16 space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 -ml-3 rounded-xl text-sm text-[#a6a2b5] hover:text-[#ece8e0] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Sanctuary</span>
      </button>

      <header className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-light text-[#f0ece3]">
          Personalization
        </h1>
        <p className="text-sm sm:text-base text-[#a29db1]">
          All preferences are remembered automatically between nights.
        </p>
      </header>

      <div className="space-y-6">
        {/* Background Theme */}
        <section className="p-6 rounded-3xl bg-white/[0.025] border border-white/[0.07] space-y-4">
          <h2 className="font-display text-xl text-[#ece7dd]">
            Nighttime Atmosphere
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onUpdatePrefs({ backgroundTheme: t.id })}
                className={`text-left p-4 rounded-2xl border transition-colors ${
                  prefs.backgroundTheme === t.id
                    ? 'bg-[#b8aedc]/18 border-[#b8aedc]/35 text-[#f0ecf8]'
                    : 'bg-white/[0.025] border-white/[0.06] text-[#a5a0b3] hover:bg-white/[0.045]'
                }`}
              >
                <span className="font-medium text-sm block">{t.name}</span>
                <span className="text-xs text-[#8c879c] block mt-1">
                  {t.desc}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Brightness & Night Mode */}
        <section className="p-6 rounded-3xl bg-white/[0.025] border border-white/[0.07] space-y-5">
          <h2 className="font-display text-xl text-[#ece7dd]">
            Screen Comfort &amp; Brightness
          </h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm text-[#a8a3b8]">
              <span>Screen Brightness</span>
              <span className="font-mono tabular-nums">
                {prefs.screenBrightness}%
              </span>
            </div>
            <input
              type="range"
              min={30}
              max={100}
              value={prefs.screenBrightness}
              onChange={(e) =>
                onUpdatePrefs({ screenBrightness: Number(e.target.value) })
              }
              aria-label="Screen brightness"
              className="sleep-slider w-full"
            />
          </div>

          <label className="flex items-center justify-between gap-4 cursor-pointer min-h-[44px]">
            <span className="text-sm text-[#cbc6d6]">
              Warm Night Filter (softens blue light)
            </span>
            <input
              type="checkbox"
              checked={prefs.nightModeWarmth}
              onChange={(e) =>
                onUpdatePrefs({ nightModeWarmth: e.target.checked })
              }
              className="accent-[#b8aedc] w-5 h-5 rounded"
            />
          </label>
        </section>

        {/* Audio & Narration Preferences */}
        <section className="p-6 rounded-3xl bg-white/[0.025] border border-white/[0.07] space-y-5">
          <h2 className="font-display text-xl text-[#ece7dd]">
            Sound &amp; Narration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label
                htmlFor="pref-ambient"
                className="text-xs text-[#8f8aa0] block"
              >
                Preferred Default Ambient Sound
              </label>
              <select
                id="pref-ambient"
                value={topPreferredSound}
                onChange={(e) => {
                  const chosen = e.target.value as SoundId;
                  onUpdatePrefs({
                    ambientVolumes: {
                      ...prefs.ambientVolumes,
                      [chosen]: 0.72,
                    },
                  });
                }}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#0c1120] border border-white/[0.08] text-sm text-[#e6e2da]"
              >
                {AMBIENT_SOUNDS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pref-voice"
                className="text-xs text-[#8f8aa0] block"
              >
                Preferred Narration Voice
              </label>
              <select
                id="pref-voice"
                value={prefs.narrationVoiceURI}
                onChange={(e) =>
                  onUpdatePrefs({ narrationVoiceURI: e.target.value })
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#0c1120] border border-white/[0.08] text-sm text-[#e6e2da]"
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            <div className="space-y-2">
              <span className="text-xs text-[#8f8aa0] block">
                Narration Speed
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'extra-slow', label: 'Extra Slow' },
                    { id: 'slow', label: 'Slow' },
                    { id: 'normal', label: 'Normal' },
                  ] as Array<{ id: NarrationSpeed; label: string }>
                ).map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => onUpdatePrefs({ narrationSpeed: sp.id })}
                    className={`min-h-[40px] rounded-xl text-xs transition-colors ${
                      prefs.narrationSpeed === sp.id
                        ? 'bg-[#b8aedc]/22 text-[#f0ecf8] border border-[#b8aedc]/35'
                        : 'bg-white/[0.03] text-[#9b97aa] border border-white/[0.06]'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-[#8f8aa0] block">
                Default Sleep Timer
              </span>
              <div className="grid grid-cols-4 gap-2">
                {([15, 30, 45, 60] as const).map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onUpdatePrefs({ sleepTimerMinutes: mins })}
                    className={`min-h-[40px] rounded-xl text-xs transition-colors ${
                      prefs.sleepTimerMinutes === mins
                        ? 'bg-[#b8aedc]/22 text-[#f0ecf8] border border-[#b8aedc]/35'
                        : 'bg-white/[0.03] text-[#9b97aa] border border-white/[0.06]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Random Thought & Preferred Activity */}
        <section className="p-6 rounded-3xl bg-white/[0.025] border border-white/[0.07] space-y-5">
          <h2 className="font-display text-xl text-[#ece7dd]">
            Relaxation Rhythm
          </h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm text-[#a8a3b8]">
              <span>Random Object Transition Pace</span>
              <span className="font-mono tabular-nums">
                {prefs.randomObjectIntervalSec} seconds
              </span>
            </div>
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
              aria-label="Random object transition speed"
              className="sleep-slider w-full"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pref-activity"
              className="text-xs text-[#8f8aa0] block"
            >
              Preferred Relaxation Activity
            </label>
            <select
              id="pref-activity"
              value={prefs.preferredActivity}
              onChange={(e) =>
                onUpdatePrefs({
                  preferredActivity: e.target.value as RelaxationActivityId,
                })
              }
              className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#0c1120] border border-white/[0.08] text-sm text-[#e6e2da]"
            >
              {activities.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.label}
                </option>
              ))}
            </select>
          </div>
        </section>
      </div>
    </div>
  );
};
