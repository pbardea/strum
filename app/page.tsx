'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioEngine, ChordEvent, Instrument, StrumFrequency } from '@/lib/audio-engine';
import { getAllKeys, nashvilleToChord, formatNashville, getDiatonicQuality, type Key, type KeyMode, type NashvilleNumber, type ChordQuality } from '@/lib/music-theory';
import ChordBuilder from '@/components/chord-builder';
import Transport from '@/components/transport';
import Fretboard from '@/components/fretboard';

const STORAGE_KEY = 'strum-settings';
const PROGRESSIONS_KEY = 'strum-progressions';
const HIDDEN_PROGRESSIONS_KEY = 'strum-hidden-progressions';

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
  showFretboard: boolean;
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
    name: 'Andalusian Cadence',
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
    name: 'Canon in D (Pachelbel)',
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
    name: 'Hotel California (Eagles)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 1, beats: 0, quality: 'maj' },
      { nashville: 7 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 1, beats: 0, quality: 'maj' },
      { nashville: 6 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 3 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 1, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 1, beats: 0, quality: 'maj' },
    ],
    isPreset: true,
  },
  {
    id: 'preset-peaceful',
    name: 'Peaceful Easy Feeling (Eagles)',
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
    name: 'Desperado (Eagles)',
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
    name: 'Yesterday (Beatles)',
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
    name: 'Let It Be (Beatles)',
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
    name: 'Twist and Shout (Beatles)',
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
    name: 'Hey Jude (Beatles)',
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
    name: 'Pride (U2)',
    chords: [
      { nashville: 1 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 2 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 4 as NashvilleNumber, bars: 4, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-streets',
    name: 'Where The Streets Have No Name (U2)',
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
    name: 'Still Haven\'t Found What I\'m Looking For (U2)',
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
    name: 'Wish You Were Here (Pink Floyd)',
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
    name: 'Breathe (Pink Floyd)',
    chords: [
      { nashville: 6 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 5 as NashvilleNumber, bars: 2, beats: 0 },
      { nashville: 1 as NashvilleNumber, bars: 4, beats: 0 },
    ],
    isPreset: true,
  },
  {
    id: 'preset-comfortably',
    name: 'Comfortably Numb (Pink Floyd)',
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
    name: 'Shine On You Crazy Diamond (Pink Floyd)',
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
    name: 'Time (Pink Floyd)',
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
  showFretboard: true,
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

function loadHiddenProgressions(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(HIDDEN_PROGRESSIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load hidden progressions from localStorage:', e);
  }
  return [];
}

function saveHiddenProgressions(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HIDDEN_PROGRESSIONS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn('Failed to save hidden progressions to localStorage:', e);
  }
}

// URL encoding/decoding for sharing progressions
function encodeProgressionToURL(progression: SavedProgression): string {
  const data = {
    n: progression.name,
    c: progression.chords.map(c => ({
      ...c,
      // Shorten keys for URL
      n: c.nashville,
      b: c.bars,
      t: c.beats,
      q: c.quality,
    })).map(({ n, b, t, q }) => ({ n, b, t, ...(q ? { q } : {}) })),
  };
  const encoded = btoa(JSON.stringify(data));
  return `${window.location.origin}${window.location.pathname}?p=${encodeURIComponent(encoded)}`;
}

function decodeProgressionFromURL(encoded: string): SavedProgression | null {
  try {
    const decoded = JSON.parse(atob(encoded));
    return {
      id: `shared-${Date.now()}`,
      name: decoded.n || 'Shared Progression',
      chords: decoded.c.map((c: { n: number; b: number; t: number; q?: string }) => ({
        nashville: c.n as NashvilleNumber,
        bars: c.b,
        beats: c.t,
        ...(c.q ? { quality: c.q as ChordQuality } : {}),
      })),
    };
  } catch (e) {
    console.warn('Failed to decode progression from URL:', e);
    return null;
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
  const [hiddenProgressionIds, setHiddenProgressionIds] = useState<string[]>([]);
  const [showHiddenSection, setShowHiddenSection] = useState(false);
  const [showFretboard, setShowFretboard] = useState(defaultSettings.showFretboard);

  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Calculate total beats for timeline
  const totalBeats = chords.reduce((sum, chord) => sum + (chord.bars * 4) + chord.beats, 0);

  // All progressions (presets + saved)
  const allProgressions = [...PRESET_PROGRESSIONS, ...savedProgressions];
  
  // Split into visible and hidden
  const visibleProgressions = allProgressions.filter(p => !hiddenProgressionIds.includes(p.id));
  const hiddenProgressions = allProgressions.filter(p => hiddenProgressionIds.includes(p.id));

  // Load settings from localStorage on mount and check for shared URL
  useEffect(() => {
    const settings = loadSettings();
    const savedProgs = loadSavedProgressions();
    const hiddenIds = loadHiddenProgressions();
    
    // Check for shared progression in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedParam = urlParams.get('p');
    
    if (sharedParam) {
      const sharedProgression = decodeProgressionFromURL(sharedParam);
      if (sharedProgression) {
        // Check if we already have this progression (by name)
        const existingByName = [...PRESET_PROGRESSIONS, ...savedProgs].find(
          p => p.name === sharedProgression.name
        );
        
        if (existingByName) {
          // Use existing progression
          setChords(existingByName.chords);
          setCurrentProgressionId(existingByName.id);
        } else {
          // Add to saved progressions
          const updatedProgs = [...savedProgs, sharedProgression];
          setSavedProgressions(updatedProgs);
          saveSavedProgressions(updatedProgs);
          setChords(sharedProgression.chords);
          setCurrentProgressionId(sharedProgression.id);
        }
        
        // Clear URL param without refresh
        window.history.replaceState({}, '', window.location.pathname);
      }
    } else {
      setChords(settings.chords);
      setCurrentProgressionId(settings.currentProgressionId);
    }
    
    setKey(settings.key);
    setMode(settings.mode);
    setTempo(settings.tempo);
    setInstrument(settings.instrument);
    setStrumFrequency(settings.strumFrequency);
    setChordVolume(settings.chordVolume);
    setMetronomeVolume(settings.metronomeVolume);
    setBassVolume(settings.bassVolume);
    setShowFretboard(settings.showFretboard ?? true);
    setSavedProgressions(savedProgs);
    setHiddenProgressionIds(hiddenIds);
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

  useEffect(() => {
    if (isLoaded) {
      saveSettings({ showFretboard });
    }
  }, [showFretboard, isLoaded]);

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
    // Also remove from hidden if it was hidden
    if (hiddenProgressionIds.includes(progressionId)) {
      const updatedHidden = hiddenProgressionIds.filter(id => id !== progressionId);
      setHiddenProgressionIds(updatedHidden);
      saveHiddenProgressions(updatedHidden);
    }
  };

  const handleHideProgression = (progressionId: string) => {
    const updated = [...hiddenProgressionIds, progressionId];
    setHiddenProgressionIds(updated);
    saveHiddenProgressions(updated);
  };

  const handleUnhideProgression = (progressionId: string) => {
    const updated = hiddenProgressionIds.filter(id => id !== progressionId);
    setHiddenProgressionIds(updated);
    saveHiddenProgressions(updated);
  };

  const handleShareProgression = async () => {
    const currentProg = allProgressions.find(p => p.id === currentProgressionId);
    const progression: SavedProgression = currentProg || {
      id: 'custom',
      name: 'Custom Progression',
      chords: chords,
    };
    
    const url = encodeProgressionToURL(progression);
    
    try {
      await navigator.clipboard.writeText(url);
      // Could add a toast notification here
      alert('Link copied to clipboard!');
    } catch (e) {
      // Fallback for older browsers
      prompt('Copy this link to share:', url);
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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold mb-1 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Strum
          </h1>
          <p className="text-zinc-500 text-sm">Pentatonic Practice Partner</p>
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

        {/* Settings Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
              max="300"
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

        {/* Chord Tones Fretboard */}
        <div className="mb-6">
          <button
            onClick={() => setShowFretboard(!showFretboard)}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors mb-2"
          >
            <svg 
              className={`w-3 h-3 transition-transform ${showFretboard ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showFretboard ? 'Hide' : 'Show'} Fretboard
          </button>
          
          {showFretboard && (() => {
            const currentChord = chords[currentChordIndex] || chords[0];
            if (!currentChord) return null;
            const chordInfo = nashvilleToChord(currentChord.nashville, key, mode, currentChord.quality);
            return (
              <Fretboard 
                scaleRoot={key}
                scaleMode={mode}
                chordRoot={chordInfo.root as Key} 
                chordQuality={chordInfo.quality} 
                chordName={chordInfo.name}
              />
            );
          })()}
        </div>

        {/* Progression Selector */}
        <div className="mb-6 bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-zinc-400 font-medium">Progression</p>
            <div className="flex gap-2">
              <button
                onClick={handleShareProgression}
                className="px-3 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-1"
                title="Copy shareable link"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
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
            {visibleProgressions.map((prog) => (
              <div
                key={prog.id}
                className={`relative group rounded-lg transition-all ${
                  currentProgressionId === prog.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                }`}
              >
                <button
                  onClick={() => handleSelectProgression(prog.id)}
                  title={prog.name}
                  className="w-full px-3 py-2 text-xs text-left pr-12"
                >
                  <span className="block truncate">{prog.name}</span>
                </button>
                <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHideProgression(prog.id);
                    }}
                    className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-200 rounded text-[10px]"
                    title="Hide progression"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                  {!prog.isPreset && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProgression(prog.id);
                      }}
                      className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-400 rounded"
                      title="Delete progression"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
            {currentProgressionId === null && (
              <div className="px-3 py-2 text-xs rounded-lg bg-zinc-600 text-amber-400 border border-amber-500/50">
                Custom (unsaved)
              </div>
            )}
          </div>
          
          {/* Hidden Progressions Section */}
          {hiddenProgressions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-700">
              <button
                onClick={() => setShowHiddenSection(!showHiddenSection)}
                className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                <svg 
                  className={`w-3 h-3 transition-transform ${showHiddenSection ? 'rotate-90' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Hidden ({hiddenProgressions.length})
              </button>
              
              {showHiddenSection && (
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {hiddenProgressions.map((prog) => (
                    <div
                      key={prog.id}
                      className="relative group rounded-lg bg-zinc-800 text-zinc-500 border border-zinc-700"
                    >
                      <button
                        onClick={() => handleSelectProgression(prog.id)}
                        title={prog.name}
                        className="w-full px-3 py-2 text-xs text-left pr-12"
                      >
                        <span className="block truncate">{prog.name}</span>
                      </button>
                      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnhideProgression(prog.id);
                          }}
                          className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 rounded text-[10px]"
                          title="Show progression"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {!prog.isPreset && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProgression(prog.id);
                            }}
                            className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-red-400 rounded"
                            title="Delete progression"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chord Builder */}
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <ChordBuilder chords={chords} mode={mode} onChange={handleChordChange} />
        </div>
      </div>
    </div>
  );
}
