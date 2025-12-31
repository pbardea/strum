export type Key = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type NashvilleNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ChordQuality = 'maj' | 'min' | 'dim';

export interface Chord {
  root: string;
  quality: ChordQuality;
  name: string;
}

// Diatonic chord qualities for major scale
const DIATONIC_QUALITIES: Record<NashvilleNumber, ChordQuality> = {
  1: 'maj',
  2: 'min',
  3: 'min',
  4: 'maj',
  5: 'maj',
  6: 'min',
  7: 'dim',
};

// Chromatic scale starting from C
const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Major scale intervals (semitones from root)
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

/**
 * Get the index of a key in the chromatic scale
 */
function getKeyIndex(key: Key): number {
  return CHROMATIC_NOTES.indexOf(key);
}

/**
 * Convert Nashville number to actual chord in a given key
 * Optionally override the diatonic quality (e.g., 3maj instead of 3min)
 */
export function nashvilleToChord(nashville: NashvilleNumber, key: Key, qualityOverride?: ChordQuality): Chord {
  const keyIndex = getKeyIndex(key);
  const scaleDegree = nashville - 1; // Convert to 0-based index
  const semitones = MAJOR_SCALE_INTERVALS[scaleDegree];
  const chordRootIndex = (keyIndex + semitones) % 12;
  const chordRoot = CHROMATIC_NOTES[chordRootIndex];
  const quality = qualityOverride ?? DIATONIC_QUALITIES[nashville];

  return {
    root: chordRoot,
    quality,
    name: `${chordRoot}${quality === 'maj' ? '' : quality === 'min' ? 'm' : '°'}`,
  };
}

/**
 * Format Nashville notation with quality suffix
 */
export function formatNashville(nashville: NashvilleNumber, quality?: ChordQuality): string {
  if (!quality) return String(nashville);
  const diatonic = DIATONIC_QUALITIES[nashville];
  if (quality === diatonic) return String(nashville); // No suffix needed if it's the default
  return `${nashville}${quality}`;
}

/**
 * Get the diatonic (default) quality for a Nashville number
 */
export function getDiatonicQuality(nashville: NashvilleNumber): ChordQuality {
  return DIATONIC_QUALITIES[nashville];
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
