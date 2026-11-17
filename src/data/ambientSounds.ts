import { AmbientSoundInfo, SoundId } from '../types';

export const AMBIENT_SOUNDS: AmbientSoundInfo[] = [
  // Nature
  {
    id: 'rainfall',
    name: 'Gentle Rainfall',
    category: 'Nature',
    description: 'Soft, steady rain falling onto distant leaves and pavement.',
  },
  {
    id: 'forest',
    name: 'Forest Ambience',
    category: 'Nature',
    description: 'Quiet nocturnal woods with subtle foliage movement.',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    category: 'Nature',
    description: 'Slow, rhythmic surf rolling gently onto a flat shore.',
  },
  {
    id: 'river',
    name: 'Flowing River',
    category: 'Nature',
    description: 'Smooth water moving continuously over rounded stones.',
  },
  {
    id: 'crickets',
    name: 'Night Crickets',
    category: 'Nature',
    description: 'Warm late-evening cricket song in a calm field.',
  },
  {
    id: 'wind',
    name: 'Gentle Wind',
    category: 'Nature',
    description: 'Low, drifting air currents across open ground.',
  },

  // White Noise
  {
    id: 'white-noise',
    name: 'White Noise',
    category: 'White Noise',
    description: 'Evenly distributed acoustic blanket, softly smoothed.',
  },
  {
    id: 'pink-noise',
    name: 'Pink Noise',
    category: 'White Noise',
    description: 'Balanced, natural frequency curve softer than white noise.',
  },
  {
    id: 'brown-noise',
    name: 'Brown Noise',
    category: 'White Noise',
    description: 'Deep, warm low-frequency rumble like distant thunder.',
  },
  {
    id: 'fan',
    name: 'Fan Sound',
    category: 'White Noise',
    description: 'Consistent bedroom box-fan hum with steady airflow.',
  },
  {
    id: 'ac',
    name: 'Air Conditioner',
    category: 'White Noise',
    description: 'Low, uninterrupted indoor cooling unit murmur.',
  },

  // Indoor
  {
    id: 'fireplace',
    name: 'Gentle Fireplace',
    category: 'Indoor',
    description: 'Quiet hearth warmth with occasional soft ember crackles.',
  },
  {
    id: 'clock',
    name: 'Clock Ticking',
    category: 'Indoor',
    description: 'Muted wooden pendulum tick at a calm, unhurried pace.',
  },
  {
    id: 'room',
    name: 'Soft Room Ambience',
    category: 'Indoor',
    description: 'Ultra-quiet indoor stillness that masks sudden silence.',
  },
];

export interface SoundPreset {
  id: string;
  name: string;
  description: string;
  sounds: Partial<Record<SoundId, number>>;
}

export const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'rainy-window',
    name: 'Rainy Window',
    description: 'Gentle rain paired with quiet room stillness.',
    sounds: { rainfall: 0.65, room: 0.35 },
  },
  {
    id: 'deep-drift',
    name: 'Deep Brown Drift',
    description: 'Warm brown noise blended with distant ocean waves.',
    sounds: { 'brown-noise': 0.55, ocean: 0.45 },
  },
  {
    id: 'midnight-hearth',
    name: 'Quiet Cabin',
    description: 'Soft fireplace embers, wind, and muted clock tick.',
    sounds: { fireplace: 0.55, wind: 0.3, clock: 0.22 },
  },
  {
    id: 'summer-field',
    name: 'Late Night Meadow',
    description: 'Night crickets beside a slow-moving river.',
    sounds: { crickets: 0.4, river: 0.5 },
  },
];
