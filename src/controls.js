// Keyboard controls: Space works like holding the screen (dive while held), Escape pauses.
// Keys typed into buttons, inputs and dialogs keep their own meaning.
export const KEYS = { dive: 'Space', pause: 'Escape' };
export function keyAction(type, code, mode, inControl = false) {
  if (type === 'keydown' && code === KEYS.dive && mode === 'playing' && !inControl) return 'dive';
  if (type === 'keydown' && code === KEYS.pause && mode === 'playing') return 'pause';
  if (type === 'keyup' && code === KEYS.dive) return 'release';
  return null;
}
