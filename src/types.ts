export type AppView =
  | 'home'
  | 'reading'
  | 'narration'
  | 'eyes'
  | 'clear-mind'
  | 'random-thought'
  | 'ambient'
  | 'start-sleeping'
  | 'journal'
  | 'settings';

export type SoundCategory = 'Nature' | 'White Noise' | 'Indoor';

export type SoundId =
  | 'rainfall'
  | 'forest'
  | 'ocean'
  | 'river'
  | 'crickets'
  | 'wind'
  | 'white-noise'
  | 'pink-noise'
  | 'brown-noise'
  | 'fan'
  | 'ac'
  | 'fireplace'
  | 'clock'
  | 'room';

export interface AmbientSoundInfo {
  id: SoundId;
  name: string;
  category: SoundCategory;
  description: string;
}

export type ThemeId = 'midnight' | 'rain' | 'mist' | 'obsidian';

export type NarrationSpeed = 'extra-slow' | 'slow' | 'normal';

export type RelaxationActivityId =
  | 'reading'
  | 'narration'
  | 'eyes'
  | 'clear-mind'
  | 'random-thought';

export interface UserPreferences {
  ambientVolumes: Partial<Record<SoundId, number>>;
  activeSounds: SoundId[];
  masterVolume: number;
  narrationVoiceURI: string;
  narrationSpeed: NarrationSpeed;
  narrationVolume: number;
  backgroundTheme: ThemeId;
  sleepTimerMinutes: 15 | 30 | 45 | 60;
  randomObjectIntervalSec: number;
  randomObjectSlowdown: boolean;
  screenBrightness: number; // 30 to 100
  nightModeWarmth: boolean;
  preferredActivity: RelaxationActivityId;
  readingFontSize: 'sm' | 'md' | 'lg' | 'xl';
  readingAutoScrollSpeed: 'off' | 'very-slow' | 'slow' | 'steady';
}

export interface SleepJournalEntry {
  id: string;
  dateISO: string; // YYYY-MM-DD
  bedtime: string; // HH:MM
  minutesToFallAsleep: number;
  relaxationRating: 1 | 2 | 3 | 4 | 5;
  sleepQualityRating: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

export type BoringCategoryCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export interface BoringPassage {
  id: string;
  categoryCode: BoringCategoryCode;
  categoryName: string;
  title: string;
  paragraphs: string[];
}

export type ThoughtMode =
  | 'objects'
  | 'animals'
  | 'places'
  | 'colors'
  | 'mixed';

export interface ThoughtItem {
  id: string;
  label: string;
  category: 'objects' | 'animals' | 'places' | 'colors';
  detail: string;
  accentHex?: string;
  illustrationKey: string;
}
