'use client';

import { type Key, type KeyMode } from '@/lib/music-theory';

interface FretboardProps {
  keyRoot: Key;
  mode: KeyMode;
}

// Standard guitar tuning (low to high): E A D G B E
// MIDI note numbers for open strings
const OPEN_STRINGS = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4
const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'E'];
const NUM_FRETS = 15;

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Major pentatonic intervals from root: 1, 2, 3, 5, 6 (semitones: 0, 2, 4, 7, 9)
const MAJOR_PENTATONIC = [0, 2, 4, 7, 9];
// Minor pentatonic intervals from root: 1, b3, 4, 5, b7 (semitones: 0, 3, 5, 7, 10)
const MINOR_PENTATONIC = [0, 3, 5, 7, 10];

// Notes to show faded (not in pentatonic but useful to know)
// Major: 4th (5 semitones) and 7th (11 semitones)
const MAJOR_FADED = [5, 11];
// Minor: 2nd (2 semitones) and 6th (9 semitones)  
const MINOR_FADED = [2, 9];

function getNoteIndex(key: Key): number {
  return CHROMATIC_NOTES.indexOf(key);
}

function getScaleDegree(noteMidi: number, keyRoot: Key, mode: KeyMode): {
  inPentatonic: boolean;
  isRoot: boolean;
  isThird: boolean;
  isFaded: boolean;
  interval: number;
} {
  const keyIndex = getNoteIndex(keyRoot);
  const noteIndex = noteMidi % 12;
  const interval = (noteIndex - keyIndex + 12) % 12;
  
  const pentatonic = mode === 'minor' ? MINOR_PENTATONIC : MAJOR_PENTATONIC;
  const faded = mode === 'minor' ? MINOR_FADED : MAJOR_FADED;
  
  const inPentatonic = pentatonic.includes(interval);
  const isRoot = interval === 0;
  // Third: major 3rd (4 semitones) for major, minor 3rd (3 semitones) for minor
  const isThird = mode === 'major' ? interval === 4 : interval === 3;
  const isFaded = faded.includes(interval);
  
  return { inPentatonic, isRoot, isThird, isFaded, interval };
}

export default function Fretboard({ keyRoot, mode }: FretboardProps) {
  const fretWidth = 100 / (NUM_FRETS + 1); // +1 for nut/open position
  
  // Fret markers (dots) at frets 3, 5, 7, 9, 12 (double), 15
  const fretMarkers = [3, 5, 7, 9, 15];
  const doubleFretMarkers = [12];

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
      <h3 className="text-sm font-medium text-zinc-400 mb-3">
        {keyRoot} {mode === 'major' ? 'Major' : 'Minor'} Pentatonic
      </h3>
      
      <div className="relative overflow-x-auto">
        <div className="min-w-[600px]">
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

            {/* Strings and notes */}
            {OPEN_STRINGS.map((openNote, stringIndex) => (
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
                  
                  {/* Notes */}
                  {Array.from({ length: NUM_FRETS + 1 }).map((_, fret) => {
                    const noteMidi = openNote + fret;
                    const { inPentatonic, isRoot, isThird, isFaded } = getScaleDegree(noteMidi, keyRoot, mode);
                    
                    if (!inPentatonic && !isFaded) return null;
                    
                    let bgColor = 'bg-amber-500'; // Default pentatonic note
                    let textColor = 'text-zinc-900';
                    let opacity = '';
                    
                    if (isRoot) {
                      bgColor = 'bg-emerald-500';
                      textColor = 'text-white';
                    } else if (isThird) {
                      bgColor = 'bg-purple-500';
                      textColor = 'text-white';
                    } else if (isFaded) {
                      bgColor = 'bg-zinc-600';
                      textColor = 'text-zinc-400';
                      opacity = 'opacity-50';
                    }
                    
                    const noteName = CHROMATIC_NOTES[noteMidi % 12];
                    
                    return (
                      <div
                        key={fret}
                        className={`absolute w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${bgColor} ${textColor} ${opacity}`}
                        style={{
                          left: `calc(${(fret + 0.5) * fretWidth}% - 10px)`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                        title={`${noteName} (fret ${fret})`}
                      >
                        {noteName}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Root (1)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>{mode === 'major' ? '3rd' : 'b3rd'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Pentatonic</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-zinc-600 opacity-50" />
              <span>{mode === 'major' ? '4th & 7th' : '2nd & 6th'} (outside)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
