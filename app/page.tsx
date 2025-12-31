'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioEngine, ChordEvent, Instrument, StrumFrequency } from '@/lib/audio-engine';
import { getAllKeys, nashvilleToChord, formatNashville, getDiatonicQuality, type Key, type KeyMode, type NashvilleNumber, type ChordQuality } from '@/lib/music-theory';
import ChordBuilder from '@/components/chord-builder';
import Transport from '@/components/transport';

const STORAGE_KEY = 'strum-settings';
const PROGRESSIONS_KEY = 'strum-progressions';

interface StoredSettings {
  key: Key;
  mode: KeyMode;
  chords: ChordEvent[];
  tempo: number;
  instrument: Instrument;
  strumFrequency: StrumFrequency;
  chordVolume: number;
  metronomeVolume: number;
  bassVolume: number;
  currentProgressionId: string | null;
}

interface SavedProgression {
  id: string;
  name: string;
  chords: ChordEvent[];
  isPreset?: boolean;
}

// Pre-populated well-known progressions
const PRESET_PROGRESSIONS: SavedProgression[] = [
  // Classic & Basic
  {
    id: 'preset-1451',
    name: '1-4-5-1 (Classic)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-145',
    name: '1-4-5 (Three Chord)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 4, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 4, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 4, beats: 0 },
    ],
    isPreset: true,
  },
  // Pop
  {
    id: 'preset-1564',
    name: '1-5-6-4 (Pop/Axis)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-1645',
    name: '1-6-4-5 (50s Doo-Wop)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-6415',
    name: '6-4-1-5 (Emotional)',
    chords: [
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-4156',
    name: '4-1-5-6 (Lift)',
    chords: [
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  // Country & Folk
  {
    id: 'preset-1415',
    name: '1-4-1-5 (Country)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-1545',
    name: '1-5-4-5 (Folk)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  // Jazz
  {
    id: 'preset-251',
    name: '2-5-1 (Jazz)',
    chords: [
      { nashville: 2 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 4, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-1625',
    name: '1-6-2-5 (Jazz/Soul)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 2 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-3625',
    name: '3-6-2-5 (Rhythm Changes)',
    chords: [
      { nashville: 3 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 2 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  // Blues
  {
    id: 'preset-12bar',
    name: '12-Bar Blues',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 4, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-8bar',
    name: '8-Bar Blues',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  // Rock
  {
    id: 'preset-1544',
    name: '1-5-4-4 (Rock)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 4, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-punk',
    name: '1-4-5-5 (Punk)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 4, beats: 0 },
    ],
    isPreset: true,
  },
  // Minor Key / Modal
  {
    id: 'preset-andalusian',
    name: '6-5-4-3maj (Andalusian)',
    chords: [
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 3 as NashvilleNumber, bars: 2, beats: 0, quality: 'maj' },
    ],
    isPreset: true,
  },
  {
    id: 'preset-6-4-5',
    name: '6-4-5 (Dark)',
    chords: [
      { nashville: 6 as NashvilleNumber, bars: 4, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  // Pachelbel & Canon-style
  {
    id: 'preset-canon',
    name: '1-5-6-3-4-1-4-5 (Canon)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 3 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 1, beats: 0 },
    ],
    isPreset: true,
  },
  // Reggae
  {
    id: 'preset-reggae',
    name: '1-4-5-4 (Reggae)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  // Bossa Nova
  {
    id: 'preset-bossa',
    name: '1-2-5-1 (Bossa)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 2 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  // Classic Rock & Ballads
  {
    id: 'preset-sensitive',
    name: '1-5-6-4 x2 (Sensitive)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 1, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-hotel',
    name: '6-3maj-6-3maj-4-1-2-5 (Hotel)',
    chords: [
      { nashville: 6 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 3 as NashvilleNumber, bars: 1, beats: 0, quality: 'maj' },
      { nashville: 6 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 3 as NashvilleNumber, bars: 1, beats: 0, quality: 'maj' },
      { nashville: 4 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 2 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 1, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-peaceful',
    name: '1-5-4-1 (Peaceful Easy)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-desperado',
    name: '1-3-4-1 (Ballad)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 3 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-yesterday',
    name: '1-7dim-3-6-2-4-1 (Yesterday)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 7 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 3 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 2 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-letitbe',
    name: '1-5-6-4 (Let It)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-twist',
    name: '1-4-5-4 (Twist)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-hey',
    name: '4-1-5-5 (Hey Anthem)',
    chords: [
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 4, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-irish',
    name: '1-4-1-5 (Irish Folk)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-pride',
    name: '1-2-4-4 (Pride)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 2 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 4, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-streets',
    name: '1-6-4-5 (Streets)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-still',
    name: '1-4-6-5 (Still Haven\'t)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-wish',
    name: '6-4-1-5 (Wish)',
    chords: [
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-breathe',
    name: '6-5-1-1 (Breathe)',
    chords: [
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 4, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-comfortably',
    name: '6-1-4-1 (Comfortably)',
    chords: [
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-shine',
    name: '6-3-6-5 (Shine On)',
    chords: [
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 3 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-time',
    name: '6-2-5-1 (Time)',
    chords: [
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 2 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  // Extended Progressions
  {
    id: 'preset-descending',
    name: '1-7dim-6-5 (Descending)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 7 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-tension',
    name: '6-4-3maj-5 (Tension)',
    chords: [
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 3 as NashvilleNumber, bars: 2, beats: 0, quality: 'maj' },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-flamenco',
    name: '6-5maj-4-3maj (Flamenco)',
    chords: [
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0, quality: 'maj' },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 3 as NashvilleNumber, bars: 2, beats: 0, quality: 'maj' },
    ],
    isPreset: true,
  },
  {
    id: 'preset-minor-blues',
    name: '6-6-2-2-3-5-6-5 (Minor Blues)',
    chords: [
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 2 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 2 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 3 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 6 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 1, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-motown',
    name: '1-1-4-4-5-4-1-5 (Motown)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 1, beats: 0 },
    ],
    isPreset: true,
  },
];

const defaultSettings: StoredSettings = {
  key: 'C',
  mode: 'major',
  chords: PRESET_PROGRESSIONS[0].chords,
  tempo: 120,
  instrument: 'pluck',
  strumFrequency: 4,
  chordVolume: 80,
  metronomeVolume: 50,
  bassVolume: 60,
  currentProgressionId: PRESET_PROGRESSIONS[0].id,
};

function loadSettings(): StoredSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load settings from localStorage:', e);
  }
  return defaultSettings;
}

function saveSettings(settings: Partial<StoredSettings>) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }
}

function loadSavedProgressions(): SavedProgression[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PROGRESSIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load progressions from localStorage:', e);
  }
  return [];
}

function saveSavedProgressions(progressions: SavedProgression[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROGRESSIONS_KEY, JSON.stringify(progressions));
  } catch (e) {
    console.warn('Failed to save progressions to localStorage:', e);
  }
}

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [key, setKey] = useState<Key>(defaultSettings.key);
  const [mode, setMode] = useState<KeyMode>(defaultSettings.mode);
  const [chords, setChords] = useState<ChordEvent[]>(defaultSettings.chords);
  const [tempo, setTempo] = useState(defaultSettings.tempo);
  const [instrument, setInstrument] = useState<Instrument>(defaultSettings.instrument);
  const [strumFrequency, setStrumFrequency] = useState<StrumFrequency>(defaultSettings.strumFrequency);
  const [chordVolume, setChordVolume] = useState(defaultSettings.chordVolume);
  const [metronomeVolume, setMetronomeVolume] = useState(defaultSettings.metronomeVolume);
  const [bassVolume, setBassVolume] = useState(defaultSettings.bassVolume);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [currentChordName, setCurrentChordName] = useState('');
  const [progress, setProgress] = useState(0);
  
  // Progression management
  const [savedProgressions, setSavedProgressions] = useState<SavedProgression[]>([]);
  const [currentProgressionId, setCurrentProgressionId] = useState<string | null>(defaultSettings.currentProgressionId);
  const [newProgressionName, setNewProgressionName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Calculate total beats for timeline
  const totalBeats = chords.reduce((sum, chord) => sum + (chord.bars * 4) + chord.beats, 0);

  // All progressions (presets + saved)
  const allProgressions = [...PRESET_PROGRESSIONS, ...savedProgressions];

  // Load settings from localStorage on mount
  useEffect(() => {
    const settings = loadSettings();
    setKey(settings.key);
    setMode(settings.mode);
    setChords(settings.chords);
    setTempo(settings.tempo);
    setInstrument(settings.instrument);
    setStrumFrequency(settings.strumFrequency);
    setChordVolume(settings.chordVolume);
    setMetronomeVolume(settings.metronomeVolume);
    setBassVolume(settings.bassVolume);
    setCurrentProgressionId(settings.currentProgressionId);
    setSavedProgressions(loadSavedProgressions());
    setIsLoaded(true);
  }, []);

  // Initialize audio engine
  useEffect(() => {
    audioEngineRef.current = new AudioEngine();
    const engine = audioEngineRef.current;

    engine.setChordChangeCallback((nashville, chordName, index) => {
      setCurrentChordName(chordName);
      setCurrentChordIndex(index);
    });

    engine.setBeatChangeCallback(() => {});

    engine.setProgressChangeCallback((prog) => {
      setProgress(prog);
    });

    return () => {
      engine.stop();
    };
  }, []);

  // Sync settings with audio engine and save to localStorage
  useEffect(() => {
    if (audioEngineRef.current && isLoaded) {
      audioEngineRef.current.setKey(key);
      audioEngineRef.current.setMode(mode);
      audioEngineRef.current.setChordProgression(chords);
      saveSettings({ key, mode, chords, currentProgressionId });
    }
  }, [key, mode, chords, currentProgressionId, isLoaded]);

  useEffect(() => {
    if (audioEngineRef.current && isLoaded) {
      audioEngineRef.current.setTempo(tempo);
      saveSettings({ tempo });
    }
  }, [tempo, isLoaded]);

  useEffect(() => {
    if (audioEngineRef.current && isLoaded) {
      audioEngineRef.current.setInstrument(instrument);
      saveSettings({ instrument });
    }
  }, [instrument, isLoaded]);

  useEffect(() => {
    if (audioEngineRef.current && isLoaded) {
      audioEngineRef.current.setStrumFrequency(strumFrequency);
      saveSettings({ strumFrequency });
    }
  }, [strumFrequency, isLoaded]);

  useEffect(() => {
    if (audioEngineRef.current && isLoaded) {
      audioEngineRef.current.setInstrumentVolume(chordVolume);
      saveSettings({ chordVolume });
    }
  }, [chordVolume, isLoaded]);

  useEffect(() => {
    if (audioEngineRef.current && isLoaded) {
      audioEngineRef.current.setMetronomeVolume(metronomeVolume);
      saveSettings({ metronomeVolume });
    }
  }, [metronomeVolume, isLoaded]);

  useEffect(() => {
    if (audioEngineRef.current && isLoaded) {
      audioEngineRef.current.setBassVolume(bassVolume);
      saveSettings({ bassVolume });
    }
  }, [bassVolume, isLoaded]);

  const handlePlay = async () => {
    if (audioEngineRef.current) {
      await audioEngineRef.current.start();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.stop();
      setIsPlaying(false);
      setProgress(0);
    }
  };

  const handleChordChange = (newChords: ChordEvent[]) => {
    setChords(newChords);
    setCurrentProgressionId(null); // Mark as custom/modified
    if (newChords.length > 0) {
      setCurrentChordIndex(0);
      const firstChord = nashvilleToChord(newChords[0].nashville, key, mode, newChords[0].quality);
      setCurrentChordName(firstChord.name);
    }
  };

  const handleSelectProgression = (progressionId: string) => {
    // Auto-pause when selecting a new progression
    if (isPlaying) {
      handlePause();
    }
    
    const progression = allProgressions.find(p => p.id === progressionId);
    if (progression) {
      setChords(progression.chords);
      setCurrentProgressionId(progressionId);
      if (progression.chords.length > 0) {
        const firstChord = nashvilleToChord(progression.chords[0].nashville, key, mode, progression.chords[0].quality);
        setCurrentChordName(firstChord.name);
      }
    }
  };

  const handleSaveProgression = () => {
    if (!newProgressionName.trim()) return;
    
    const newProgression: SavedProgression = {
      id: `custom-${Date.now()}`,
      name: newProgressionName.trim(),
      chords: [...chords],
    };
    
    const updated = [...savedProgressions, newProgression];
    setSavedProgressions(updated);
    saveSavedProgressions(updated);
    setCurrentProgressionId(newProgression.id);
    setNewProgressionName('');
    setShowSaveDialog(false);
  };

  const handleDeleteProgression = (progressionId: string) => {
    const updated = savedProgressions.filter(p => p.id !== progressionId);
    setSavedProgressions(updated);
    saveSavedProgressions(updated);
    if (currentProgressionId === progressionId) {
      setCurrentProgressionId(null);
    }
  };

  // Calculate chord positions for timeline
  const getChordPositions = () => {
    const positions: { chord: ChordEvent; chordInfo: ReturnType<typeof nashvilleToChord>; nashvilleDisplay: string; startPercent: number; widthPercent: number; index: number }[] = [];
    let beatOffset = 0;
    
    chords.forEach((chord, index) => {
      const chordBeats = (chord.bars * 4) + chord.beats;
      const startPercent = (beatOffset / totalBeats) * 100;
      const widthPercent = (chordBeats / totalBeats) * 100;
      const chordInfo = nashvilleToChord(chord.nashville, key, mode, chord.quality);
      const nashvilleDisplay = formatNashville(chord.nashville, mode, chord.quality);
      
      positions.push({ chord, chordInfo, nashvilleDisplay, startPercent, widthPercent, index });
      beatOffset += chordBeats;
    });
    
    return positions;
  };

  const currentProgressionName = currentProgressionId 
    ? allProgressions.find(p => p.id === currentProgressionId)?.name 
    : 'Custom';

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold mb-1 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Strum
          </h1>
          <p className="text-zinc-500 text-sm">Pentatonic Practice Companion</p>
        </header>

        {/* Transport at Top */}
        <div className="flex justify-center mb-6">
          <Transport isPlaying={isPlaying} onPlay={handlePlay} onPause={handlePause} />
        </div>

        {/* Current Chord + Volume Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Current Chord Display */}
          <div className="md:col-span-1 flex flex-col justify-center items-center py-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <p className="text-xs text-zinc-500 mb-1">Current Chord</p>
            <p className={`text-4xl font-bold transition-colors ${isPlaying ? 'text-amber-400' : 'text-zinc-600'}`}>
              {currentChordName || nashvilleToChord(chords[0]?.nashville || 1, key, mode, chords[0]?.quality).name}
            </p>
            {chords[currentChordIndex] && (
              <p className="text-xs text-zinc-500 mt-1">
                Nashville: {formatNashville(chords[currentChordIndex].nashville, mode, chords[currentChordIndex].quality)}
              </p>
            )}
          </div>

          {/* Volume Controls - Compact */}
          <div className="md:col-span-2 bg-zinc-800 rounded-lg p-3 border border-zinc-700">
            <p className="text-xs text-zinc-400 font-medium mb-2">Volume</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  🎸 Chords: {chordVolume}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={chordVolume}
                  onChange={(e) => setChordVolume(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  🎸 Bass: {bassVolume}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bassVolume}
                  onChange={(e) => setBassVolume(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  🎵 Click: {metronomeVolume}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={metronomeVolume}
                  onChange={(e) => setMetronomeVolume(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="mb-6 bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <div className="relative h-16 bg-zinc-900 rounded-lg overflow-hidden">
            {/* Chord segments */}
            {getChordPositions().map(({ chord, chordInfo, nashvilleDisplay, startPercent, widthPercent, index }) => (
              <div
                key={index}
                className={`absolute top-0 h-full flex flex-col items-center justify-center border-r border-zinc-700 transition-colors ${
                  index === currentChordIndex && isPlaying
                    ? 'bg-amber-500/30'
                    : 'bg-zinc-800'
                }`}
                style={{
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`,
                }}
              >
                <span className={`text-lg font-bold ${
                  index === currentChordIndex && isPlaying ? 'text-amber-400' : 'text-zinc-300'
                }`}>
                  {nashvilleDisplay}
                </span>
                <span className={`text-xs ${
                  index === currentChordIndex && isPlaying ? 'text-amber-300' : 'text-zinc-500'
                }`}>
                  ({chordInfo.name})
                </span>
              </div>
            ))}
            
            {/* Playhead cursor */}
            <div
              className="absolute top-0 h-full w-0.5 bg-amber-500 shadow-lg shadow-amber-500/50 transition-all duration-75"
              style={{
                left: `${progress * 100}%`,
                opacity: isPlaying ? 1 : 0,
              }}
            />
          </div>
          
          {/* Beat markers */}
          <div className="relative h-2 mt-1">
            {Array.from({ length: totalBeats }).map((_, i) => (
              <div
                key={i}
                className={`absolute w-px h-full ${i % 4 === 0 ? 'bg-zinc-500' : 'bg-zinc-700'}`}
                style={{ left: `${(i / totalBeats) * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Progression Selector */}
        <div className="mb-6 bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-zinc-400 font-medium">Progression</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="px-3 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                disabled={isPlaying}
              >
                Save As...
              </button>
            </div>
          </div>
          
          {/* Save Dialog */}
          {showSaveDialog && (
            <div className="mb-3 p-3 bg-zinc-900 rounded-lg border border-zinc-600">
              <input
                type="text"
                value={newProgressionName}
                onChange={(e) => setNewProgressionName(e.target.value)}
                placeholder="Progression name..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProgression}
                  className="px-3 py-1 text-xs bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => { setShowSaveDialog(false); setNewProgressionName(''); }}
                  className="px-3 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Progression List */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {allProgressions.map((prog) => (
              <button
                key={prog.id}
                onClick={() => handleSelectProgression(prog.id)}
                title={prog.name}
                className={`relative px-3 py-2 text-xs rounded-lg transition-all text-left ${
                  currentProgressionId === prog.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                }`}
              >
                <span className="block truncate">{prog.name}</span>
                {!prog.isPreset && currentProgressionId !== prog.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProgression(prog.id);
                    }}
                    className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-red-400 rounded"
                  >
                    ×
                  </button>
                )}
              </button>
            ))}
            {currentProgressionId === null && (
              <div className="px-3 py-2 text-xs rounded-lg bg-zinc-600 text-amber-400 border border-amber-500/50">
                Custom (unsaved)
              </div>
            )}
          </div>
        </div>

        {/* Settings Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Key</label>
            <select
              value={`${key}-${mode}`}
              onChange={(e) => {
                const [newKey, newMode] = e.target.value.split('-') as [Key, KeyMode];
                setKey(newKey);
                setMode(newMode);
              }}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {getAllKeys().map((k) => (
                <optgroup key={k} label={k}>
                  <option value={`${k}-major`}>{k} Major</option>
                  <option value={`${k}-minor`}>{k} Minor</option>
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Tempo: {tempo} BPM</label>
            <input
              type="range"
              min="60"
              max="200"
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Instrument</label>
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value as Instrument)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              disabled={isPlaying}
            >
              <option value="pluck">Acoustic Guitar</option>
              <option value="clean-guitar">Electric Guitar</option>
              <option value="synth">Synth</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Strum Every</label>
            <select
              value={strumFrequency}
              onChange={(e) => setStrumFrequency(parseInt(e.target.value) as StrumFrequency)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value={1}>1 Beat</option>
              <option value={2}>2 Beats</option>
              <option value={4}>4 Beats (Measure)</option>
            </select>
          </div>
        </div>

        {/* Chord Builder */}
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <ChordBuilder chords={chords} mode={mode} onChange={handleChordChange} />
        </div>
      </div>
    </div>
  );
}
