import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sleepAudio } from '../audio/sleepAudioEngine';
import { SleepJournalEntry, SoundId, UserPreferences } from '../types';

const PREFS_KEY = 'sleepwell_preferences_v1';
const JOURNAL_KEY = 'sleepwell_journal_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  ambientVolumes: {
    rainfall: 0.55,
    'brown-noise': 0.45,
    ocean: 0.5,
    fireplace: 0.45,
    room: 0.3,
  },
  activeSounds: [],
  masterVolume: 0.75,
  narrationVoiceURI: '',
  narrationSpeed: 'slow',
  narrationVolume: 0.75,
  backgroundTheme: 'midnight',
  sleepTimerMinutes: 30,
  randomObjectIntervalSec: 7,
  randomObjectSlowdown: true,
  screenBrightness: 90,
  nightModeWarmth: false,
  preferredActivity: 'random-thought',
  readingFontSize: 'lg',
  readingAutoScrollSpeed: 'off',
};

function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      ambientVolumes: {
        ...DEFAULT_PREFERENCES.ambientVolumes,
        ...(parsed.ambientVolumes || {}),
      },
      // Start with sounds paused until user activates or enters sleep mode
      activeSounds: [],
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function loadJournal(): SleepJournalEntry[] {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function calculateSleepStreak(entries: SleepJournalEntry[]): number {
  if (entries.length === 0) return 0;
  const uniqueDates = Array.from(new Set(entries.map((e) => e.dateISO))).sort(
    (a, b) => (a > b ? -1 : 1)
  );
  if (uniqueDates.length === 0) return 0;

  const today = new Date();
  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayISO = toISO(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = toISO(yesterday);

  // Streak must include today or yesterday to be active
  if (uniqueDates[0] !== todayISO && uniqueDates[0] !== yesterdayISO) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const curr = new Date(`${uniqueDates[i]}T12:00:00`);
    const prev = new Date(`${uniqueDates[i + 1]}T12:00:00`);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function useSleepwellState() {
  const [prefs, setPrefs] = useState<UserPreferences>(loadPreferences);
  const [journal, setJournal] = useState<SleepJournalEntry[]>(loadJournal);
  const [activeSounds, setActiveSounds] = useState<SoundId[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);

  // Global sleep timer state (in seconds remaining, null when inactive)
  const [sleepTimerRemainingSec, setSleepTimerRemainingSec] = useState<
    number | null
  >(null);
  const sleepTimerTotalRef = useRef<number>(0);

  // Persist preferences (excluding runtime activeSounds so reopening app is peaceful)
  useEffect(() => {
    try {
      const toStore: UserPreferences = { ...prefs, activeSounds: [] };
      localStorage.setItem(PREFS_KEY, JSON.stringify(toStore));
    } catch {
      // ignore storage quota errors
    }
  }, [prefs]);

  useEffect(() => {
    try {
      localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
    } catch {
      // ignore
    }
  }, [journal]);

  // Clock & session duration ticker
  useEffect(() => {
    const id = window.setInterval(() => {
      setCurrentTime(new Date());
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Sync Web Audio Engine whenever active sounds or volumes change
  useEffect(() => {
    sleepAudio.syncSounds(
      activeSounds,
      prefs.ambientVolumes,
      prefs.masterVolume
    );
  }, [activeSounds, prefs.ambientVolumes, prefs.masterVolume]);

  // Global sleep timer countdown & gradual fade-out
  useEffect(() => {
    if (sleepTimerRemainingSec === null) {
      sleepAudio.setFadeMultiplier(1);
      return;
    }

    const id = window.setInterval(() => {
      setSleepTimerRemainingSec((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          sleepAudio.setFadeMultiplier(0);
          sleepAudio.stopNarration();
          setActiveSounds([]);
          window.setTimeout(() => sleepAudio.setFadeMultiplier(1), 600);
          return null;
        }
        const next = prev - 1;
        // Gradual fade-out over the last 45 seconds (or 25% of timer if shorter)
        const fadeWindow = Math.min(
          45,
          Math.max(10, Math.floor(sleepTimerTotalRef.current * 0.25))
        );
        if (next <= fadeWindow) {
          sleepAudio.setFadeMultiplier(Math.max(0.02, next / fadeWindow));
        } else {
          sleepAudio.setFadeMultiplier(1);
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [sleepTimerRemainingSec !== null]);

  const updatePrefs = useCallback(
    (updater: Partial<UserPreferences> | ((prev: UserPreferences) => UserPreferences)) => {
      setPrefs((prev) =>
        typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      );
    },
    []
  );

  const toggleSound = useCallback((id: SoundId) => {
    setActiveSounds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const setSoundVolume = useCallback((id: SoundId, volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setPrefs((prev) => ({
      ...prev,
      ambientVolumes: { ...prev.ambientVolumes, [id]: clamped },
    }));
    setActiveSounds((prev) => {
      if (clamped > 0 && !prev.includes(id)) {
        return [...prev, id];
      }
      if (clamped === 0 && prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      return prev;
    });
  }, []);

  const applySoundPreset = useCallback(
    (soundsMap: Partial<Record<SoundId, number>>) => {
      const ids = Object.keys(soundsMap) as SoundId[];
      setPrefs((prev) => ({
        ...prev,
        ambientVolumes: { ...prev.ambientVolumes, ...soundsMap },
      }));
      setActiveSounds(ids);
    },
    []
  );

  const stopAllAmbient = useCallback(() => {
    setActiveSounds([]);
  }, []);

  const startPreferredAmbient = useCallback(() => {
    if (activeSounds.length > 0) return;
    // Start user's highest-volume saved sound or rainfall by default
    const entries = Object.entries(prefs.ambientVolumes) as Array<
      [SoundId, number]
    >;
    const sorted = entries
      .filter(([, vol]) => (vol ?? 0) > 0.05)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
    if (sorted.length > 0) {
      setActiveSounds([sorted[0][0]]);
    } else {
      setActiveSounds(['rainfall']);
    }
  }, [activeSounds.length, prefs.ambientVolumes]);

  const startSleepTimer = useCallback((minutes: number) => {
    const secs = Math.max(60, Math.round(minutes * 60));
    sleepTimerTotalRef.current = secs;
    sleepAudio.setFadeMultiplier(1);
    setSleepTimerRemainingSec(secs);
  }, []);

  const cancelSleepTimer = useCallback(() => {
    sleepAudio.setFadeMultiplier(1);
    setSleepTimerRemainingSec(null);
  }, []);

  const addJournalEntry = useCallback(
    (entry: Omit<SleepJournalEntry, 'id'>) => {
      const full: SleepJournalEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
      setJournal((prev) => [full, ...prev]);
    },
    []
  );

  const deleteJournalEntry = useCallback((id: string) => {
    setJournal((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const sleepStreak = useMemo(() => calculateSleepStreak(journal), [journal]);

  return {
    prefs,
    updatePrefs,
    activeSounds,
    toggleSound,
    setSoundVolume,
    applySoundPreset,
    stopAllAmbient,
    startPreferredAmbient,
    currentTime,
    sessionSeconds,
    sleepTimerRemainingSec,
    startSleepTimer,
    cancelSleepTimer,
    journal,
    addJournalEntry,
    deleteJournalEntry,
    sleepStreak,
  };
}
