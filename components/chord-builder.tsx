'use client';

import { useState } from 'react';
import { ChordEvent } from '@/lib/audio-engine';

interface ChordBuilderProps {
  chords: ChordEvent[];
  onChange: (chords: ChordEvent[]) => void;
}

export default function ChordBuilder({ chords, onChange }: ChordBuilderProps) {
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
        {chords.map((chord, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700"
          >
            <div className="flex-1">
              <label className="block text-sm text-zinc-400 mb-1">Nashville Number</label>
              <select
                value={chord.nashville}
                onChange={(e) => updateChord(index, { nashville: parseInt(e.target.value) as any })}
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
        ))}

        {chords.length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            No chords yet. Click &quot;Add Chord&quot; to get started.
          </div>
        )}
      </div>
    </div>
  );
}
