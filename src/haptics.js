import { ImpactStyle } from '@capacitor/haptics';

// Graded haptics: a light tick for a fish up to a long happy pattern for a record.
// Web: vibration patterns in ms (Android browsers; Safari offers none). Native: Taptic styles.
export const HAPTICS = {
  catch: { web: 8, native: ImpactStyle.Light },
  golden: { web: [10, 40, 18], native: ImpactStyle.Medium },
  airCatch: { web: [10, 30, 10], native: ImpactStyle.Medium },
  waveRide: { web: [14, 30, 20], native: ImpactStyle.Medium },
  nearMiss: { web: 6, native: ImpactStyle.Light },
  bounce: { web: 28, native: ImpactStyle.Medium },
  hurt: { web: [45, 35, 70], native: ImpactStyle.Heavy },
  mission: { web: [12, 40, 12, 40, 24], success: true },
  frenzy: { web: [12, 30, 12, 30, 12], success: true },
  feast: { web: [12, 40, 24], success: true },
  record: { web: [20, 50, 20, 50, 60], success: true },
  shutter: { web: 14, native: ImpactStyle.Light },
};

// The cue for an effect kind (game event or UI moment); a golden catch feels stronger than a plain one.
export const hapticFor = (kind, detail) => HAPTICS[kind === 'catch' && detail === 'golden' ? 'golden' : kind];
