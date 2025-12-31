'use client';

import { ChordEvent } from '@/lib/audio-engine';
import { getDiatonicQuality, type ChordQuality, type KeyMode, type NashvilleNumber } from '@/lib/music-theory';

interface ChordBuilderProps {
  chords: ChordEvent[];
  mode: KeyMode;
  onChange: (chords: ChordEvent[]) => void;
}

export default function ChordBuilder({ chords, mode, onChange }: ChordBuilderProps) {
  const addChord = () => {
    onChange([...chords, { nashville: 1, bars: 1, beats: 0 }]);
  };

  const removeChord = (index: number) => {
    onChange(chords.filter((_, i) => i !== index));
  };

  const updateChord = (index: number, updates: Partial<ChordEvent>) => {
    const newChords = [...chords];
    newChords[index] = { ...newChords[index], ...updates };
    onChange(newChords);
  };

  const getEffectiveQuality = (chord: ChordEvent): ChordQuality => {
    return chord.quality ?? getDiatonicQuality(chord.nashville, mode);
  };

  const handleQualityChange = (index: number, quality: ChordQuality) => {
    const chord = chords[index];
    const diatonicQuality = getDiatonicQuality(chord.nashville, mode);
    // If selecting the diatonic quality, remove the override
    if (quality === diatonicQuality) {
      const { quality: _, ...rest } = chords[index];
      const newChords = [...chords];
      newChords[index] = rest as ChordEvent;
      onChange(newChords);
    } else {
      updateChord(index, { quality });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-amber-200">Chord Progression</h2>
        <button
          onClick={addChord}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
        >
          + Add Chord
        </button>
      </div>

      <div className="space-y-3">
        {chords.map((chord, index) => {
          const diatonicQuality = getDiatonicQuality(chord.nashville, mode);
          const isOverridden = chord.quality && chord.quality !== diatonicQuality;
          
          return (
            <div
              key={index}
              className={`flex items-center gap-4 p-4 bg-zinc-800 rounded-lg border ${isOverridden ? 'border-amber-600' : 'border-zinc-700'}`}
            >
              <div className="flex-1">
                <label className="block text-sm text-zinc-400 mb-1">Nashville</label>
                <select
                  value={chord.nashville}
                  onChange={(e) => {
                    const newNashville = parseInt(e.target.value) as NashvilleNumber;
                    // Reset quality override when changing nashville number
                    const { quality: _, ...rest } = chord;
                    updateChord(index, { ...rest, nashville: newNashville } as Partial<ChordEvent>);
                  }}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm text-zinc-400 mb-1">
                  Quality {isOverridden && <span className="text-amber-400">(override)</span>}
                </label>
                <select
                  value={getEffectiveQuality(chord)}
                  onChange={(e) => handleQualityChange(index, e.target.value as ChordQuality)}
                  className={`w-full px-3 py-2 bg-zinc-900 border rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isOverridden ? 'border-amber-600' : 'border-zinc-700'
                  }`}
                >
                  <option value="maj">Major {diatonicQuality === 'maj' ? '(default)' : ''}</option>
                  <option value="min">Minor {diatonicQuality === 'min' ? '(default)' : ''}</option>
                  <option value="dim">Dim {diatonicQuality === 'dim' ? '(default)' : ''}</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm text-zinc-400 mb-1">Bars</label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={chord.bars}
                  onChange={(e) => updateChord(index, { bars: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm text-zinc-400 mb-1">Beats</label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={chord.beats}
                  onChange={(e) => updateChord(index, { beats: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={() => removeChord(index)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          );
        })}

        {chords.length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            No chords yet. Click &quot;Add Chord&quot; to get started.
          </div>
        )}
      </div>
    </div>
  );
}
