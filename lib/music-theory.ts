export type Key = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type KeyMode = 'major' | 'minor';

export type NashvilleNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ChordQuality = 'maj' | 'min' | 'dim';

export interface Chord {
  root: string;
  quality: ChordQuality;
  name: string;
}

// Diatonic chord qualities for major scale
const MAJOR_DIATONIC_QUALITIES: Record<NashvilleNumber, ChordQuality> = {
  1: 'maj',
  2: 'min',
  3: 'min',
  4: 'maj',
  5: 'maj',
  6: 'min',
  7: 'dim',
};

// Diatonic chord qualities for natural minor scale
const MINOR_DIATONIC_QUALITIES: Record<NashvilleNumber, ChordQuality> = {
  1: 'min',
  2: 'dim',
  3: 'maj',
  4: 'min',
  5: 'min',  // Natural minor has minor v; harmonic minor would have major V
  6: 'maj',
  7: 'maj',
};

// Chromatic scale starting from C
const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Major scale intervals (semitones from root)
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

// Natural minor scale intervals (semitones from root)
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

/**
 * Get the index of a key in the chromatic scale
 */
function getKeyIndex(key: Key): number {
  return CHROMATIC_NOTES.indexOf(key);
}

/**
 * Get diatonic qualities based on mode
 */
function getDiatonicQualities(mode: KeyMode): Record<NashvilleNumber, ChordQuality> {
  return mode === 'minor' ? MINOR_DIATONIC_QUALITIES : MAJOR_DIATONIC_QUALITIES;
}

/**
 * Get scale intervals based on mode
 */
function getScaleIntervals(mode: KeyMode): number[] {
  return mode === 'minor' ? MINOR_SCALE_INTERVALS : MAJOR_SCALE_INTERVALS;
}

/**
 * Convert Nashville number to actual chord in a given key and mode
 * Optionally override the diatonic quality (e.g., 3maj instead of 3min)
 */
export function nashvilleToChord(nashville: NashvilleNumber, key: Key, mode: KeyMode = 'major', qualityOverride?: ChordQuality): Chord {
  const keyIndex = getKeyIndex(key);
  const scaleDegree = nashville - 1; // Convert to 0-based index
  const intervals = getScaleIntervals(mode);
  const semitones = intervals[scaleDegree];
  const chordRootIndex = (keyIndex + semitones) % 12;
  const chordRoot = CHROMATIC_NOTES[chordRootIndex];
  const diatonicQualities = getDiatonicQualities(mode);
  const quality = qualityOverride ?? diatonicQualities[nashville];

  return {
    root: chordRoot,
    quality,
    name: `${chordRoot}${quality === 'maj' ? '' : quality === 'min' ? 'm' : '°'}`,
  };
}

/**
 * Format Nashville notation with quality suffix
 */
export function formatNashville(nashville: NashvilleNumber, mode: KeyMode = 'major', quality?: ChordQuality): string {
  if (!quality) return String(nashville);
  const diatonicQualities = getDiatonicQualities(mode);
  const diatonic = diatonicQualities[nashville];
  if (quality === diatonic) return String(nashville); // No suffix needed if it's the default
  return `${nashville}${quality}`;
}

/**
 * Get the diatonic (default) quality for a Nashville number in a given mode
 */
export function getDiatonicQuality(nashville: NashvilleNumber, mode: KeyMode = 'major'): ChordQuality {
  const diatonicQualities = getDiatonicQualities(mode);
  return diatonicQualities[nashville];
}

/**
 * Get all available keys
 */
export function getAllKeys(): Key[] {
  return CHROMATIC_NOTES as Key[];
}

/**
 * Convert chord to MIDI note numbers (for guitar voicing)
 * Returns notes for a full 6-string guitar chord voicing
 * Guitar chords typically span 2 octaves and include doubled notes
 */
export function chordToMidiNotes(chord: Chord, octave: number = 3): number[] {
  const rootIndex = getKeyIndex(chord.root as Key);
  const baseNote = (octave * 12) + rootIndex;
  
  // Guitar voicings - 6 notes spanning ~2 octaves like real guitar chords
  // These mimic common open/barre chord shapes
  let voicing: number[];
  
  switch (chord.quality) {
    case 'maj':
      // Major chord voicing: Root, 5th, Root+8va, 3rd, 5th, Root+8va
      // Like an open E or A shape barre chord
      voicing = [
        0,      // Root (low E string position)
        7,      // Perfect 5th (A string)
        12,     // Root + octave (D string)  
        16,     // Major 3rd + octave (G string)
        19,     // Perfect 5th + octave (B string)
        24,     // Root + 2 octaves (high E string)
      ];
      break;
    case 'min':
      // Minor chord voicing: Root, 5th, Root+8va, m3rd, 5th, Root+8va
      voicing = [
        0,      // Root
        7,      // Perfect 5th
        12,     // Root + octave
        15,     // Minor 3rd + octave
        19,     // Perfect 5th + octave
        24,     // Root + 2 octaves
      ];
      break;
    case 'dim':
      // Diminished chord voicing: Root, dim5th, Root+8va, m3rd, dim5th
      voicing = [
        0,      // Root
        6,      // Diminished 5th
        12,     // Root + octave
        15,     // Minor 3rd + octave
        18,     // Diminished 5th + octave
        24,     // Root + 2 octaves
      ];
      break;
  }

  return voicing.map(interval => baseNote + interval);
}
