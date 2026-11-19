import { setupPwa as setup } from '@tidyeval/game-platform/pwa';
import { Capacitor } from '@capacitor/core';
import { t } from './i18n.js';

export function setupPwa(toast) {
  const $ = id => document.getElementById(id);
  return setup({ install: $('install'), update: $('update'), help: $('install-help'), closeHelp: $('install-help').querySelector('button'),
    t, toast, base: import.meta.env.BASE_URL, enabled: import.meta.env.PROD, native: Capacitor.isNativePlatform() });
}
