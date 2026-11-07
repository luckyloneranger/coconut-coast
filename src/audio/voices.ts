// The 8-voice limit, like 16-bit consoles: a new note takes a free voice, or
// the one that will finish soonest (the oldest) gives way. Plain logic.

export const MAX_VOICES = 8;

export interface VoiceSlot {
  end: number; // s (audio clock) when the note in this slot finishes
  stop: (() => void) | null; // cuts the note short if its slot is taken
}

export class VoicePool {
  readonly slots: VoiceSlot[] = Array.from({ length: MAX_VOICES }, () => ({ end: 0, stop: null }));

  /** A slot for a note from `start` to `end`; a busy one is cut short if all are in use. */
  take(start: number, end: number, stop: () => void): number {
    let best = 0;
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i].end <= start) {
        best = i;
        break;
      }
      if (this.slots[i].end < this.slots[best].end) best = i;
    }
    const slot = this.slots[best];
    if (slot.end > start && slot.stop) slot.stop(); // stealing a voice that's still sounding
    slot.end = end;
    slot.stop = stop;
    return best;
  }

  /** How many voices are sounding at time `t`. */
  busy(t: number): number {
    return this.slots.filter((s) => s.end > t).length;
  }
}
