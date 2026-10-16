/** Human-readable labels for every proc emitted by the simulation engine. */
export const ENGINE_PROC_LABELS: Readonly<Record<string, string>> = {
  'underdog-pride': 'Underdog Pride',
  'stare-down': 'Stare Down',
  feisty: 'Feisty',
  'feisty-fatigue': 'Feisty Fatigue',
  'cool-counter': 'Cool Counter',
  'scan-counter': 'Scan Counter',
  'iron-hide-guard': 'Iron Hide Guard',
  'laser-auto-hit': 'Laser Hit',
  'laser-ignores-vanish': 'Laser Pierces Vanish',
  vanish: 'Vanish',
  'lucky-flip': 'Lucky Flip',
  'chaos-gaze-boost': 'Chaos Gaze Boost',
  'chaos-gaze-miss': 'Chaos Gaze Miss',
  'iron-hide': 'Iron Hide',
  crit: 'Critical Hit',
  pump: 'Pump',
  'scorch-armed': 'Scorch Armed',
  'calm-glow': 'Calm Glow',
  'scan-reveal': 'Scan Reveal',
  sidekick: 'Sidekick',
  scorch: 'Scorch',
  gust: 'Gust',
  charm: 'Charm',
  scan: 'Scan',
};

function titleCaseSlug(value: string): string {
  return value.split('-').filter(Boolean).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');
}

export function procLabel(procId: string): string {
  return ENGINE_PROC_LABELS[procId] ?? titleCaseSlug(procId);
}

/** Keep legacy engine narration human-readable without changing engine output or RNG. */
export function humanizeProcIds(text: string): string {
  return text.replace(/\b[a-z]+(?:-[a-z]+)+\b/g, (procId) => procLabel(procId));
}
