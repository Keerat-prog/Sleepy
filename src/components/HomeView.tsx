import React from 'react';
import {
  BookOpen,
  Headphones,
  Eye,
  Wind,
  Sparkles,
  Moon,
  Volume2,
  VolumeX,
  SlidersHorizontal,
} from 'lucide-react';
import { AppView, SoundId, UserPreferences } from '../types';
import { AMBIENT_SOUNDS } from '../data/ambientSounds';

interface HomeViewProps {
  currentTime: Date;
  sessionSeconds: number;
  prefs: UserPreferences;
  activeSounds: SoundId[];
  sleepStreak: number;
  sleepTimerRemainingSec: number | null;
  onNavigate: (view: AppView) => void;
  onToggleSound: (id: SoundId) => void;
  onStopAllAmbient: () => void;
  onStartPreferredAmbient: () => void;
  onUpdatePrefs: (updater: Partial<UserPreferences>) => void;
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${String(mins).padStart(2, '0')}m`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentTime,
  sessionSeconds,
  prefs,
  activeSounds,
  sleepStreak,
  sleepTimerRemainingSec,
  onNavigate,
  onToggleSound,
  onStopAllAmbient,
  onStartPreferredAmbient,
  onUpdatePrefs,
}) => {
  const activities: Array<{
    id: AppView;
    number: string;
    title: string;
    subtitle: string;
    detail: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'reading',
      number: '01',
      title: 'Read Something Boring',
      subtitle: 'Monotonous factual passages',
      detail: 'Slow, ordinary prose across eight calm topics with auto-dimming.',
      icon: <BookOpen className="w-5 h-5 text-[#bfb5de]" aria-hidden="true" />,
    },
    {
      id: 'narration',
      number: '02',
      title: 'Listen & Drift Away',
      subtitle: 'Steady slow-paced voice narration',
      detail: 'Unemotional spoken readings with a gradual fade-out sleep timer.',
      icon: <Headphones className="w-5 h-5 text-[#bfb5de]" aria-hidden="true" />,
    },
    {
      id: 'eyes',
      number: '03',
      title: 'Relax Your Eyes',
      subtitle: 'Gentle visual muscle release',
      detail: 'Soft blinking, darkness rest, and guided facial relaxation.',
      icon: <Eye className="w-5 h-5 text-[#bfb5de]" aria-hidden="true" />,
    },
    {
      id: 'clear-mind',
      number: '04',
      title: 'Clear Your Mind',
      subtitle: 'Breathing, quick rest & stillness',
      detail: '3-minute calm breathing or completely silent No-Thought mode.',
      icon: <Wind className="w-5 h-5 text-[#bfb5de]" aria-hidden="true" />,
    },
    {
      id: 'random-thought',
      number: '05',
      title: 'Random Thought Generator',
      subtitle: 'Neutral object & place imagery',
      detail: 'Interrupts overthinking with unrelated objects that gradually slow down.',
      icon: <Sparkles className="w-5 h-5 text-[#bfb5de]" aria-hidden="true" />,
    },
  ];

  const activeSoundNames = activeSounds
    .map((id) => AMBIENT_SOUNDS.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join(' · ');

  const quickSoundIds: SoundId[] = ['rainfall', 'brown-noise', 'ocean', 'fireplace'];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-28 md:pb-16 space-y-12">
      {/* Hero sanctuary */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        <div className="lg:col-span-8 space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#9c98ab] tabular-nums">
            <span>{formatClock(currentTime)}</span>
            {sleepStreak > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  {sleepStreak} {sleepStreak === 1 ? 'night' : 'nights'} streak
                </span>
              </>
            )}
            {sleepTimerRemainingSec !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#c9bfe6]">
                  Sleep timer {Math.ceil(sleepTimerRemainingSec / 60)}m
                </span>
              </>
            )}
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#f0ece3] leading-[1.12]">
            Let your mind slow down.
          </h1>

          <p className="text-base sm:text-lg text-[#aba7b8] max-w-2xl leading-relaxed">
            You don&apos;t have to think about anything right now. Just relax.
          </p>
        </div>

        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3">
          <button
            type="button"
            onClick={() => onNavigate('start-sleeping')}
            className="inline-flex items-center justify-center gap-3 px-6 py-4 min-h-[52px] rounded-2xl bg-[#b8aedc]/18 hover:bg-[#b8aedc]/28 text-[#f2eee7] border border-[#b8aedc]/30 transition-all duration-200 shadow-[0_0_40px_rgba(184,174,220,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8aedc]"
          >
            <Moon className="w-5 h-5 text-[#cdc4ea]" aria-hidden="true" />
            <span className="font-medium text-sm sm:text-base whitespace-nowrap">
              Start Sleeping
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdatePrefs({ nightModeWarmth: !prefs.nightModeWarmth })
            }
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border text-xs sm:text-sm transition-colors whitespace-nowrap ${
              prefs.nightModeWarmth
                ? 'bg-[#d5cab8]/15 border-[#d5cab8]/30 text-[#e8decb]'
                : 'bg-white/[0.03] border-white/[0.08] text-[#a6a2b5] hover:text-[#e6e2da]'
            }`}
          >
            <span>
              Night Mode: {prefs.nightModeWarmth ? 'Warm Dim On' : 'Standard'}
            </span>
          </button>
        </div>
      </section>

      {/* Five Primary Activity Cards */}
      <section aria-label="Sleep activities" className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activities.map((activity, idx) => (
            <button
              key={activity.id}
              type="button"
              onClick={() => onNavigate(activity.id)}
              className={`group text-left p-6 sm:p-7 rounded-3xl bg-white/[0.03] hover:bg-white/[0.055] border border-white/[0.07] hover:border-[#b8aedc]/25 transition-all duration-200 flex flex-col justify-between min-h-[192px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8aedc]/60 ${
                idx === 4 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-xs text-[#88849a] tabular-nums">
                  {activity.number}
                </span>
                <span className="p-2.5 rounded-xl bg-white/[0.04] group-hover:bg-[#b8aedc]/12 transition-colors">
                  {activity.icon}
                </span>
              </div>

              <div className="space-y-2 mt-6">
                <h2 className="font-display text-xl sm:text-2xl font-normal text-[#ede9e0] group-hover:text-white transition-colors">
                  {activity.title}
                </h2>
                <p className="text-xs text-[#9c97ad]">{activity.subtitle}</p>
                <p className="text-sm text-[#8a8699] leading-relaxed pt-1">
                  {activity.detail}
                </p>
              </div>
            </button>
          ))}

          {/* Calm Ambient Sound Quick Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/[0.025] border border-white/[0.07] flex flex-col justify-between min-h-[192px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-[#9c97ad]">Ambient Soundscape</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    activeSounds.length > 0
                      ? onStopAllAmbient()
                      : onStartPreferredAmbient()
                  }
                  aria-label={
                    activeSounds.length > 0
                      ? 'Pause ambient sound'
                      : 'Play ambient sound'
                  }
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-[#d7d2e4] transition-colors"
                >
                  {activeSounds.length > 0 ? (
                    <Volume2 className="w-4 h-4 text-[#c4b8e6]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-[#8c889b]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('ambient')}
                  aria-label="Open full ambient sound library"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-[#a6a2b5] hover:text-[#e6e2da] transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <p className="text-sm text-[#cbc6d6] truncate">
                {activeSoundNames || 'Silence · Tap a sound to begin'}
              </p>

              <div className="flex flex-wrap gap-2">
                {quickSoundIds.map((id) => {
                  const info = AMBIENT_SOUNDS.find((s) => s.id === id);
                  const isActive = activeSounds.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onToggleSound(id)}
                      className={`px-3 py-2 min-h-[38px] rounded-xl text-xs transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-[#b8aedc]/20 text-[#efeaf8] border border-[#b8aedc]/35'
                          : 'bg-white/[0.03] text-[#9b97aa] border border-white/[0.06] hover:text-[#e2dee9]'
                      }`}
                    >
                      {info?.name}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-[#8a8699] shrink-0">Volume</span>
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
                <span className="font-mono text-xs text-[#8a8699] tabular-nums w-8 text-right">
                  {Math.round(prefs.masterVolume * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Quiet Pathways */}
      <section className="pt-2 border-t border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('clear-mind')}
            className="px-4 py-2.5 min-h-[44px] rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-xs sm:text-sm text-[#cfcad8] transition-colors whitespace-nowrap"
          >
            3-Minute Quick Relaxation
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ambient')}
            className="px-4 py-2.5 min-h-[44px] rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-xs sm:text-sm text-[#cfcad8] transition-colors whitespace-nowrap"
          >
            Ambient Sound Library (14 Sounds)
          </button>
          <button
            type="button"
            onClick={() => onNavigate('journal')}
            className="px-4 py-2.5 min-h-[44px] rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-xs sm:text-sm text-[#cfcad8] transition-colors whitespace-nowrap"
          >
            Sleep Journal
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#858196] italic font-display">
          &ldquo;You don&apos;t need to force yourself to sleep. Just relax, and let
          sleep happen naturally.&rdquo;
        </p>
      </section>
    </div>
  );
};
