'use client';

import { type Key, type KeyMode, type ChordQuality } from '@/lib/music-theory';

interface FretboardProps {
  // For pentatonic scale display
  scaleRoot: Key;
  scaleMode: KeyMode;
  // For chord tone highlighting
  chordRoot: Key;
  chordQuality: ChordQuality;
  chordName: string;
}

// Standard guitar tuning (low to high): E A D G B E
// MIDI note numbers for open strings
const OPEN_STRINGS = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4
const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'E'];
const NUM_FRETS = 22;

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Major pentatonic intervals from root: 1, 2, 3, 5, 6 (semitones: 0, 2, 4, 7, 9)
const MAJOR_PENTATONIC = [0, 2, 4, 7, 9];
// Minor pentatonic intervals from root: 1, b3, 4, 5, b7 (semitones: 0, 3, 5, 7, 10)
const MINOR_PENTATONIC = [0, 3, 5, 7, 10];

function getNoteIndex(key: Key): number {
  return CHROMATIC_NOTES.indexOf(key);
}

function isInPentatonic(noteMidi: number, scaleRoot: Key, scaleMode: KeyMode): boolean {
  const rootIndex = getNoteIndex(scaleRoot);
  const noteIndex = noteMidi % 12;
  const interval = (noteIndex - rootIndex + 12) % 12;
  
  const pentatonic = scaleMode === 'minor' ? MINOR_PENTATONIC : MAJOR_PENTATONIC;
  return pentatonic.includes(interval);
}

function getChordTone(noteMidi: number, chordRoot: Key, chordQuality: ChordQuality): {
  isRoot: boolean;
  isThird: boolean;
  isFifth: boolean;
} {
  const rootIndex = getNoteIndex(chordRoot);
  const noteIndex = noteMidi % 12;
  const interval = (noteIndex - rootIndex + 12) % 12;
  
  const isRoot = interval === 0;
  
  // Third depends on quality
  let thirdInterval: number;
  if (chordQuality === 'maj') {
    thirdInterval = 4; // Major 3rd
  } else if (chordQuality === 'min') {
    thirdInterval = 3; // Minor 3rd
  } else {
    thirdInterval = 3; // Diminished also has minor 3rd
  }
  const isThird = interval === thirdInterval;
  
  // Fifth depends on quality
  let fifthInterval: number;
  if (chordQuality === 'dim') {
    fifthInterval = 6; // Diminished 5th
  } else {
    fifthInterval = 7; // Perfect 5th
  }
  const isFifth = interval === fifthInterval;
  
  return { isRoot, isThird, isFifth };
}

export default function Fretboard({ scaleRoot, scaleMode, chordRoot, chordQuality, chordName }: FretboardProps) {
  const fretWidth = 100 / (NUM_FRETS + 1); // +1 for nut/open position
  
  // Fret markers (dots) at frets 3, 5, 7, 9, 12 (double), 15, 17, 19, 21
  const fretMarkers = [3, 5, 7, 9, 15, 17, 19, 21];
  const doubleFretMarkers = [12];

  // Get interval names for legend
  const thirdName = chordQuality === 'maj' ? '3rd' : 'b3rd';
  const fifthName = chordQuality === 'dim' ? 'b5th' : '5th';

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
      <h3 className="text-sm font-medium text-zinc-400 mb-3">
        {scaleRoot} {scaleMode === 'major' ? 'Major' : 'Minor'} Pentatonic — <span className="text-amber-400">{chordName}</span> highlighted
      </h3>
      
      <div className="relative">
        <div>
          {/* Fret numbers */}
          <div className="flex mb-1" style={{ paddingLeft: '24px' }}>
            <div className="text-[10px] text-zinc-600 text-center" style={{ width: `${fretWidth}%` }}>
              0
            </div>
            {Array.from({ length: NUM_FRETS }).map((_, fret) => (
              <div
                key={fret}
                className="text-[10px] text-zinc-600 text-center"
                style={{ width: `${fretWidth}%` }}
              >
                {fret + 1}
              </div>
            ))}
          </div>

          {/* Fretboard */}
          <div className="relative bg-amber-950 rounded border border-amber-900">
            {/* Fret markers (dots) */}
            <div className="absolute inset-0 pointer-events-none">
              {fretMarkers.map((fret) => (
                <div
                  key={fret}
                  className="absolute w-2 h-2 bg-zinc-600 rounded-full opacity-40"
                  style={{
                    left: `calc(${(fret + 0.5) * fretWidth}% + 12px)`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              ))}
              {doubleFretMarkers.map((fret) => (
                <div key={fret}>
                  <div
                    className="absolute w-2 h-2 bg-zinc-600 rounded-full opacity-40"
                    style={{
                      left: `calc(${(fret + 0.5) * fretWidth}% + 12px)`,
                      top: '30%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 bg-zinc-600 rounded-full opacity-40"
                    style={{
                      left: `calc(${(fret + 0.5) * fretWidth}% + 12px)`,
                      top: '70%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Strings and notes - reversed so high E is on top, low E on bottom */}
            {[...OPEN_STRINGS].reverse().map((openNote, reversedIndex) => {
              const stringIndex = OPEN_STRINGS.length - 1 - reversedIndex;
              return (
              <div key={stringIndex} className="flex items-center relative">
                {/* String name */}
                <div className="w-6 text-[10px] text-zinc-500 text-center shrink-0">
                  {STRING_NAMES[stringIndex]}
                </div>
                
                {/* String line */}
                <div className="flex-1 relative h-8">
                  {/* The string itself */}
                  <div 
                    className="absolute left-0 right-0 bg-zinc-400"
                    style={{
                      top: '50%',
                      height: `${1 + (5 - stringIndex) * 0.3}px`,
                      transform: 'translateY(-50%)',
                    }}
                  />
                  
                  {/* Fret lines */}
                  {Array.from({ length: NUM_FRETS + 1 }).map((_, fret) => (
                    <div
                      key={fret}
                      className={`absolute top-0 bottom-0 ${fret === 0 ? 'w-1 bg-zinc-300' : 'w-px bg-zinc-600'}`}
                      style={{ left: `${fret * fretWidth}%` }}
                    />
                  ))}
                  
                  {/* Notes - show pentatonic + always show chord tones (dimmed if outside pentatonic) */}
                  {Array.from({ length: NUM_FRETS + 1 }).map((_, fret) => {
                    const noteMidi = openNote + fret;
                    const inPentatonic = isInPentatonic(noteMidi, scaleRoot, scaleMode);
                    const { isRoot, isThird, isFifth } = getChordTone(noteMidi, chordRoot, chordQuality);
                    const isChordTone = isRoot || isThird || isFifth;
                    
                    // Show if in pentatonic OR if it's a chord tone
                    if (!inPentatonic && !isChordTone) {
                      return null;
                    }
                    
                    let bgColor = 'bg-zinc-600';
                    let textColor = 'text-zinc-400';
                    let ringStyle = '';
                    let opacity = '';
                    
                    if (isRoot) {
                      bgColor = 'bg-emerald-500';
                      textColor = 'text-white';
                      ringStyle = inPentatonic ? 'ring-2 ring-emerald-300' : '';
                      opacity = inPentatonic ? '' : 'opacity-40';
                    } else if (isThird) {
                      bgColor = 'bg-purple-500';
                      textColor = 'text-white';
                      ringStyle = inPentatonic ? 'ring-2 ring-purple-300' : '';
                      opacity = inPentatonic ? '' : 'opacity-40';
                    } else if (isFifth) {
                      bgColor = 'bg-orange-500';
                      textColor = 'text-white';
                      ringStyle = inPentatonic ? 'ring-2 ring-orange-300' : '';
                      opacity = inPentatonic ? '' : 'opacity-40';
                    }
                    
                    const noteName = CHROMATIC_NOTES[noteMidi % 12];
                    
                    return (
                      <div
                        key={fret}
                        className={`absolute w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${bgColor} ${textColor} ${ringStyle} ${opacity}`}
                        style={{
                          left: `calc(${(fret + 0.5) * fretWidth}% - 10px)`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                        title={`${noteName} (fret ${fret})${isChordTone ? ` - ${isRoot ? 'Root' : isThird ? thirdName : fifthName}${!inPentatonic ? ' (outside pentatonic)' : ''}` : ''}`}
                      >
                        {noteName}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500 ring-1 ring-emerald-300" />
              <span>Root ({chordRoot})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500 ring-1 ring-purple-300" />
              <span>{thirdName}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500 ring-1 ring-orange-300" />
              <span>{fifthName}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-zinc-600" />
              <span>Pentatonic</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-40" />
              <span>Outside pentatonic</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
